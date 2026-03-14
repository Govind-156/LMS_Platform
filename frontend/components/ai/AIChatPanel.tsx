"use client";

import { useCallback, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const SEND_DEBOUNCE_MS = 2000;
const RATE_LIMIT_MESSAGE = "AI tutor is busy. Please try again in a few seconds.";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "Explain this concept",
  "Summarize this lesson",
  "Give practice questions",
];

interface AIChatPanelProps {
  videoId: number;
  videoTitle?: string;
  className?: string;
}

export function AIChatPanel({ videoId, videoTitle, className = "" }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSendTimeRef = useRef<number>(0);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  const performSend = useCallback(
    async (trimmed: string) => {
      if (!trimmed || loading) return;
      setError(null);
      setInput("");
      const userMessage: Message = { role: "user", content: trimmed };
      setMessages((prev) => {
        const next = [...prev, userMessage];
        setTimeout(scrollToBottom, 0);
        return next;
      });
      setLoading(true);
      try {
        const { data } = await api.post<{ answer: string }>("/ai/chat", {
          video_id: videoId,
          question: trimmed,
        });
        setMessages((prev) => {
          const next = [...prev, { role: "assistant" as const, content: data.answer }];
          setTimeout(scrollToBottom, 0);
          return next;
        });
      } catch (err: unknown) {
        const status = err && typeof err === "object" && "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
        const serverMessage = err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
        if (status === 429) {
          setError(RATE_LIMIT_MESSAGE);
        } else {
          setError(serverMessage ?? "Failed to get a response.");
        }
      } finally {
        setLoading(false);
      }
    },
    [videoId, loading, scrollToBottom]
  );

  const sendMessage = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || loading) return;

      const now = Date.now();
      if (now - lastSendTimeRef.current < SEND_DEBOUNCE_MS) {
        setError("Please wait a moment before sending another message.");
        return;
      }

      lastSendTimeRef.current = now;
      performSend(trimmed);
    },
    [loading, performSend]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage]
  );

  return (
    <Card className={cn("flex flex-col overflow-hidden rounded-xl border-slate-200 dark:border-slate-800", className)}>
      <CardHeader className="shrink-0 border-b border-slate-200 dark:border-slate-800 py-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary shrink-0" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">AI Tutor</h3>
        </div>
        {videoTitle && (
          <p className="body-muted mt-1 truncate" title={videoTitle}>
            About: {videoTitle}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col flex-1 min-h-0 p-0">
        <ScrollArea className="flex-1 min-h-[200px] max-h-[320px]">
          <div ref={scrollRef} className="p-4 sm:p-5 space-y-4">
            {messages.length === 0 && !loading && (
              <div className="space-y-3">
                <p className="body-muted">
                  Ask questions about this lesson.
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <Button
                      key={prompt}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => sendMessage(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm max-w-[85%]",
                    msg.role === "user"
                      ? "bg-primary/10 text-slate-900 dark:text-slate-100"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  )}
                >
                  {msg.role === "assistant" && (
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                      AI Tutor
                    </span>
                  )}
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 body-muted">
                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                Thinking…
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this lesson…"
              disabled={loading}
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
              maxLength={4000}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} className="shrink-0 h-11 w-11">
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
