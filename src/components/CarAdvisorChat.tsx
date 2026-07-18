import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User, Loader2, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Message { role: "user" | "assistant"; content: string; }
interface SpeechRecognitionEvent extends Event { results: SpeechRecognitionResultList; resultIndex: number; }
interface SpeechRecognitionErrorEvent extends Event { error: string; }
interface SpeechRecognition extends EventTarget { continuous: boolean; interimResults: boolean; lang: string; start(): void; stop(): void; onresult: ((event: SpeechRecognitionEvent) => void) | null; onerror: ((event: SpeechRecognitionErrorEvent) => void) | null; onend: (() => void) | null; }

declare global { interface Window { SpeechRecognition: new () => SpeechRecognition; webkitSpeechRecognition: new () => SpeechRecognition; } }

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/car-advisor`;

export function CarAdvisorChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "សួស្តី! ខ្ញុំជាអ្នកប្រឹក្សាឡានរបស់អ្នក។ ខ្ញុំអាចជួយអ្នកស្វែងរកយានយន្តដ៏ល្អឥតខ្ចោះដោយផ្អែកលើចំណូលចិត្ត និងថវិការបស់អ្នក។ តើអ្នកកំពុងស្វែងរកអ្វីសម្រាប់ឡានបន្ទាប់របស់អ្នក?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  const isSpeechSupported = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const startListening = useCallback(() => {
    if (!isSpeechSupported) { toast({ title: "មិនគាំទ្រ", description: "ការបញ្ចូលសំឡេងមិនត្រូវបានគាំទ្រនៅក្នុងកម្មវិធីរុករករបស់អ្នក។ សាកល្បង Chrome ឬ Edge។", variant: "destructive" }); return; }
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "km-KH";
    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ""; let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript; else interimTranscript += transcript;
      }
      if (finalTranscript) setInput((prev) => prev + finalTranscript); else if (interimTranscript) setInput(interimTranscript);
    };
    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error); setIsListening(false);
      if (event.error === "not-allowed") toast({ title: "ការចូលប្រើមីក្រូហ្វូនត្រូវបានបដិសេធ", description: "សូមអនុញ្ញាតការចូលប្រើមីក្រូហ្វូនដើម្បីប្រើការបញ្ចូលសំឡេង។", variant: "destructive" });
      else if (event.error !== "aborted") toast({ title: "កំហុសសំឡេង", description: "មិនអាចស្គាល់សំឡេង។ សូមព្យាយាមម្តងទៀត។", variant: "destructive" });
    };
    recognitionRef.current.onend = () => setIsListening(false);
    try { recognitionRef.current.start(); setIsListening(true); } catch (error) { console.error("Failed to start speech recognition:", error); setIsListening(false); }
  }, [isSpeechSupported, toast]);

  const stopListening = useCallback(() => { if (recognitionRef.current) { recognitionRef.current.stop(); setIsListening(false); } }, []);
  const toggleListening = useCallback(() => { if (isListening) stopListening(); else startListening(); }, [isListening, startListening, stopListening]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (isListening) stopListening();
    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages); setInput(""); setIsLoading(true);
    let assistantContent = "";
    try {
      const response = await fetch(CHAT_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }, body: JSON.stringify({ messages: newMessages }) });
      if (!response.ok) throw new Error("Failed to get response");
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex); buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim(); if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr); const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > newMessages.length) return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "សុំអភ័យទោស មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិច។" }]);
    } finally { setIsLoading(false); }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className={cn("fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg", "bg-primary hover:bg-primary/90 text-primary-foreground", "transition-all duration-300 hover:scale-105", isOpen && "hidden")} size="icon">
        <MessageCircle className="h-6 w-6" />
      </Button>

      <div className={cn("fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)]", "bg-background border border-border rounded-2xl shadow-2xl", "flex flex-col overflow-hidden", "transition-all duration-300 ease-out", isOpen ? "h-[500px] opacity-100 scale-100" : "h-0 opacity-0 scale-95 pointer-events-none")}>
        <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
          <div className="flex items-center gap-2"><Bot className="h-5 w-5" /><span className="font-semibold">អ្នកប្រឹក្សាឡាន</span></div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></Button>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={cn("flex gap-2", message.role === "user" ? "justify-end" : "justify-start")}>
                {message.role === "assistant" && (<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Bot className="h-4 w-4 text-primary" /></div>)}
                <div className={cn("max-w-[80%] rounded-2xl px-4 py-2 text-sm", message.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md")}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "user" && (<div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0"><User className="h-4 w-4 text-secondary-foreground" /></div>)}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-2 justify-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Bot className="h-4 w-4 text-primary" /></div>
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            {isSpeechSupported && (
              <Button onClick={toggleListening} disabled={isLoading} size="icon" variant={isListening ? "destructive" : "outline"} className={cn("shrink-0 transition-all", isListening && "animate-pulse")} title={isListening ? "ឈប់ស្តាប់" : "ចាប់ផ្តើមបញ្ចូលសំឡេង"}>
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder={isListening ? "កំពុងស្តាប់..." : "សួរអំពីឡាន..."} disabled={isLoading} className="flex-1" />
            <Button onClick={sendMessage} disabled={!input.trim() || isLoading} size="icon" className="shrink-0"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </>
  );
}
