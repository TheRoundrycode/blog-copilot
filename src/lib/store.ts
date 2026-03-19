// 로컬 데이터 스토어 (Supabase 연동 전 임시 사용)
// Supabase 설정 완료 후 이 파일의 함수들을 Supabase 쿼리로 교체

import type {
  DashboardMetrics,
  ClusterPerformance,
  CannibalizationWarning,
  Cluster,
  Article,
  TopicRecommendation,
} from "./types";

// 대시보드 메트릭스
export function getDashboardMetrics(): DashboardMetrics {
  return {
    totalClicks: 12847,
    clicksChange: 12.5,
    avgPosition: 14.2,
    positionChange: -2.3,
    totalImpressions: 284930,
    impressionsChange: 8.7,
    totalArticles: 47,
    articlesChange: 4,
  };
}

// 클러스터 성과
export function getClusterPerformances(): ClusterPerformance[] {
  return [
    { name: "바이브코딩", color: "#414937", articles: 12, avgPosition: 8.3, clicks: 4521, impressions: 89400, trend: "up" },
    { name: "AI 도구 리뷰", color: "#0058be", articles: 9, avgPosition: 12.1, clicks: 3210, impressions: 67200, trend: "up" },
    { name: "디지털 마케팅", color: "#7c5e3c", articles: 8, avgPosition: 18.7, clicks: 2180, impressions: 52100, trend: "stable" },
    { name: "1인 창업", color: "#6b4c8a", articles: 10, avgPosition: 15.4, clicks: 1890, impressions: 41200, trend: "down" },
    { name: "메타 경험기", color: "#c45a3c", articles: 8, avgPosition: 22.1, clicks: 1046, impressions: 35030, trend: "stable" },
  ];
}

// 카니발리제이션 경고
export function getCannibalizationWarnings(): CannibalizationWarning[] {
  return [
    {
      keyword: "바이브코딩 시작하기",
      articles: [
        { title: "바이브코딩 입문 가이드", url: "/vibe-coding-guide", position: 12 },
        { title: "바이브코딩으로 첫 프로젝트 만들기", url: "/vibe-coding-first", position: 15 },
      ],
      severity: "high",
    },
    {
      keyword: "AI 블로그 도구",
      articles: [
        { title: "AI 글쓰기 도구 비교", url: "/ai-writing-tools", position: 8 },
        { title: "블로그 AI 도구 추천", url: "/blog-ai-tools", position: 11 },
      ],
      severity: "medium",
    },
  ];
}

// 검색 유입 키워드 TOP 5
export function getTopSearchTerms(): { term: string; clicks: number; position: number; change: number }[] {
  return [
    { term: "바이브코딩", clicks: 1247, position: 3.2, change: 1.5 },
    { term: "AI 블로그 작성", clicks: 892, position: 5.1, change: -0.8 },
    { term: "GPT 활용법", clicks: 756, position: 7.3, change: 2.1 },
    { term: "1인 창업 블로그", clicks: 634, position: 9.8, change: -1.2 },
    { term: "SEO 최적화 방법", clicks: 521, position: 11.4, change: 0.5 },
  ];
}

// 클러스터 목록
export function getClusters(): Cluster[] {
  return [
    { id: "c1", blog_id: "b1", name: "바이브코딩", color: "#414937", article_count: 12, avg_position: 8.3, total_clicks: 4521, total_impressions: 89400 },
    { id: "c2", blog_id: "b1", name: "AI 도구 리뷰", color: "#0058be", article_count: 9, avg_position: 12.1, total_clicks: 3210, total_impressions: 67200 },
    { id: "c3", blog_id: "b1", name: "디지털 마케팅", color: "#7c5e3c", article_count: 8, avg_position: 18.7, total_clicks: 2180, total_impressions: 52100 },
    { id: "c4", blog_id: "b1", name: "1인 창업", color: "#6b4c8a", article_count: 10, avg_position: 15.4, total_clicks: 1890, total_impressions: 41200 },
    { id: "c5", blog_id: "b1", name: "메타 경험기", color: "#c45a3c", article_count: 8, avg_position: 22.1, total_clicks: 1046, total_impressions: 35030 },
  ];
}

// 최근 글 목록
export function getRecentArticles(): Article[] {
  return [
    { id: "a1", blog_id: "b1", cluster_id: "c1", title: "바이브코딩으로 SaaS 만들기 완전 가이드", url: "/vibe-coding-saas", status: "published", target_keyword: "바이브코딩 SaaS", word_count: 3200, seo_score: 92, created_at: "2025-03-15", updated_at: "2025-03-15" },
    { id: "a2", blog_id: "b1", cluster_id: "c2", title: "2025년 AI 글쓰기 도구 TOP 10 비교", url: "/ai-writing-tools-2025", status: "published", target_keyword: "AI 글쓰기 도구", word_count: 4100, seo_score: 88, created_at: "2025-03-10", updated_at: "2025-03-12" },
    { id: "a3", blog_id: "b1", cluster_id: "c1", title: "Cursor vs Windsurf: 바이브코딩 에디터 비교", url: "/cursor-vs-windsurf", status: "draft", target_keyword: "Cursor Windsurf 비교", word_count: 2800, seo_score: 75, created_at: "2025-03-08", updated_at: "2025-03-08" },
  ];
}

// 월별 성장 차트 데이터
export function getGrowthData(): { month: string; clicks: number; impressions: number }[] {
  return [
    { month: "10월", clicks: 5200, impressions: 120000 },
    { month: "11월", clicks: 6800, impressions: 156000 },
    { month: "12월", clicks: 8100, impressions: 189000 },
    { month: "1월", clicks: 9400, impressions: 215000 },
    { month: "2월", clicks: 11200, impressions: 251000 },
    { month: "3월", clicks: 12847, impressions: 284930 },
  ];
}

// 토픽 추천 (초기 더미 데이터, GPT가 대체)
export function getInitialTopics(): TopicRecommendation[] {
  return [
    {
      id: "t1",
      title: "바이브코딩으로 MVP 3일 만에 만드는 법",
      keyword: "바이브코딩 MVP",
      searchVolume: 2400,
      difficulty: "보통",
      cluster: "바이브코딩",
      priority: 1,
      reasoning: "기존 바이브코딩 클러스터를 강화하면서 실전 가이드 수요를 충족할 수 있습니다.",
      lsiKeywords: ["노코드 MVP", "빠른 프로토타입", "AI 개발"],
      viralScore: 85,
    },
    {
      id: "t2",
      title: "ChatGPT vs Claude: 블로그 글쓰기 실전 비교",
      keyword: "ChatGPT Claude 비교",
      searchVolume: 5100,
      difficulty: "어려움",
      cluster: "AI 도구 리뷰",
      priority: 1,
      reasoning: "높은 검색량의 비교 키워드로, AI 도구 리뷰 클러스터의 허브 글이 될 수 있습니다.",
      lsiKeywords: ["AI 글쓰기", "LLM 비교", "블로그 자동화"],
      viralScore: 92,
    },
  ];
}
