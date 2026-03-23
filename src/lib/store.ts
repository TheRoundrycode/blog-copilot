// localStorage 기반 데이터 스토어
// Supabase로 교체 가능하도록 동일한 인터페이스 유지

import type {
  UserProfile,
  Conversation,
  ConversationMessage,
  UserLearningData,
  Blog,
  Cluster,
  Article,
  TopicRecommendation,
  Research,
  CrawledArticle,
  DashboardMetrics,
  ClusterPerformance,
  CannibalizationWarning,
} from "./types";

// ===== localStorage 키 =====
const KEYS = {
  USER_PROFILE: "bc_user_profile",
  CONVERSATIONS: "bc_conversations",
  CRAWLED_CONTENT: "bc_crawled_content",
  LEARNING_DATA: "bc_learning_data",
  BLOG: "bc_blog",
  CLUSTERS: "bc_clusters",
  ARTICLES: "bc_articles",
  TOPICS: "bc_topics",
  RESEARCH: "bc_research",
} as const;

// ===== 헬퍼 =====
function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ===== ID 생성 =====
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ===== 사용자 프로필 =====
export function getUserProfile(): UserProfile | null {
  return getItem<UserProfile | null>(KEYS.USER_PROFILE, null);
}

export function saveUserProfile(profile: UserProfile): void {
  setItem(KEYS.USER_PROFILE, profile);
}

export function isOnboardingComplete(): boolean {
  const profile = getUserProfile();
  return !!profile?.onboardingCompletedAt;
}

// ===== 대화 =====
export function getConversations(): Conversation[] {
  return getItem<Conversation[]>(KEYS.CONVERSATIONS, []);
}

export function getConversation(id: string): Conversation | undefined {
  return getConversations().find((c) => c.id === id);
}

export function getConversationByType(
  type: Conversation["type"]
): Conversation | undefined {
  return getConversations().find((c) => c.type === type);
}

export function saveConversation(conversation: Conversation): void {
  const all = getConversations();
  const idx = all.findIndex((c) => c.id === conversation.id);
  if (idx !== -1) {
    all[idx] = conversation;
  } else {
    all.push(conversation);
  }
  // 최대 50개 대화 유지
  const trimmed = all.slice(-50);
  setItem(KEYS.CONVERSATIONS, trimmed);
}

export function addMessageToConversation(
  conversationId: string,
  message: ConversationMessage
): void {
  const conv = getConversation(conversationId);
  if (!conv) return;
  conv.messages.push(message);
  conv.updatedAt = new Date().toISOString();
  saveConversation(conv);
}

// ===== 크롤링 콘텐츠 =====
export function getCrawledContent(): CrawledArticle[] {
  return getItem<CrawledArticle[]>(KEYS.CRAWLED_CONTENT, []);
}

export function saveCrawledContent(articles: CrawledArticle[]): void {
  setItem(KEYS.CRAWLED_CONTENT, articles);
}

// ===== 사용자 학습 데이터 =====
export function getLearningData(): UserLearningData {
  return getItem<UserLearningData>(KEYS.LEARNING_DATA, {
    id: "default",
    writingStyle: [],
    preferredTopicTypes: [],
    avoidPatterns: [],
    selectedTopics: [],
    rejectedTopics: [],
    feedbacks: [],
    insightSummary: "",
    updatedAt: new Date().toISOString(),
  });
}

