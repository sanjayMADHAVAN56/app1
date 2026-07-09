import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, Sparkles, AlertCircle, X, HelpCircle } from "lucide-react";
import { ChatMessage } from "../types";

interface ChatAssistantProps {
  onClose?: () => void;
  onNavigateToProduct?: (id: number) => void;
}

const QUICK_PROMPTS = [
  "What is the 45-Point certified check?",
  "Recommend a premium refurbished laptop",
  "How long is the warranty?",
  "What's the difference between Like New and Excellent?",
];

export default function ChatAssistant({ onClose, onNavigateToProduct }: ChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "bot",
      text: "Hello! I'm **OG-Assistant**, your AI Refurbished Electronics Specialist. 🌟\n\nI can help you search our catalog, explain our customized diagnostic testing certifications, check product warranties, and give shopping suggestions. Try asking me anything about our gadgets!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });
      const data = await response.json();

      const botMsg: ChatMessage = {
        sender: "bot",
        text: data.reply || "I am currently initializing my language models. Please try again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        sender: "bot",
        text: "Apologies, my diagnostic systems detected a communication anomaly. We are operating on our secure standby server. All refurbished orders carry an automatic 1-Year warranty!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      
      {/* Bot Header */}
      <div className="bg-gradient-to-r from-emerald-800/80 to-teal-900/80 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-500 rounded-lg text-slate-900">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-sm text-slate-100 flex items-center gap-1">
              OG AI Specialist
              <Sparkles className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400 animate-pulse" />
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              ONLINE • GEMINI AGENT
            </span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`p-2 rounded-lg h-8 w-8 flex items-center justify-center shrink-0 ${
              msg.sender === "user" ? "bg-emerald-600/20 text-emerald-400" : "bg-slate-800 text-teal-300"
            }`}>
              {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            
            <div className="max-w-[80%] space-y-1">
              <div className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-sm ${
                msg.sender === "user" 
                  ? "bg-emerald-600 text-white rounded-tr-none" 
                  : "bg-slate-800/95 text-slate-200 rounded-tl-none border border-slate-700/50"
              }`}>
                {/* Simplified custom renderer to preserve custom bolds and lists */}
                <div className="whitespace-pre-wrap leading-relaxed font-sans">
                  {msg.text.split("\n\n").map((para, pIdx) => {
                    // Check if bullet point list
                    if (para.startsWith("- ") || para.startsWith("* ")) {
                      return (
                        <ul key={pIdx} className="list-disc pl-4 space-y-1.5 my-2">
                          {para.split("\n").map((li, lIdx) => (
                            <li key={lIdx}>
                              {li.replace(/^[\s-*]+/, "").split("**").map((chunk, cIdx) => 
                                cIdx % 2 === 1 ? <strong key={cIdx} className="text-emerald-400 font-semibold">{chunk}</strong> : chunk
                              )}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p key={pIdx} className="mb-2">
                        {para.split("**").map((chunk, cIdx) => 
                          cIdx % 2 === 1 ? <strong key={cIdx} className="text-emerald-400 font-semibold">{chunk}</strong> : chunk
                        )}
                      </p>
                    );
                  })}
                </div>
              </div>
              <span className="block text-[10px] text-slate-500 font-mono text-right">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5">
            <div className="p-2 rounded-lg h-8 w-8 flex items-center justify-center bg-slate-800 text-teal-300">
              <Bot className="h-4 w-4" />
            </div>
            <div className="px-4 py-3 bg-slate-800/70 border border-slate-700/50 rounded-2xl rounded-tl-none flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompts shortcuts */}
      <div className="p-3 border-t border-slate-800/50 bg-slate-900/60 overflow-x-auto whitespace-nowrap flex gap-2 no-scrollbar">
        {QUICK_PROMPTS.map((prompt, pIdx) => (
          <button
            key={pIdx}
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="flex items-center gap-1 text-[11px] font-sans font-medium px-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 text-emerald-300 hover:text-emerald-200 border border-slate-700 rounded-full transition-all shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HelpCircle className="h-3 w-3" />
            {prompt}
          </button>
        ))}
      </div>

      {/* Message Inputs */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Type a message or ask for details..."
            className="flex-1 bg-slate-950 text-slate-200 placeholder-slate-500 text-xs sm:text-sm border border-slate-800 rounded-xl px-4 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-slate-900 disabled:text-slate-600 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-950/20 shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
