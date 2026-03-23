"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icon";
import {
  getResearchByTopicId,
  getTopicById,
  getUserProfile,
  getArticlesForInternalLinking,
  saveArticle,
  updateTopicStatus,
  generateId,
  isOnboardingComplete,
} from "@/lib/store";
import type { Research, TopicRecommendation } from "@/lib/types";

type ViewTab = "preview" | "source";

export default function WritePage() {
  const router = useRouter();
  const params = useSearchParams();
  const topicId = params.get("topicId");

  const [mounted, setMounted] = useState(false);
  const [topic, setTopic] = useState<TopicRecommendation | null>(null);
  const [research, setResearch] = useState<Research | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>("preview");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isOnboardingComplete()) {
      router.replace("/onboarding");
      return;
    }

    if (topicId) {
      const t = getTopicById(topicId);
      const r = getResearchByTopicId(topicId);
      setTopic(t || null);
      setResearch(r);

      if (r && r.status !== "confirmed") {
        // 리서치가 확인되지 않았으면 리서치 페이지로
        router.replace(`/research?topicId=${topicId}`);
        return;
      }
    }
    setMounted(true);
  }, [topicId, router]);

  const handleGenerate = async () => {
    if (!research || !topic) return;
    setGenerating(true);
    setHtmlContent("");

    try {
      const profile = getUserProfile();
      const existingArticles = getArticlesForInternalLinking();

      const res = await fetch("/api/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          research,
          profile,
          existingArticles,
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
          setHtmlContent(full);
        }
      }
    } catch (error) {
      console.error("글 생성 오류:", error);
    }
    setGenerating(false);
  };

  const handleSave = () => {
    if (!topic || !htmlContent) return;
    const profile = getUserProfile();
    const now = new Date().toISOString();

    saveArticle({
      id: `article_${generateId()}`,
      blog_id: profile?.id || "local",
      topicId: topic.id,
      researchId: research?.id,
      title: topic.title,
      url: "",
      status: "draft",
      contentHtml: htmlContent,
      target_keyword: topic.keyword,
      word_count: htmlContent.length,
      created_at: now,
      updated_at: now,
    });

    updateTopicStatus(topic.id, "written");
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlContent);
  };

  if (!mounted) {
    return (
      <AppShell title="글쓰기">
        <div className="flex items-center justify-center h-64">
          <span
            className="material-symbols-outlined animate-spin text-primary"
            style={{ fontSize: 32 }}
          >
            progress_activity
          </span>
        </div>
      </AppShell>
    );
  }

  if (!topicId || !topic || !research) {
    return (
      <AppShell title="글쓰기">
        <div className="text-center py-16 space-y-4">
          <Icon name="edit_document" size={48} className="text-on-surface-variant" />
          <h2 className="text-xl font-bold text-on-surface">
            글쓰기를 시작하려면 토픽을 선택하세요
          </h2>
          <p className="text-sm text-on-surface-variant">
            토픽 선택 → 딥리서치 확인 → 글쓰기 순서로 진행됩니다.
          </p>
          <button
            onClick={() => router.push("/topics")}
            className="bg-primary text-on-primary rounded-xl px-6 py-2.5 text-sm font-medium cursor-pointer"
          >
            토픽 추천 보기
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="글쓰기">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-on-surface">
              {topic.title}
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              키워드: {topic.keyword} · 페르소나: {topic.targetPersona}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!htmlContent && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 bg-primary text-on-primary rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-50 cursor-pointer"
              >
                {generating ? (
                  <>
                    <span className="animate-spin">
                      <Icon name="progress_activity" size={18} />
                    </span>
                    생성 중...
                  </>
                ) : (
                  <>
                    <Icon name="auto_awesome" size={18} />
                    AI 글 생성
                  </>
                )}
              </button>
            )}
            {htmlContent && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 bg-surface-container text-on-surface rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer"
                >
                  <Icon name="content_copy" size={18} />
                  복사
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 bg-primary text-on-primary rounded-xl px-4 py-2.5 text-sm font-medium cursor-pointer"
                >
                  <Icon name="save" size={18} />
                  {saved ? "저장됨!" : "저장"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab */}
        {htmlContent && (
          <div className="border-b border-outline-variant">
            <nav className="flex gap-6">
              {(["preview", "source"] as ViewTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${
                    activeTab === tab
                      ? "text-primary border-b-2 border-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {tab === "preview" ? "미리보기" : "소스 코드"}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Content */}
        {generating && !htmlContent && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-surface-container rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {htmlContent && activeTab === "preview" && (
          <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
            <iframe
              srcDoc={`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body {
    font-family: 'Pretendard Variable', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    line-height: 1.8;
    color: #1b1c19;
    max-width: 720px;
    margin: 0 auto;
    padding: 32px 24px;
    word-break: keep-all;
  }
  h1 { font-size: 28px; font-weight: 800; margin: 32px 0 16px; line-height: 1.3; }
  h2 { font-size: 22px; font-weight: 700; margin: 28px 0 12px; line-height: 1.4; border-bottom: 2px solid #414937; padding-bottom: 8px; }
  h3 { font-size: 18px; font-weight: 600; margin: 24px 0 8px; line-height: 1.4; }
  p { margin: 12px 0; font-size: 16px; }
  a { color: #0058be; text-decoration: underline; }
  ul, ol { margin: 12px 0; padding-left: 24px; }
  li { margin: 6px 0; font-size: 16px; }
  blockquote { border-left: 4px solid #414937; margin: 16px 0; padding: 12px 20px; background: #f5f3ee; border-radius: 0 8px 8px 0; }
  strong { color: #414937; }
  hr { border: none; border-top: 1px solid #e4e2dd; margin: 24px 0; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { border: 1px solid #e4e2dd; padding: 10px 14px; text-align: left; font-size: 14px; }
  th { background: #f5f3ee; font-weight: 600; }
  img { max-width: 100%; border-radius: 8px; margin: 16px 0; }
  code { background: #f0eee9; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
  pre { background: #1b1c19; color: #e4e2dd; padding: 16px; border-radius: 8px; overflow-x: auto; }
  pre code { background: none; padding: 0; color: inherit; }
</style>
</head>
<body>${htmlContent}</body>
</html>`}
              className="w-full border-0"
              style={{ minHeight: "600px", height: "80vh" }}
              title="글 미리보기"
            />
          </div>
        )}

        {htmlContent && activeTab === "source" && (
          <div className="bg-surface-container rounded-2xl p-4">
            <pre className="text-xs text-on-surface overflow-x-auto whitespace-pre-wrap font-mono">
              {htmlContent}
            </pre>
          </div>
        )}
      </div>
    </AppShell>
  );
}
