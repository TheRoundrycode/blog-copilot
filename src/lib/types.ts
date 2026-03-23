// ===== 데이터 모델 타입 =====

// ===== 사용자 프로필 (온보딩 대화에서 구축) =====
export interface UserProfile {
  id: string;
  blogUrl: string;
  blogName: string;
  platform: "naver" | "wordpress" | "tistory" | "other";
  purpose: string;
  goals: string[];
  targetAudience: string;
  finalObjective: string;
  analyticsData?: string;
  analyticsSummary?: string;
  onboardingCompletedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ===== 대화 =====
export interface Conversation {
  id: string;
  type: "onboarding" | "freeform" | "topic-exploration" | "research-review";
  status: "active" | "completed";
  messages: ConversationMessage[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

// ===== 사용자 학습 데이터 (AI 맞춤화) =====
export interface UserLearningData {
  id: string;
  writingStyle: string[];
  preferredTopicTypes: string[];
  avoidPatterns: string[];
  selectedTopics: { topicId: string; keyword: string; date: string }[];
  rejectedTopics: {
    topicId: string;
    keyword: string;
    reason?: string;
    date: string;
  }[];
  feedbacks: { context: string; feedback: string; date: string }[];
  insightSummary: string;
  updatedAt: string;
}

// ===== 기존 모델 (호환 유지) =====
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  blog_url?: string;
  created_at: string;
}

export interface Blog {
  id: string;
  user_id: string;
  url: string;
  name: string;
  sitemap_url?: string;
  total_articles: number;
  created_at: string;
}

export interface Cluster {
  id: string;
  blog_id: string;
  name: string;
  color: string;
  article_count: number;
  avg_position?: number;
  total_clicks?: number;
  total_impressions?: number;
}

export interface Article {
  id: string;
  blog_id: string;
  cluster_id?: string;
  topicId?: string;
  researchId?: string;
  title: string;
  url: string;
  status: "draft" | "published" | "scheduled";
  content?: string;
  contentHtml?: string;
  outline?: OutlineNode[];
  meta_title?: string;
  meta_description?: string;
  target_keyword?: string;
  word_count: number;
  seo_score?: number;
  internalLinks?: InternalLink[];
  created_at: string;
  updated_at: string;
}

export interface InternalLink {
  targetArticleId: string;
  targetUrl: string;
  targetTitle: string;
  anchorText: string;
}

export interface OutlineNode {
  id: string;
  level: "h1" | "h2" | "h3";
  text: string;
  children?: OutlineNode[];
  isExperienceBlock?: boolean;
  experienceType?: string;
  wordCount?: number;
}

// ===== 리서치 =====
export interface Research {
  id: string;
  topicId: string;
  facts: ResearchFact[];
  controversies: Controversy[];
  experience_suggestions: ExperienceSuggestion[];
  seoStrategy?: SEOStrategy;
  writingGuide?: string;
  progress: number;
  status:
    | "in-progress"
    | "pending-confirmation"
    | "confirmed"
    | "revised";
  userFeedback?: string;
  created_at: string;
}

export interface SEOStrategy {
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string;
  suggestedTitleVariants: string[];
  metaDescriptionDraft: string;
  internalLinkSuggestions: string[];
  competitorAnalysis?: string;
}

export interface ResearchFact {
  id: string;
  content: string;
  source?: string;
  verified: boolean | null;
  category: string;
}

export interface Controversy {
  id: string;
  topic: string;
  proArguments: string[];
  conArguments: string[];
}

export interface ExperienceSuggestion {
  id: string;
  type: string;
  description: string;
  placement: string;
}

// ===== 토픽 추천 =====
export interface TopicRecommendation {
  id: string;
  title: string;
  keyword: string;
  searchVolume: number;
  difficulty: "쉬움" | "보통" | "어려움";
  cluster: string;
  priority: 1 | 2;
  reasoning: string;
  lsiKeywords: string[];
  viralScore: number;
  targetPersona: string;
  personaDescription: string;
  dateRelevance: string;
  status: "recommended" | "selected" | "researched" | "written";
}

export interface KeywordTransformation {
  original: string;
  transformed: string;
  experienceType: string;
  searchVolume: number;
}

// ===== 스타일 체크 =====
export interface StyleCheckResult {
  score: number;
  grammar: { score: number; issues: string[] };
  readability: { score: number; issues: string[] };
  seo: { score: number; issues: string[] };
  tone: { score: number; issues: string[] };
  suggestions: string[];
}

// ===== 채팅 =====
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// ===== 대시보드 =====
export interface DashboardMetrics {
  totalClicks: number;
  clicksChange: number;
  avgPosition: number;
  positionChange: number;
  totalImpressions: number;
  impressionsChange: number;
  totalArticles: number;
  articlesChange: number;
}

export interface ClusterPerformance {
  name: string;
  color: string;
  articles: number;
  avgPosition: number;
  clicks: number;
  impressions: number;
  trend: "up" | "down" | "stable";
}

export interface CannibalizationWarning {
  keyword: string;
  articles: { title: string; url: string; position: number }[];
  severity: "high" | "medium" | "low";
}

export interface WritingConfig {
  tone: string;
  targetLength: number;
  targetAudience: string;
  includeImages: boolean;
  includeTOC: boolean;
}

// ===== 크롤링 =====
export interface CrawledArticle {
  url: string;
  title: string;
  description: string;
}

// ===== API 응답 =====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
