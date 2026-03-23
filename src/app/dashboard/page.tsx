"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icon";
import {
  getDashboardMetrics,
  getClusterPerformances,
  getCannibalizationWarnings,
  getTopSearchTerms,
  getGrowthData,
  getUserProfile,
  getTopics,
  getRecentArticles,
  isOnboardingComplete,
} from "@/lib/store";
import type {
  DashboardMetrics,
  ClusterPerformance,
  CannibalizationWarning,
  UserProfile,
  TopicRecommendation,
  Article,
} from "@/lib/types";

const AreaChart = dynamic(
  () => import("recharts").then((m) => m.AreaChart),
  { ssr: false }
);
const Area = dynamic(() => import("recharts").then((m) => m.Area), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), {
  ssr: false,
});
const Tooltip = dynamic(
  () => import("recharts").then((m) => m.Tooltip),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [clusterPerformances, setClusterPerformances] = useState<ClusterPerformance[]>([]);
  const [cannibalizationWarnings, setCannibalizationWarnings] = useState<CannibalizationWarning[]>([]);
  const [topSearchTerms, setTopSearchTerms] = useState<{ term: string; clicks: number; position: number; change: number }[]>([]);
  const [growthData, setGrowthData] = useState<{ month: string; clicks: number; impressions: number }[]>([]);
  const [topics, setTopics] = useState<TopicRecommendation[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [dateRange, setDateRange] = useState("30일");

  useEffect(() => {
    if (!isOnboardingComplete()) {
      router.replace("/onboarding");
      return;
    }
    setProfile(getUserProfile());
    setMetrics(getDashboardMetrics());
    setClusterPerformances(getClusterPerformances());
    setCannibalizationWarnings(getCannibalizationWarnings());
    setTopSearchTerms(getTopSearchTerms());
    setGrowthData(getGrowthData());
    setTopics(getTopics());
    setRecentArticles(getRecentArticles(5));
    setMounted(true);
  }, [router]);

  if (!mounted || !metrics) {
    return (
      <AppShell title="대시보드">
        <div className="flex items-center justify-center h-64">
          <Icon name="progress_activity" size={32} className="animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const metricCards = [
    {
      label: "총 클릭수",
      value: metrics.totalClicks > 0 ? metrics.totalClicks.toLocaleString() : "-",
      change: metrics.clicksChange ? `+${metrics.clicksChange}%` : "-",
      positive: true,
      icon: "ads_click",
    },
    {
      label: "평균 순위",
      value: metrics.avgPosition > 0 ? metrics.avgPosition.toString() : "-",
      change: metrics.positionChange ? metrics.positionChange.toString() : "-",
      positive: metrics.positionChange < 0,
      icon: "trending_up",
    },
    {
      label: "노출수",
      value: metrics.totalImpressions > 0 ? metrics.totalImpressions.toLocaleString() : "-",
      change: metrics.impressionsChange ? `+${metrics.impressionsChange}%` : "-",
      positive: true,
      icon: "visibility",
    },
    {
      label: "발행 글수",
      value: metrics.totalArticles.toString(),
      change: metrics.articlesChange ? `+${metrics.articlesChange}` : "-",
      positive: true,
      icon: "article",
    },
  ];

  const trendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <span className="text-green-600">↑</span>;
      case "down":
        return <span className="text-red-500">↓</span>;
      case "stable":
        return <span className="text-on-surface-variant">→</span>;
    }
  };

  const statusLabel = (status: TopicRecommendation["status"]) => {
    switch (status) {
      case "recommended":
        return { text: "추천됨", color: "bg-surface-container text-on-surface-variant" };
      case "selected":
        return { text: "선택됨", color: "bg-primary/10 text-primary" };
      case "researched":
        return { text: "리서치 완료", color: "bg-amber-50 text-amber-700" };
      case "written":
        return { text: "작성 완료", color: "bg-green-50 text-green-700" };
    }
  };

  return (
    <AppShell title="대시보드">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold text-on-surface">대시보드</h1>
          <div className="flex items-center gap-2">
            {["7일", "30일", "90일"].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
                  dateRange === range
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* 블로그 프로필 요약 */}
        {profile && (
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon name="person" size={22} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-on-surface">{profile.blogName}</h3>
                  <span className="bg-primary/10 text-primary text-xs rounded-full px-2.5 py-0.5 font-medium">
                    {profile.platform}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant mb-2">
                  {profile.purpose} · 대상: {profile.targetAudience}
                </p>
                {profile.goals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {profile.goals.map((goal) => (
                      <span
                        key={goal}
                        className="bg-surface-container text-on-surface-variant text-xs rounded-full px-3 py-0.5"
                      >
                        {goal}
                      </span>
                    ))}
                  </div>
                )}
                {profile.analyticsSummary && (
                  <div className="mt-3 bg-white/60 rounded-xl p-4 border border-outline-variant/50">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Icon name="analytics" size={16} className="text-primary" />
                      <span className="text-xs font-medium text-on-surface">통계 분석 요약</span>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                      {profile.analyticsSummary}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card) => (
            <div
              key={card.label}
              className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-on-surface-variant">{card.label}</span>
                <Icon name={card.icon} size={20} className="text-on-surface-variant" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-on-surface">{card.value}</span>
                {card.change !== "-" && (
                  <span
                    className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                      card.positive
                        ? "bg-primary/10 text-primary"
                        : "bg-error-container/30 text-error"
                    }`}
                  >
                    {card.change}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 진행 중인 토픽 */}
        {topics.length > 0 && (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant">
            <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
              <h2 className="font-bold text-on-surface">토픽 진행 현황</h2>
              <button
                onClick={() => router.push("/topics")}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                전체 보기
              </button>
            </div>
            <div className="p-3 space-y-1">
              {topics.slice(0, 5).map((t) => {
                const st = statusLabel(t.status || "recommended");
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">
                        {t.title}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {t.keyword}
                        {t.targetPersona ? ` · ${t.targetPersona}` : ""}
                      </p>
                    </div>
                    <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 shrink-0 ${st.color}`}>
                      {st.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cluster Performance Table */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
            <div className="px-5 py-4 border-b border-outline-variant">
              <h2 className="font-bold text-on-surface">클러스터별 성과</h2>
            </div>
            {clusterPerformances.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant">
                      <th className="text-left px-5 py-3 text-on-surface-variant font-medium">클러스터</th>
                      <th className="text-right px-3 py-3 text-on-surface-variant font-medium">글 수</th>
                      <th className="text-right px-3 py-3 text-on-surface-variant font-medium">평균순위</th>
                      <th className="text-right px-3 py-3 text-on-surface-variant font-medium">클릭</th>
                      <th className="text-right px-3 py-3 text-on-surface-variant font-medium">노출</th>
                      <th className="text-center px-3 py-3 text-on-surface-variant font-medium">트렌드</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clusterPerformances.map((cluster) => (
                      <tr
                        key={cluster.name}
                        className="border-b border-outline-variant/50 last:border-0 hover:bg-surface-container/50 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cluster.color }}
                            />
                            <span className="text-on-surface font-medium">{cluster.name}</span>
                          </div>
                        </td>
                        <td className="text-right px-3 py-3 text-on-surface">{cluster.articles}</td>
                        <td className="text-right px-3 py-3 text-on-surface">{cluster.avgPosition || "-"}</td>
                        <td className="text-right px-3 py-3 text-on-surface">{cluster.clicks ? cluster.clicks.toLocaleString() : "-"}</td>
                        <td className="text-right px-3 py-3 text-on-surface">{cluster.impressions ? cluster.impressions.toLocaleString() : "-"}</td>
                        <td className="text-center px-3 py-3">{trendIcon(cluster.trend)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Icon name="hub" size={32} className="text-on-surface-variant mb-2" />
                <p className="text-sm text-on-surface-variant">
                  온보딩에서 블로그를 등록하면 클러스터별 성과를 확인할 수 있습니다.
                </p>
              </div>
            )}
          </div>

          {/* Top Search Terms / 최근 작성 글 */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant">
            <div className="px-5 py-4 border-b border-outline-variant">
              <h2 className="font-bold text-on-surface">
                {topSearchTerms.length > 0 ? "검색 유입 TOP 5" : "최근 작성 글"}
              </h2>
            </div>
            <div className="p-3">
              {topSearchTerms.length > 0 ? (
                topSearchTerms.map((item, index) => (
                  <div
                    key={item.term}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-surface-container/50 transition-colors"
                  >
                    <span className="text-xs font-bold text-on-surface-variant w-5 text-center">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{item.term}</p>
                      <p className="text-xs text-on-surface-variant">
                        {item.clicks.toLocaleString()} 클릭 · 순위 {item.position}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        item.change > 0 ? "text-green-600" : item.change < 0 ? "text-red-500" : "text-on-surface-variant"
                      }`}
                    >
                      {item.change > 0 ? `+${item.change}` : item.change}
                    </span>
                  </div>
                ))
              ) : recentArticles.length > 0 ? (
                recentArticles.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-surface-container/50 transition-colors"
                  >
                    <Icon name="description" size={18} className="text-on-surface-variant shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{article.title}</p>
                      <p className="text-xs text-on-surface-variant">
                        {article.status === "draft" ? "초안" : "발행"} · {article.target_keyword || "키워드 없음"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <Icon name="edit_document" size={28} className="text-on-surface-variant mb-2" />
                  <p className="text-xs text-on-surface-variant">
                    토픽을 선택하고 글을 작성하면 여기에 표시됩니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Growth Chart */}
        {growthData.length > 0 && (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant">
            <div className="px-5 py-4 border-b border-outline-variant">
              <h2 className="font-bold text-on-surface">성장 추이</h2>
            </div>
            <div className="p-5">
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-on-surface-variant)" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-on-surface-variant)" }} width={50} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--color-surface-container-lowest)", border: "1px solid var(--color-outline-variant)", borderRadius: "12px", fontSize: "13px" }} />
                    <Area type="monotone" dataKey="clicks" stroke="var(--color-primary)" strokeWidth={2} fill="url(#clicksGradient)" name="클릭수" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Cannibalization Warning */}
        {cannibalizationWarnings.length > 0 && (
          <div className="bg-error-container/30 border border-error/20 rounded-2xl">
            <div className="px-5 py-4 border-b border-error/10">
              <div className="flex items-center gap-2">
                <Icon name="warning" size={20} className="text-error" />
                <h2 className="font-bold text-on-surface">키워드 카니발리제이션 감지</h2>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {cannibalizationWarnings.map((warning) => (
                <div key={warning.keyword} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        warning.severity === "high" ? "bg-error" : warning.severity === "medium" ? "bg-yellow-500" : "bg-on-surface-variant"
                      }`}
                    />
                    <span className="text-sm font-medium text-on-surface">
                      &ldquo;{warning.keyword}&rdquo;
                    </span>
                  </div>
                  <div className="ml-4 space-y-1">
                    {warning.articles.map((article) => (
                      <div key={article.url} className="flex items-center justify-between text-sm">
                        <span className="text-on-surface-variant truncate mr-3">{article.title}</span>
                        {article.position > 0 && (
                          <span className="text-on-surface-variant shrink-0">순위 {article.position}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