export function updateLearningData(
  updates: Partial<UserLearningData>
): void {
  const current = getLearningData();
  setItem(KEYS.LEARNING_DATA, {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export function addTopicSelection(topicId: string, keyword: string): void {
  const data = getLearningData();
  data.selectedTopics.push({
    topicId,
    keyword,
    date: new Date().toISOString(),
  });
  updateLearningData({ selectedTopics: data.selectedTopics });
}

export function addTopicRejection(
  topicId: string,
  keyword: string,
  reason?: string
): void {
  const data = getLearningData();
  data.rejectedTopics.push({
    topicId,
    keyword,
    reason,
    date: new Date().toISOString(),
  });
  updateLearningData({ rejectedTopics: data.rejectedTopics });
}

export function addFeedback(context: string, feedback: string): void {
  const data = getLearningData();
  data.feedbacks.push({
    context,
    feedback,
    date: new Date().toISOString(),
  });
  // 최근 100개만 유지
  const trimmed = data.feedbacks.slice(-100);
  updateLearningData({ feedbacks: trimmed });
}

export function updateInsightSummary(summary: string): void {
  updateLearningData({ insightSummary: summary });
}

// ===== 블로그 =====
export function getBlog(): Blog | null {
  return getItem<Blog | null>(KEYS.BLOG, null);
}

export function saveBlog(blog: Blog): void {
  setItem(KEYS.BLOG, blog);
}

// ===== 클러스터 =====
export function getClusters(): Cluster[] {
  return getItem<Cluster[]>(KEYS.CLUSTERS, []);
}

export function saveClusters(clusters: Cluster[]): void {
  setItem(KEYS.CLUSTERS, clusters);
}

export function updateCluster(id: string, updates: Partial<Cluster>): void {
  const clusters = getClusters();
  const idx = clusters.findIndex((c) => c.id === id);
  if (idx !== -1) {
    clusters[idx] = { ...clusters[idx], ...updates };
    saveClusters(clusters);
  }
}

// ===== 아티클 =====
export function getArticles(): Article[] {
  return getItem<Article[]>(KEYS.ARTICLES, []);
}

export function getArticleById(id: string): Article | undefined {
  return getArticles().find((a) => a.id === id);
}

export function getArticlesByCluster(clusterId: string): Article[] {
  return getArticles().filter((a) => a.cluster_id === clusterId);
}

export function saveArticle(article: Article): void {
  const articles = getArticles();
  const idx = articles.findIndex((a) => a.id === article.id);
  if (idx !== -1) {
    articles[idx] = article;
  } else {
    articles.push(article);
  }
  setItem(KEYS.ARTICLES, articles);
}

export function saveArticles(articles: Article[]): void {
  setItem(KEYS.ARTICLES, articles);
}

export function deleteArticle(id: string): void {
  const articles = getArticles().filter((a) => a.id !== id);
  setItem(KEYS.ARTICLES, articles);
}

export function getRecentArticles(limit: number = 10): Article[] {
  return getArticles()
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, limit);
}

// 내부링크용: 전체 기사 목록 (URL + 제목 + 키워드)
export function getArticlesForInternalLinking(): {
  id: string;
  url: string;
  title: string;
  keyword: string;
  clusterId: string;
}[] {
  return getArticles().map((a) => ({
    id: a.id,
    url: a.url,
    title: a.title,
    keyword: a.target_keyword || "",
    clusterId: a.cluster_id || "",
  }));
}

// 관련 기사 조회 (같은 클러스터 또는 유사 키워드)
export function getRelatedArticles(
  clusterId?: string,
  keyword?: string
): Article[] {
  const articles = getArticles();
  return articles.filter((a) => {
    if (clusterId && a.cluster_id === clusterId) return true;
    if (
      keyword &&
      a.target_keyword &&
      a.target_keyword.toLowerCase().includes(keyword.toLowerCase())
    )
      return true;
    return false;
  });
}

// ===== 토픽 추천 =====
export function getTopics(): TopicRecommendation[] {
  return getItem<TopicRecommendation[]>(KEYS.TOPICS, []);
}

export function getTopicById(id: string): TopicRecommendation | undefined {
  return getTopics().find((t) => t.id === id);
}

export function saveTopics(topics: TopicRecommendation[]): void {
  setItem(KEYS.TOPICS, topics);
}

export function addTopics(newTopics: TopicRecommendation[]): void {
  const existing = getTopics();
  const merged = [
    ...existing,
    ...newTopics.filter((t) => !existing.some((e) => e.id === t.id)),
  ];
  saveTopics(merged);
}

export function updateTopicStatus(
  id: string,
  status: TopicRecommendation["status"]
): void {
  const topics = getTopics();
  const idx = topics.findIndex((t) => t.id === id);
  if (idx !== -1) {
    topics[idx] = { ...topics[idx], status };
    saveTopics(topics);
  }
}

// ===== 리서치 =====
export function getResearchList(): Research[] {
  return getItem<Research[]>(KEYS.RESEARCH, []);
}

export function getResearchByTopicId(topicId: string): Research | null {
  return getResearchList().find((r) => r.topicId === topicId) ?? null;
}

export function saveResearch(research: Research): void {
  const all = getResearchList();
  const idx = all.findIndex((r) => r.id === research.id);
  if (idx !== -1) {
    all[idx] = research;
  } else {
    all.push(research);
  }
  setItem(KEYS.RESEARCH, all);
}

// ===== 대시보드 메트릭스 (실제 데이터에서 계산) =====
export function getDashboardMetrics(): DashboardMetrics {
  const articles = getArticles();
  const clusters = getClusters();
  const totalArticles = articles.length;
  const publishedArticles = articles.filter(
    (a) => a.status === "published"
  ).length;
  const totalClicks = clusters.reduce(
    (sum, c) => sum + (c.total_clicks ?? 0),
    0
  );
  const totalImpressions = clusters.reduce(
    (sum, c) => sum + (c.total_impressions ?? 0),
    0
  );
  const avgPosition =
    clusters.length > 0
      ? clusters.reduce((sum, c) => sum + (c.avg_position ?? 0), 0) /
        clusters.length
      : 0;

  return {
    totalClicks,
    clicksChange: 0,
    avgPosition: Math.round(avgPosition * 10) / 10,
    positionChange: 0,
    totalImpressions,
    impressionsChange: 0,
    totalArticles: publishedArticles || totalArticles,
    articlesChange: 0,
  };
}

// ===== 클러스터 성과 =====
export function getClusterPerformances(): ClusterPerformance[] {
  const clusters = getClusters();
  const articles = getArticles();

  return clusters.map((c) => ({
    name: c.name,
    color: c.color,
    articles:
      articles.filter((a) => a.cluster_id === c.id).length || c.article_count,
    avgPosition: c.avg_position ?? 0,
    clicks: c.total_clicks ?? 0,
    impressions: c.total_impressions ?? 0,
    trend: "stable" as const,
  }));
}

// ===== 카니발리제이션 감지 =====
export function getCannibalizationWarnings(): CannibalizationWarning[] {
  const articles = getArticles();
  const keywordMap = new Map<string, Article[]>();

  for (const article of articles) {
    if (article.target_keyword) {
      const key = article.target_keyword.toLowerCase();
      if (!keywordMap.has(key)) keywordMap.set(key, []);
      keywordMap.get(key)!.push(article);
    }
  }

  const warnings: CannibalizationWarning[] = [];
  for (const [keyword, arts] of keywordMap) {
    if (arts.length >= 2) {
      warnings.push({
        keyword,
        articles: arts.map((a) => ({ title: a.title, url: a.url, position: 0 })),
        severity: arts.length >= 3 ? "high" : "medium",
      });
    }
  }
  return warnings;
}

// ===== 검색 유입 (GSC 연동 전까지 빈 배열) =====
export function getTopSearchTerms(): {
  term: string;
  clicks: number;
  position: number;
  change: number;
}[] {
  return [];
}

// ===== 성장 데이터 (GSC 연동 전까지 빈 배열) =====
export function getGrowthData(): {
  month: string;
  clicks: number;
  impressions: number;
}[] {
  return [];
}

// ===== 전체 데이터 초기화 =====
export function clearAllData(): void {
  Object.values(KEYS).forEach((key) => {
    if (typeof window !== "undefined") localStorage.removeItem(key);
  });
}
