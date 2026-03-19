'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Icon from '@/components/Icon';
import type { ResearchFact, Controversy, ExperienceSuggestion } from '@/lib/types';

function ResearchContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';
  const initialKeyword = searchParams.get('keyword') || '';

  const [topic, setTopic] = useState(initialTopic);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [facts, setFacts] = useState<ResearchFact[]>([]);
  const [controversies, setControversies] = useState<Controversy[]>([]);
  const [experienceSuggestions, setExperienceSuggestions] = useState<ExperienceSuggestion[]>([]);

  // Sync from URL params when they change
  useEffect(() => {
    if (searchParams.get('topic')) setTopic(searchParams.get('topic')!);
    if (searchParams.get('keyword')) setKeyword(searchParams.get('keyword')!);
  }, [searchParams]);

  const toggleFactState = (id: string) => {
    setFacts((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        // cycle: null -> true -> false -> null
        const next = f.verified === null ? true : f.verified === true ? false : null;
        return { ...f, verified: next };
      })
    );
  };

  const handleStartResearch = async () => {
    if (!topic || !keyword) return;
    setLoading(true);
    setProgress(0);
    setFacts([]);
    setControversies([]);
    setExperienceSuggestions([]);

    // Animate progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 12;
      });
    }, 400);

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, keyword }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      setFacts(data.facts || []);
      setControversies(data.controversies || []);
      setExperienceSuggestions(data.experienceSuggestions || []);
      setProgress(100);
    } catch {
      // keep empty state on error
      setProgress(0);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const factIcon = (verified: boolean | null) => {
    if (verified === true) return { icon: 'check_circle', color: 'text-green-600' };
    if (verified === false) return { icon: 'cancel', color: 'text-red-500' };
    return { icon: 'help', color: 'text-on-surface-variant' };
  };

  const hasResults = facts.length > 0 || controversies.length > 0 || experienceSuggestions.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Topic Header */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant">
        <h2 className="font-serif text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
          <Icon name="science" size={22} />
          딥 리서치
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs text-on-surface-variant mb-1 block">토픽</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="리서치할 토픽을 입력하세요"
              className="w-full bg-surface-container rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 border border-outline-variant focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-on-surface-variant mb-1 block">키워드</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="타겟 키워드"
              className="w-full bg-surface-container rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 border border-outline-variant focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleStartResearch}
              disabled={loading || !topic || !keyword}
              className="flex items-center gap-2 bg-primary text-on-primary font-semibold rounded-xl px-5 py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer whitespace-nowrap"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block">
                    <Icon name="progress_activity" size={18} />
                  </span>
                  분석 중...
                </>
              ) : (
                <>
                  <Icon name="search" size={18} />
                  리서치 시작
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {(loading || progress > 0) && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>리서치 진행률</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && !hasResults && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant animate-pulse">
              <div className="h-4 bg-surface-container rounded w-1/3 mb-3" />
              <div className="h-3 bg-surface-container rounded w-full mb-2" />
              <div className="h-3 bg-surface-container rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* 팩트 수집 */}
      {facts.length > 0 && (
        <section>
          <h2 className="font-serif text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <Icon name="fact_check" size={22} />
            팩트 수집
          </h2>
          <div className="space-y-2">
            {facts.map((fact) => {
              const { icon, color } = factIcon(fact.verified);
              return (
                <div
                  key={fact.id}
                  className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant flex items-start gap-3"
                >
                  <button
                    onClick={() => toggleFactState(fact.id)}
                    className={`mt-0.5 shrink-0 cursor-pointer ${color}`}
                    title="상태 변경"
                  >
                    <Icon name={icon} size={20} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-on-surface leading-relaxed">{fact.content}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="bg-surface-container text-on-surface-variant text-xs rounded-full px-3 py-0.5">
                        {fact.category}
                      </span>
                      {fact.source && (
                        <a
                          href={fact.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Icon name="link" size={12} />
                          출처
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 논쟁 포인트 */}
      {controversies.length > 0 && (
        <section>
          <h2 className="font-serif text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <Icon name="balance" size={22} />
            논쟁 포인트
          </h2>
          <div className="space-y-4">
            {controversies.map((c) => (
              <div
                key={c.id}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-outline-variant">
                  <h3 className="font-serif text-sm font-bold text-on-surface">{c.topic}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant">
                  {/* 찬성 */}
                  <div className="p-4">
                    <p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1">
                      <Icon name="thumb_up" size={14} />
                      찬성
                    </p>
                    <ul className="space-y-1.5">
                      {c.proArguments.map((arg, i) => (
                        <li key={i} className="text-xs text-on-surface leading-relaxed flex items-start gap-1.5">
                          <span className="text-green-500 mt-0.5 shrink-0">+</span>
                          {arg}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* 반대 */}
                  <div className="p-4">
                    <p className="text-xs font-semibold text-red-500 mb-2 flex items-center gap-1">
                      <Icon name="thumb_down" size={14} />
                      반대
                    </p>
                    <ul className="space-y-1.5">
                      {c.conArguments.map((arg, i) => (
                        <li key={i} className="text-xs text-on-surface leading-relaxed flex items-start gap-1.5">
                          <span className="text-red-400 mt-0.5 shrink-0">-</span>
                          {arg}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 경험 블록 제안 */}
      {experienceSuggestions.length > 0 && (
        <section>
          <h2 className="font-serif text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <Icon name="person_book" size={22} />
            경험 블록 제안
          </h2>
          <div className="space-y-3">
            {experienceSuggestions.map((s) => (
              <div
                key={s.id}
                className="bg-primary/5 border-l-4 border-primary rounded-r-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-primary/10 text-primary text-xs font-medium rounded-full px-3 py-0.5">
                    {s.type}
                  </span>
                  <span className="text-xs text-on-surface-variant flex items-center gap-1">
                    <Icon name="place_item" size={14} />
                    {s.placement}
                  </span>
                </div>
                <p className="text-sm text-on-surface leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!loading && !hasResults && progress === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
          <Icon name="science" size={48} className="opacity-40 mb-4" />
          <p className="text-sm">토픽과 키워드를 입력하고 리서치를 시작하세요</p>
          <p className="text-xs mt-1 opacity-60">
            AI가 팩트, 논쟁 포인트, 경험 블록을 자동으로 수집합니다
          </p>
        </div>
      )}
    </div>
  );
}

export default function ResearchPage() {
  return (
    <AppShell title="딥 리서치">
      <Suspense fallback={<div className="max-w-5xl mx-auto animate-pulse p-6"><div className="h-8 bg-surface-container rounded w-1/3 mb-4" /><div className="h-32 bg-surface-container rounded-2xl" /></div>}>
        <ResearchContent />
      </Suspense>
    </AppShell>
  );
}
