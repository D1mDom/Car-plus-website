import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INVENTORY = [
  { id: "1", name: "Toyota Camry SE", year: 2020, price: 28000, bodyType: "Sedan", fuelType: "Petrol", color: "White", condition: "Excellent", status: "ready" },
  { id: "2", name: "Honda Civic EX", year: 2018, price: 22500, bodyType: "Sedan", fuelType: "Petrol", color: "Black", condition: "Very Good", status: "onroad" },
  { id: "3", name: "Mercedes-Benz E-Class", year: 2021, price: 65000, bodyType: "Sedan", fuelType: "Petrol", color: "Silver", condition: "Excellent", status: "luxury" },
  { id: "4", name: "BMW 3 Series M Sport", year: 2019, price: 45000, bodyType: "Sedan", fuelType: "Petrol", color: "Blue", condition: "Excellent", status: "plate" },
  { id: "5", name: "Toyota Corolla LE", year: 2020, price: 21000, bodyType: "Sedan", fuelType: "Petrol", color: "Red", condition: "Very Good", status: "ready" },
  { id: "6", name: "Lexus ES 350", year: 2022, price: 58000, bodyType: "Sedan", fuelType: "Petrol", color: "Black", condition: "Excellent", status: "luxury" },
  { id: "7", name: "Toyota Prius XLE", year: 2022, price: 32000, bodyType: "Hatchback", fuelType: "Hybrid", color: "Silver", condition: "Excellent", status: "ready" },
];

const SYSTEM_PROMPT = `You are a friendly and knowledgeable car advisor for our dealership. Your goal is to help customers find the perfect vehicle based on their preferences, needs, and budget.

IMPORTANT LANGUAGE RULE: 
- If the customer writes in Khmer (ភាសាខ្មែរ), you MUST respond entirely in Khmer.
- If the customer writes in English, respond in English.
- Always match the language the customer uses.

Here is our current inventory:
${JSON.stringify(INVENTORY, null, 2)}

Guidelines:
- Be warm, professional, and helpful
- Ask clarifying questions to understand customer needs (budget, fuel preference, size, features, etc.)
- Recommend cars from our inventory that match their criteria
- Highlight key features and benefits of recommended vehicles
- When recommending a car, mention its ID so users can easily find it
- If no cars match exactly, suggest the closest alternatives
- Be honest about limitations and suggest visiting the showroom for test drives
- Keep responses concise but informative (2-4 sentences per point)
- Use formatting like bullet points when listing multiple options

Khmer translation reference for common terms:
- Car/Vehicle: រថយន្ត
- Price: តម្លៃ
- Year: ឆ្នាំ
- Color: ពណ៌
- Fuel: ប្រេងឥន្ធនៈ
- Budget: ថវិកា
- Luxury: ប្រណីត
- Sedan: សេដង់
- Excellent condition: ស្ថានភាពល្អប្រសើរ`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Car Advisor request:", { messageCount: messages?.length });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from AI gateway");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Car advisor error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
