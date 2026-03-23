"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Icon from "@/components/Icon";
import {
  saveUserProfile,
  saveBlog,
  saveClusters,
  saveArticles,
  saveCrawledContent,
  generateId,
} from "@/lib/store";
import type { Cluster, Article, CrawledArticle } from "@/lib/types";

type Phase = "welcome" | "url-input" | "chat";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("welcome");
  const [blogUrl, setBlogUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [crawledArticles, setCrawledArticles] = useState<CrawledArticle[]>([]);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleScan = async () => {
    const trimmed = blogUrl.trim();
    if (!trimmed) {
      setUrlError("URL을 입력해주세요.");
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      setUrlError("올바른 URL 형식이 아닙니다. (예: https://blog.naver.com/myblog)");
      return;
    }
    setUrlError("");
    setScanning(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      clearInterval(progressInterval);
      setProgress(100);

      if (data.error) {
        setUrlError(data.error);
        setScanning(false);
      } else if (data.articles && data.articles.length > 0) {
        setCrawledArticles(data.articles);
        saveCrawledContent(data.articles);
        setTimeout(() => {
          setScanning(false);
          setPhase("chat");
          startAIConversation(data.articles);
        }, 500);
      } else {
        setUrlError("글을 찾을 수 없습니다. URL을 확인해주세요.");
        setScanning(false);
      }
    } catch {
      clearInterval(progressInterval);
      setUrlError("서버에 연결할 수 없습니다. 네트워크를 확인해주세요.");
      setScanning(false);
    }
  };

  const startAIConversation = async (articles: CrawledArticle[]) => {
    const aiMsgId = generateId();
    setMessages([{ id: aiMsgId, role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/onboarding-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: "블로그 분석을 시작해주세요. 크롤링 결과를 기반으로 대화를 시작합니다.",
            },
          ],
          crawledArticles: articles,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `서버 오류 (${res.status})`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          const displayContent = extractDisplayContent(fullContent);
          setMessages([{ id: aiMsgId, role: "assistant", content: displayContent }]);
        }
      }

      checkOnboardingComplete(fullContent);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "알 수 없는 오류";
      setMessages([
        {
          id: aiMsgId,
          role: "assistant",
          content: `AI 연결에 문제가 발생했습니다: ${errMsg}\n\n페이지를 새로고침하거나 다시 시도해주세요.`,
        },
      ]);
    }
    setStreaming(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;

    const userMsg: ChatMsg = {
      id: generateId(),
      role: "user",
      content: input.trim(),
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
      const apiMessages = newMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const res = await fetch("/api/onboarding-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, crawledArticles }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `서버 오류 (${res.status})`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          const displayContent = extractDisplayContent(fullContent);
          setMessages([
            ...newMessages,
            { id: aiMsgId, role: "assistant", content: displayContent },
          ]);
        }
      }

      checkOnboardingComplete(fullContent);
    } catch (error) {
      console.error("메시지 전송 오류:", error);
    }
    setStreaming(false);
  };

  const extractDisplayContent = (content: string): string => {
    const markerIndex = content.indexOf("---ONBOARDING_COMPLETE---");
    if (markerIndex !== -1) {
      return content.substring(0, markerIndex).trim();
    }
    return content;
  };

  const checkOnboardingComplete = (content: string) => {
    const markerIndex = content.indexOf("---ONBOARDING_COMPLETE---");
    if (markerIndex === -1) return;

    const jsonStr = content.substring(markerIndex + "---ONBOARDING_COMPLETE---".length).trim();
    try {
      const data = JSON.parse(jsonStr);
      setOnboardingDone(true);

      const blogId = generateId();
      const now = new Date().toISOString();

      saveUserProfile({
        id: generateId(),
        blogUrl,
        blogName: data.blogName || new URL(blogUrl).hostname,
        platform: data.platform || "other",
        purpose: data.purpose || "",
        goals: data.goals || [],
        targetAudience: data.targetAudience || "",
        finalObjective: data.finalObjective || "",
        analyticsData: data.analyticsData,
        analyticsSummary: data.analyticsSummary || "",
        onboardingCompletedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      saveBlog({
        id: blogId,
        user_id: "local_user",
        url: blogUrl,
        name: data.blogName || new URL(blogUrl).hostname,
        total_articles: crawledArticles.length,
        created_at: now,
      });

      if (data.clusters && Array.isArray(data.clusters)) {
        const clusterEntities: Cluster[] = data.clusters.map(
          (c: { name: string; color: string; articleCount: number }, i: number) => ({
            id: `cluster_${generateId()}_${i}`,
            blog_id: blogId,
            name: c.name,
            color: c.color || `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            article_count: c.articleCount || 0,
          })
        );
        saveClusters(clusterEntities);

        const articleEntities: Article[] = crawledArticles.map((a, i) => {
          const matchedCluster = clusterEntities.find((ce) =>
            a.title?.toLowerCase().includes(ce.name.toLowerCase())
          );
          return {
            id: `article_${generateId()}_${i}`,
            blog_id: blogId,
            cluster_id: matchedCluster?.id,
            title: a.title,
            url: a.url,
            status: "published" as const,
            meta_description: a.description,
            word_count: 0,
            created_at: now,
            updated_at: now,
          };
        });
        saveArticles(articleEntities);
      }
    } catch (e) {
      console.error("온보딩 데이터 파싱 오류:", e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Welcome */}
      {phase === "welcome" && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg text-center space-y-8 animate-in fade-in">
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                <Icon name="edit_note" size={32} className="text-primary" />
              </div>
              <h1 className="text-3xl font-bold font-serif text-on-surface">
                AI 블로그 코파일럿
              </h1>
              <p className="text-on-surface-variant text-lg">
                블로그 성장을 위한 AI 파트너
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setPhase("url-input")}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <Icon name="rocket_launch" size={20} />
                <span>시작하기</span>
              </button>
              <p className="text-xs text-on-surface-variant">
                블로그 URL을 입력하면 AI가 분석하고 전략을 수립합니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* URL Input */}
      {phase === "url-input" && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg space-y-6 animate-in fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-on-surface">
                블로그 URL을 입력하세요
              </h2>
              <p className="text-on-surface-variant">
                AI가 블로그를 분석하고 대화를 시작합니다
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="url"
                value={blogUrl}
                onChange={(e) => {
                  setBlogUrl(e.target.value);
                  setUrlError("");
                }}
                placeholder="https://blog.naver.com/myblog"
                className={`w-full px-4 py-3 bg-surface-container-lowest border rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                  urlError ? "border-error" : "border-outline-variant"
                }`}
              />
              {urlError && (
                <p className="text-sm text-error flex items-center gap-1">
                  <Icon name="error" size={16} />
                  {urlError}
                </p>
              )}
            </div>

            {scanning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">블로그 스캔 중...</span>
                  <span className="text-primary font-medium">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleScan}
              disabled={scanning}
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {scanning ? "스캔 중..." : "블로그 분석 시작"}
            </button>

            <button
              onClick={() => setPhase("welcome")}
              className="w-full py-2 text-on-surface-variant text-sm hover:text-on-surface transition-colors cursor-pointer"
            >
              뒤로 가기
            </button>
          </div>
        </div>
      )}

      {/* Chat Phase */}
      {phase === "chat" && (
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-lowest">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name="smart_toy" size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-on-surface text-sm">AI 코파일럿</h3>
                <p className="text-xs text-on-surface-variant">블로그 전략 셋팅 중</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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

            {streaming && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 px-4 py-2">
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* 온보딩 완료 배너 */}
          {onboardingDone && (
            <div className="px-4 pb-2">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Icon name="check_circle" size={24} className="text-primary" />
                  <span className="font-medium text-on-surface">셋팅이 완료되었습니다!</span>
                </div>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full py-3 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  대시보드로 이동
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          {!onboardingDone && (
            <div className="px-4 pb-4 pt-2 border-t border-outline-variant bg-surface">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지를 입력하세요..."
                  disabled={streaming}
                  rows={1}
                  className="flex-1 resize-none bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || streaming}
                  className="p-3 bg-primary text-on-primary rounded-xl disabled:opacity-30 transition-opacity cursor-pointer"
                >
                  <Icon name="send" size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
