// ===== 데이터 모델 타입 =====

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
  title: string;
  url: string;
  status: "draft" | "published" | "scheduled";
  content?: string;
  outline?: OutlineNode[];
  meta_title?: string;
  meta_description?: string;
  target_keyword?: string;
  word_count: number;
  seo_score?: number;
  created_at: string;
  updated_at: string;
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

export interface Research {
  id: string;
  article_id: string;
  facts: ResearchFact[];
  controversies: Controversy[];
  experience_suggestions: ExperienceSuggestion[];
  progress: number;
  created_at: string;
}

export interface ResearchFact {
  id: string;
  content: string;
  source?: string;
  verified: boolean | null; // null = unchecked, true = verified, false = rejected
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
}

export interface KeywordTransformation {
  original: string;
  transformed: string;
  experienceType: string;
  searchVolume: number;
}

export interface StyleCheckResult {
  score: number;
  grammar: { score: number; issues: string[] };
  readability: { score: number; issues: string[] };
  seo: { score: number; issues: string[] };
  tone: { score: number; issues: string[] };
  suggestions: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

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

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
