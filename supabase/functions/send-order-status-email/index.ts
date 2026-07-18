import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderStatusEmailRequest {
  orderId: string;
  newStatus: string;
}

const statusMessages: Record<string, { subject: string; message: string }> = {
  pending: {
    subject: "Order Received - Car Plus",
    message: "Your order has been received and is being processed.",
  },
  confirmed: {
    subject: "Order Confirmed - Car Plus",
    message: "Great news! Your order has been confirmed and is being prepared.",
  },
  processing: {
    subject: "Order Processing - Car Plus",
    message: "Your order is currently being processed. We'll update you soon!",
  },
  shipped: {
    subject: "Order Shipped - Car Plus",
    message: "Your order has been shipped and is on its way to you!",
  },
  delivered: {
    subject: "Order Delivered - Car Plus",
    message: "Your order has been delivered. Thank you for shopping with Car Plus!",
  },
  cancelled: {
    subject: "Order Cancelled - Car Plus",
    message: "Your order has been cancelled. If you have any questions, please contact us.",
  },
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-order-status-email function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - require admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase configuration missing");
    }

    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authSupabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const callerId = claimsData.claims.sub;
    console.log("Authenticated caller:", callerId);

    // Check if caller is an admin
    const { data: adminData, error: adminError } = await authSupabase
      .from("admin_users")
      .select("id")
      .eq("user_id", callerId)
      .maybeSingle();

    if (adminError || !adminData) {
      console.error("Admin check failed:", adminError);
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Admin access verified for user:", callerId);

    const { orderId, newStatus }: OrderStatusEmailRequest = await req.json();
    console.log(`Processing order ${orderId} with status ${newStatus}`);

    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl!, supabaseServiceKey);

    // Fetch order and user details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      order.user_id
    );

    if (userError || !userData.user?.email) {
      console.error("User not found:", userError);
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userEmail = userData.user.email;
    const statusInfo = statusMessages[newStatus] || {
      subject: `Order Status Update - Car Plus`,
      message: `Your order status has been updated to: ${newStatus}`,
    };

    console.log(`Sending email to ${userEmail} for order ${orderId}`);

    const emailResponse = await resend.emails.send({
      from: "Car Plus <onboarding@resend.dev>",
      to: [userEmail],
      subject: statusInfo.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0d9488, #14b8a6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .order-id { background: #e2e8f0; padding: 10px 15px; border-radius: 4px; display: inline-block; margin: 15px 0; }
            .status-badge { background: #0d9488; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; text-transform: uppercase; font-size: 12px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Car Plus</h1>
              <p>Order Status Update</p>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>${statusInfo.message}</p>
              <p class="order-id"><strong>Order ID:</strong> ${orderId.slice(0, 8)}...</p>
              <p><strong>Status:</strong> <span class="status-badge">${newStatus}</span></p>
              <p><strong>Total Amount:</strong> $${order.total_amount.toLocaleString()}</p>
              <p>If you have any questions about your order, please don't hesitate to contact us.</p>
            </div>
            <div class="footer">
              <p>Thank you for choosing Car Plus!</p>
              <p>© 2024 Car Plus. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-order-status-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
