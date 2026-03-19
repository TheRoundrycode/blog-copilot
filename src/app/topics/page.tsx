'use client';

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import Icon from '@/components/Icon';
import { getInitialTopics, getClusters } from '@/lib/store';
import type { TopicRecommendation, KeywordTransformation } from '@/lib/types';

const INITIAL_TRANSFORMATIONS: KeywordTransformation[] = [
  { original: '바이브코딩', transformed: '바이브코딩 3개월 실전 후기', experienceType: '체험기', searchVolume: 1800 },
  { original: 'AI 글쓰기 도구', transformed: 'AI 글쓰기 도구로 월 100만원 번 이야기', experienceType: '수익 사례', searchVolume: 2200 },
  { original: 'SEO 최적화', transformed: 'SEO 최적화로 방문자 10배 늘린 방법', experienceType: '성장기', searchVolume: 3100 },
  { original: '1인 창업', transformed: '1인 창업 6개월 매출 공개', experienceType: '매출 공개', searchVolume: 2700 },
];

type TabKey = 'priority1' | 'priority2' | 'all';

export default function TopicsPage() {
  const [topics, setTopics] = useState<TopicRecommendation[]>(getInitialTopics());
  const [activeTab, setActiveTab] = useState<TabKey>('priority1');
  const [loading, setLoading] = useState(false);
  const clusters = getClusters();

  const topRecommendation = topics.find((t) => t.priority === 1) || topics[0];

  const filteredTopics = (() => {
    if (activeTab === 'priority1') return topics.filter((t) => t.priority === 1);
    if (activeTab === 'priority2') return topics.filter((t) => t.priority === 2);
    return topics;
  })();

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'priority1', label: '1순위 추천' },
    { key: 'priority2', label: '2순위 추천' },
    { key: 'all', label: '전체' },
  ];

  const difficultyColor = (d: string) => {
    if (d === '쉬움') return 'text-green-600 bg-green-50';
    if (d === '보통') return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const handleAIRecommend = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogUrl: 'https://example.com',
          clusters: clusters.map((c) => c.name),
          existingTopics: topics.map((t) => t.title),
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data: TopicRecommendation[] = await res.json();
      setTopics(data);
    } catch {
      // Silently fail; keep existing topics
    } finally {
      setLoading(false);
    }
  };

  // Cluster balance data
  const clusterBalanceMax = Math.max(...clusters.map((c) => c.article_count));

  return (
    <AppShell title="토픽 추천">
      <div className="max-w-5xl mx-auto space-y-8">
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
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-on-primary/20 text-on-primary text-xs rounded-full px-3 py-1">
                {topRecommendation.keyword}
              </span>
              <span className="bg-on-primary/20 text-on-primary text-xs rounded-full px-3 py-1">
                {topRecommendation.cluster}
              </span>
            </div>
            <p className="text-sm opacity-90 mb-5 leading-relaxed">
              {topRecommendation.reasoning}
            </p>
            <div className="flex items-center gap-4">
              <a
                href={`/editor?topic=${encodeURIComponent(topRecommendation.title)}&keyword=${encodeURIComponent(topRecommendation.keyword)}`}
                className="bg-on-primary text-primary font-semibold rounded-xl px-5 py-2.5 text-sm hover:opacity-90 transition-opacity"
              >
                이 토픽으로 시작하기
              </a>
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
        <div className="border-b border-outline-variant">
          <nav className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === tab.key
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
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

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <Icon name="search" size={14} />
                  검색량 {topic.searchVolume.toLocaleString()}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor(topic.difficulty)}`}>
                  난이도 {topic.difficulty}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="trending_up" size={14} />
                  바이럴 {topic.viralScore}
                </span>
              </div>

              {/* LSI Keywords */}
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

              {/* Reasoning */}
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {topic.reasoning}
              </p>

              {/* Action */}
              <a
                href={`/research?topic=${encodeURIComponent(topic.title)}&keyword=${encodeURIComponent(topic.keyword)}`}
                className="mt-auto self-start bg-primary text-on-primary text-sm font-medium rounded-xl px-4 py-2 hover:opacity-90 transition-opacity"
              >
                글쓰기 시작
              </a>
            </div>
          ))}
        </div>

        {/* 경험형 키워드 변환 */}
        <section>
          <h2 className="font-serif text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <Icon name="swap_horiz" size={22} />
            경험형 키워드 변환
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INITIAL_TRANSFORMATIONS.map((t, i) => (
              <div
                key={i}
                className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface-variant truncate">{t.original}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Icon name="arrow_forward" size={16} className="text-primary shrink-0" />
                    <p className="text-sm font-medium text-on-surface truncate">{t.transformed}</p>
                  </div>
                </div>
                <span className="bg-primary/10 text-primary text-xs font-medium rounded-full px-3 py-1 shrink-0">
                  {t.experienceType}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 시맨틱 클러스터 밸런스 */}
        <section>
          <h2 className="font-serif text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <Icon name="equalizer" size={22} />
            시맨틱 클러스터 밸런스
          </h2>
          <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant space-y-3">
            {clusters.map((cluster) => (
              <div key={cluster.id} className="flex items-center gap-3">
                <span className="text-xs text-on-surface w-24 truncate shrink-0">{cluster.name}</span>
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
