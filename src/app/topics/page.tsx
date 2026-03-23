"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icon";
import {
  getTopics,
  getClusters,
  saveTopics,
  getUserProfile,
  getCrawledContent,
  getLearningData,
  isOnboardingComplete,
  addTopicSelection,
  updateTopicStatus,
} from "@/lib/store";
import type { TopicRecommendation, Cluster } from "@/lib/types";

type TabKey = "priority1" | "priority2" | "all";

export default function TopicsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [topics, setTopics] = useState<TopicRecommendation[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("priority1");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOnboardingComplete()) {
      router.replace("/onboarding");
      return;
    }
    setTopics(getTopics());
    setClusters(getClusters());
    setMounted(true);
  }, [router]);

  if (!mounted) {
    return (
      <AppShell title="토픽 추천">
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

  const topRecommendation =
    topics.find((t) => t.priority === 1) || topics[0];

  const filteredTopics = (() => {
    if (activeTab === "priority1")
      return topics.filter((t) => t.priority === 1);
    if (activeTab === "priority2")
      return topics.filter((t) => t.priority === 2);
    return topics;
  })();

  const tabs: { key: TabKey; label: string }[] = [
    { key: "priority1", label: "1순위 추천" },
    { key: "priority2", label: "2순위 추천" },
    { key: "all", label: "전체" },
  ];

  const difficultyColor = (d: string) => {
    if (d === "쉬움") return "text-green-600 bg-green-50";
    if (d === "보통") return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  const handleAIRecommend = async () => {
    setLoading(true);
    try {
      const profile = getUserProfile();
      const crawledContent = getCrawledContent();
      const learningData = getLearningData();

      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          crawledContent,
          existingTopics: topics,
          learningData,
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data: TopicRecommendation[] = await res.json();
      setTopics(data);
      saveTopics(data);
    } catch {
      // Silently fail; keep existing topics
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTopic = (topic: TopicRecommendation) => {
    addTopicSelection(topic.id, topic.keyword);
    updateTopicStatus(topic.id, "selected");
    router.push(
      `/research?topicId=${encodeURIComponent(topic.id)}&topic=${encodeURIComponent(topic.title)}&keyword=${encodeURIComponent(topic.keyword)}`
    );
  };

  const clusterBalanceMax =
    clusters.length > 0
      ? Math.max(...clusters.map((c) => c.article_count))
      : 1;

  return (
    <AppShell title="토픽 추천">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Empty state */}
        {topics.length === 0 && !loading && (
          <div className="text-center py-16 space-y-4">
            <span
              className="material-symbols-outlined text-on-surface-variant"
              style={{ fontSize: 48 }}
            >
              lightbulb
            </span>
            <h2 className="text-xl font-bold text-on-surface">
              아직 추천 토픽이 없습니다
            </h2>
            <p className="text-sm text-on-surface-variant">
              AI가 블로그 데이터를 분석하여 최적의 토픽을 제안합니다.
            </p>
            <button
              onClick={handleAIRecommend}
              className="bg-primary text-on-primary rounded-xl px-6 py-2.5 text-sm font-medium cursor-pointer"
            >
              <Icon
                name="auto_awesome"
                size={18}
                className="inline mr-1 align-text-bottom"
              />
              AI에게 토픽 추천 받기
            </button>
          </div>
        )}

        {/* Hero: AI 추천 토픽 */}
        {topRecommendation && (
          <div className="bg-primary text-on-primary rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <Icon name="auto_awesome" size={28} />
              <div>
                <p className="text-sm opacity-80 mb-1">AI 추천 토픽</p>
                <h2 className="font-serif text-xl font-bold leading-snug">
                  {topRecommendation.title}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="bg-on-primary/20 text-on-primary text-xs rounded-full px-3 py-1">
                {topRecommendation.keyword}
              </span>
              <span className="bg-on-primary/20 text-on-primary text-xs rounded-full px-3 py-1">
                {topRecommendation.cluster}
              </span>
              {topRecommendation.targetPersona && (
                <span className="bg-on-primary/20 text-on-primary text-xs rounded-full px-3 py-1">
                  {topRecommendation.targetPersona}
                </span>
              )}
            </div>
            <p className="text-sm opacity-90 mb-2 leading-relaxed">
              {topRecommendation.reasoning}
            </p>
            {topRecommendation.dateRelevance && (
              <p className="text-xs opacity-70 mb-4">
                {topRecommendation.dateRelevance}
              </p>
            )}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleSelectTopic(topRecommendation)}
                className="bg-on-primary text-primary font-semibold rounded-xl px-5 py-2.5 text-sm hover:opacity-90 transition-opacity cursor-pointer"
              >
                이 토픽으로 시작하기
              </button>
              <button
                onClick={handleAIRecommend}
                className="text-sm text-on-primary/80 hover:text-on-primary underline underline-offset-2 cursor-pointer"
              >
                다른 추천 보기
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        {topics.length > 0 && (
          <>
            <div className="border-b border-outline-variant">
              <nav className="flex gap-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${
                      activeTab === tab.key
                        ? "text-primary border-b-2 border-primary"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Topic Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant flex flex-col gap-3"
                >
                  {/* Title & badges */}
                  <div>
                    <h3 className="font-serif text-base font-bold text-on-surface leading-snug mb-2">
                      {topic.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-primary/10 text-primary text-xs font-medium rounded-full px-3 py-1">
                        {topic.keyword}
                      </span>
                      <span className="bg-surface-container text-on-surface-variant text-xs rounded-full px-3 py-1">
                        {topic.cluster}
                      </span>
                    </div>
                  </div>

                  {/* Persona */}
                  {topic.targetPersona && (
                    <div className="flex items-center gap-2 text-xs">
                      <Icon
                        name="person"
                        size={14}
                        className="text-primary"
                      />
                      <span className="text-on-surface font-medium">
                        {topic.targetPersona}
                      </span>
                      {topic.personaDescription && (
                        <span className="text-on-surface-variant">
                          — {topic.personaDescription}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Date relevance */}
                  {topic.dateRelevance && (
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                      <Icon name="schedule" size={14} />
                      <span>{topic.dateRelevance}</span>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <Icon name="search" size={14} />
                      검색량 {topic.searchVolume.toLocaleString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor(topic.difficulty)}`}
                    >
                      난이도 {topic.difficulty}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="trending_up" size={14} />
                      바이럴 {topic.viralScore}
                    </span>
                  </div>

                  {/* LSI Keywords */}
                  {topic.lsiKeywords && topic.lsiKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {topic.lsiKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="bg-surface-container rounded-full px-3 py-1 text-xs text-on-surface-variant"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Reasoning */}
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {topic.reasoning}
                  </p>

                  {/* Action */}
                  <button
                    onClick={() => handleSelectTopic(topic)}
                    className="mt-auto self-start bg-primary text-on-primary text-sm font-medium rounded-xl px-4 py-2 hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    글쓰기 시작
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 시맨틱 클러스터 밸런스 */}
        {clusters.length > 0 && (
          <section>
            <h2 className="font-serif text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <Icon name="equalizer" size={22} />
              시맨틱 클러스터 밸런스
            </h2>
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant space-y-3">
              {clusters.map((cluster) => (
                <div key={cluster.id} className="flex items-center gap-3">
                  <span className="text-xs text-on-surface w-24 truncate shrink-0">
                    {cluster.name}
                  </span>
                  <div className="flex-1 bg-surface-container rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center justify-end pr-2 text-[10px] font-medium text-white transition-all duration-500"
                      style={{
                        width: `${(cluster.article_count / clusterBalanceMax) * 100}%`,
                        backgroundColor: cluster.color,
                      }}
                    >
                      {cluster.article_count}편
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AI 추천 버튼 */}
        <div className="flex justify-center pt-2 pb-4">
          <button
            onClick={handleAIRecommend}
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-on-primary font-semibold rounded-2xl px-6 py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block">
                  <Icon name="progress_activity" size={20} />
                </span>
                AI가 분석 중...
              </>
            ) : (
              <>
                <Icon name="auto_awesome" size={20} />
                AI에게 토픽 추천 받기
              </>
            )}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
