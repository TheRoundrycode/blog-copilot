"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icon";
import {
  getUserProfile,
  getCrawledContent,
  getLearningData,
  isOnboardingComplete,
  generateId,
} from "@/lib/store";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_ACTIONS = [
  { label: "토픽 탐색", prompt: "내 블로그에 적합한 새로운 토픽을 탐색해주세요.", icon: "lightbulb" },
  { label: "가설 검증", prompt: "다음 가설을 검증해주세요: ", icon: "science" },
  { label: "콘텐츠 전략", prompt: "현재 블로그의 콘텐츠 전략을 분석하고 개선점을 제안해주세요.", icon: "strategy" },
  { label: "SEO 분석", prompt: "내 블로그의 SEO 현황을 분석해주세요.", icon: "search" },
];

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!isOnboardingComplete()) {
      router.replace("/onboarding");
    }
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || streaming) return;

    const userMsg: ChatMsg = {
      id: generateId(),
      role: "user",
      content: content.trim(),
    };
    const aiMsgId = generateId();

    const newMessages = [...messages, userMsg];
    setMessages([...newMessages, { id: aiMsgId, role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const profile = getUserProfile();
      const crawledContent = getCrawledContent();
      const learningData = getLearningData();

      const apiMessages = newMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          profile,
          crawledContent,
          learningData,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          setMessages([
            ...newMessages,
            { id: aiMsgId, role: "assistant", content: full },
          ]);
        }
      }
    } catch (error) {
      console.error("채팅 오류:", error);
    }
    setStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <AppShell title="AI 채팅">
      <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] max-w-3xl mx-auto">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
                <Icon name="chat" size={32} className="text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-on-surface">
                  무엇이든 물어보세요
                </h2>
                <p className="text-sm text-on-surface-variant">
                  토픽 탐색, 가설 검증, 콘텐츠 전략 등 자유롭게 대화하세요.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    className="flex items-center gap-2 bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer text-left"
                  >
                    <Icon name={action.icon} size={18} className="text-primary shrink-0" />
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-on-primary rounded-br-md"
                    : "bg-surface-container text-on-surface rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none text-inherit">
                    <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-outline-variant bg-surface">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              disabled={streaming}
              rows={1}
              className="flex-1 resize-none bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className="p-3 bg-primary text-on-primary rounded-xl disabled:opacity-30 transition-opacity cursor-pointer"
            >
              <Icon name="send" size={20} />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
