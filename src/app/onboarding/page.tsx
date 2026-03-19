'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CrawledArticle {
  title: string;
  url: string;
  description?: string;
}

interface CrawledCluster {
  name: string;
  color: string;
  articleCount: number;
  articles: string[];
}

const CLUSTER_COLORS = ['#414937', '#0058be', '#7c5e3c', '#6b4c8a', '#c45a3c'];

// Simple client-side keyword-based cluster classification
function classifyArticles(articles: CrawledArticle[]): CrawledCluster[] {
  const keywords: Record<string, string[]> = {
    '개발/코딩': ['코딩', '개발', 'coding', 'SaaS', 'MVP', '에디터', 'cursor', 'windsurf', '프로그래밍', 'api', 'code'],
    'AI/도구': ['AI', 'GPT', 'claude', '인공지능', 'LLM', '자동화', 'midjourney', 'dall-e', '도구', 'tool'],
    '마케팅/SEO': ['마케팅', 'SEO', '키워드', '검색', '콘텐츠', '수익화', '애드센스', '광고'],
    '리뷰/경험기': ['리뷰', '후기', '경험', '비교', '추천', '메타', 'VR', '노마드'],
    '기타': [],
  };

  const clusterMap: Record<string, string[]> = {};
  const assigned = new Set<string>();

  for (const [clusterName, kws] of Object.entries(keywords)) {
    if (clusterName === '기타') continue;
    clusterMap[clusterName] = [];
    for (const article of articles) {
      if (assigned.has(article.title)) continue;
      const text = `${article.title} ${article.description || ''}`.toLowerCase();
      if (kws.some((kw) => text.includes(kw.toLowerCase()))) {
        clusterMap[clusterName].push(article.title);
        assigned.add(article.title);
      }
    }
    if (clusterMap[clusterName].length === 0) {
      delete clusterMap[clusterName];
    }
  }

  // Remaining articles go to '기타'
  const unassigned = articles.filter((a) => !assigned.has(a.title)).map((a) => a.title);
  if (unassigned.length > 0) {
    clusterMap['기타'] = unassigned;
  }

  return Object.entries(clusterMap).map(([name, articleTitles], i) => ({
    name,
    color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
    articleCount: articleTitles.length,
    articles: articleTitles,
  }));
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [blogUrl, setBlogUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [articles, setArticles] = useState<CrawledArticle[]>([]);
  const [clusters, setClusters] = useState<CrawledCluster[]>([]);

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleScanSitemap = async () => {
    if (!blogUrl.trim()) {
      setUrlError('URL을 입력해주세요.');
      return;
    }
    if (!validateUrl(blogUrl)) {
      setUrlError('올바른 URL 형식이 아닙니다. (예: https://example.com)');
      return;
    }
    setUrlError('');
    setLoading(true);
    setProgress(0);

    // Simulate progress
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
      const res = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: blogUrl }),
      });
      const data = await res.json();

      clearInterval(progressInterval);
      setProgress(100);

      if (data.error) {
        setUrlError(data.error);
        setLoading(false);
      } else if (data.articles && data.articles.length > 0) {
        const crawledArticles: CrawledArticle[] = data.articles;
        setArticles(crawledArticles);
        setClusters(classifyArticles(crawledArticles));
        setTimeout(() => {
          setStep(3);
          setLoading(false);
        }, 500);
      } else {
        setUrlError('글을 찾을 수 없습니다. URL을 확인해주세요.');
        setLoading(false);
      }
    } catch {
      clearInterval(progressInterval);
      setUrlError('네트워크 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-primary'
                  : s < step
                    ? 'w-4 bg-primary/40'
                    : 'w-4 bg-outline-variant'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center space-y-8 animate-in fade-in">
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 32 }}>
                  edit_note
                </span>
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
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-surface-container-lowest border border-outline-variant rounded-xl hover:bg-surface-container transition-colors cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-on-surface font-medium">Google로 로그인</span>
              </button>

              <p className="text-xs text-on-surface-variant">
                로그인하면 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Blog URL Input */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-on-surface">
                블로그 URL을 입력하세요
              </h2>
              <p className="text-on-surface-variant">
                사이트맵을 스캔하여 기존 글을 분석합니다
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: 20 }}>
                  language
                </span>
                <input
                  type="url"
                  value={blogUrl}
                  onChange={(e) => {
                    setBlogUrl(e.target.value);
                    setUrlError('');
                  }}
                  placeholder="https://myblog.com"
                  className={`w-full pl-10 pr-4 py-3 bg-surface-container-lowest border rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                    urlError ? 'border-error' : 'border-outline-variant'
                  }`}
                />
              </div>
              {urlError && (
                <p className="text-sm text-error flex items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
                  {urlError}
                </p>
              )}
            </div>

            {/* Progress bar */}
            {loading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">사이트맵 스캔 중...</span>
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

            {/* Success message when progress is 100 */}
            {progress === 100 && loading && (
              <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-xl px-4 py-3">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
                <span>{articles.length}개의 글을 발견했습니다!</span>
              </div>
            )}

            <button
              onClick={handleScanSitemap}
              disabled={loading}
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {loading ? '스캔 중...' : '사이트맵 스캔'}
            </button>

            <button
              onClick={() => setStep(1)}
              className="w-full py-2 text-on-surface-variant text-sm hover:text-on-surface transition-colors cursor-pointer"
            >
              뒤로 가기
            </button>
          </div>
        )}

        {/* Step 3: Cluster Classification */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-on-surface">
                클러스터 분류 완료
              </h2>
              <p className="text-on-surface-variant">
                AI가 {articles.length}개의 글을 {clusters.length}개 클러스터로 분류했습니다
              </p>
            </div>

            {/* Cluster cards */}
            <div className="space-y-3">
              {clusters.map((cluster) => (
                <div
                  key={cluster.name}
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cluster.color }}
                      />
                      <h3 className="font-medium text-on-surface">{cluster.name}</h3>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-medium">
                      {cluster.articleCount}개
                    </span>
                  </div>
                  <ul className="space-y-1 ml-5">
                    {cluster.articles.map((article) => (
                      <li
                        key={article}
                        className="text-sm text-on-surface-variant truncate"
                      >
                        {article}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors cursor-pointer"
            >
              시작하기
            </button>

            <button
              onClick={() => {
                setStep(2);
                setProgress(0);
              }}
              className="w-full py-2 text-on-surface-variant text-sm hover:text-on-surface transition-colors cursor-pointer"
            >
              다시 스캔하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
