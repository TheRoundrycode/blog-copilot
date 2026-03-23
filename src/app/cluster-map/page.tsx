'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Icon from '@/components/Icon';
import { getClusters, getArticles, isOnboardingComplete } from '@/lib/store';
import type { Cluster, Article } from '@/lib/types';

// Generate sub-article nodes around a cluster node
function getArticlePositions(cx: number, cy: number, count: number, radius: number) {
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    positions.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return positions;
}

export default function ClusterMapPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);

  useEffect(() => {
    if (!isOnboardingComplete()) {
      router.replace('/onboarding');
      return;
    }
    setClusters(getClusters());
    setArticles(getArticles());
    setMounted(true);
  }, [router]);

  const totalArticles = useMemo(
    () => clusters.reduce((sum, c) => sum + c.article_count, 0),
    [clusters]
  );

  // Articles belonging to the selected cluster
  const clusterArticles = useMemo(() => {
    if (!selectedCluster) return [];
    return articles.filter((a) => a.cluster_id === selectedCluster.id);
  }, [selectedCluster, articles]);

  if (!mounted) {
    return (
      <AppShell title="클러스터 맵">
        <div className="flex items-center justify-center h-64">
          <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: 32 }}>
            progress_activity
          </span>
        </div>
      </AppShell>
    );
  }

  if (clusters.length === 0) {
    return (
      <AppShell title="클러스터 맵">
        <div className="max-w-lg mx-auto text-center py-20 space-y-4">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 48 }}>
            hub
          </span>
          <h2 className="text-xl font-bold text-on-surface">클러스터가 없습니다</h2>
          <p className="text-sm text-on-surface-variant">
            온보딩에서 블로그를 등록하면 클러스터 맵이 생성됩니다.
          </p>
          <button
            onClick={() => router.push('/onboarding')}
            className="bg-primary text-on-primary rounded-xl px-6 py-2.5 text-sm font-medium cursor-pointer"
          >
            블로그 등록하기
          </button>
        </div>
      </AppShell>
    );
  }

  // SVG layout constants
  const viewW = 800;
  const viewH = 600;
  const hubX = viewW / 2;
  const hubY = viewH / 2;
  const hubR = 44;
  const clusterR = 32;
  const orbitRadius = 190;
  const subOrbitRadius = 60;
  const subNodeR = 8;

  // Position clusters in a circle around hub
  const clusterPositions = clusters.map((c, i) => {
    const angle = (2 * Math.PI * i) / clusters.length - Math.PI / 2;
    return {
      ...c,
      cx: hubX + orbitRadius * Math.cos(angle),
      cy: hubY + orbitRadius * Math.sin(angle),
    };
  });

  return (
    <AppShell title="클러스터 맵">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-on-surface">클러스터 맵</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              {clusters.length}개 클러스터 · {totalArticles}개 글
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SVG Hub-Spoke Visualization */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl border border-outline-variant p-4">
            <svg
              viewBox={`0 0 ${viewW} ${viewH}`}
              className="w-full h-auto"
              role="img"
              aria-label="클러스터 맵 시각화"
            >
              {/* Lines from hub to clusters */}
              {clusterPositions.map((cp) => (
                <line
                  key={`line-${cp.id}`}
                  x1={hubX}
                  y1={hubY}
                  x2={cp.cx}
                  y2={cp.cy}
                  stroke={selectedCluster?.id === cp.id ? cp.color : '#c4c7c0'}
                  strokeWidth={selectedCluster?.id === cp.id ? 3 : 1.5}
                  strokeDasharray={selectedCluster?.id === cp.id ? undefined : '6 3'}
                  opacity={selectedCluster && selectedCluster.id !== cp.id ? 0.3 : 0.7}
                />
              ))}

              {/* Sub-article nodes (only for selected cluster) */}
              {selectedCluster &&
                (() => {
                  const cp = clusterPositions.find((c) => c.id === selectedCluster.id);
                  if (!cp) return null;
                  const subs = getArticlePositions(cp.cx, cp.cy, cp.article_count, subOrbitRadius);
                  return subs.map((s, i) => (
                    <g key={`sub-${i}`}>
                      <line
                        x1={cp.cx}
                        y1={cp.cy}
                        x2={s.x}
                        y2={s.y}
                        stroke={cp.color}
                        strokeWidth={1}
                        opacity={0.4}
                      />
                      <circle
                        cx={s.x}
                        cy={s.y}
                        r={subNodeR}
                        fill={cp.color}
                        opacity={0.5}
                      />
                    </g>
                  ));
                })()}

              {/* Central hub node */}
              <g className="cursor-pointer" onClick={() => setSelectedCluster(null)}>
                <circle cx={hubX} cy={hubY} r={hubR} className="fill-primary" />
                <text
                  x={hubX}
                  y={hubY - 6}
                  textAnchor="middle"
                  className="fill-on-primary text-[13px] font-bold"
                  style={{ fontFamily: 'var(--font-serif, serif)' }}
                >
                  내 블로그
                </text>
                <text
                  x={hubX}
                  y={hubY + 12}
                  textAnchor="middle"
                  className="fill-on-primary text-[11px]"
                >
                  {totalArticles}편
                </text>
              </g>

              {/* Cluster nodes */}
              {clusterPositions.map((cp) => {
                const isSelected = selectedCluster?.id === cp.id;
                return (
                  <g
                    key={cp.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedCluster(isSelected ? null : cp)}
                    opacity={selectedCluster && !isSelected ? 0.4 : 1}
                  >
                    {/* Highlight ring */}
                    {isSelected && (
                      <circle
                        cx={cp.cx}
                        cy={cp.cy}
                        r={clusterR + 6}
                        fill="none"
                        stroke={cp.color}
                        strokeWidth={2.5}
                        opacity={0.5}
                      />
                    )}
                    {/* Node circle */}
                    <circle
                      cx={cp.cx}
                      cy={cp.cy}
                      r={clusterR}
                      fill={cp.color}
                    />
                    {/* Cluster name */}
                    <text
                      x={cp.cx}
                      y={cp.cy - 4}
                      textAnchor="middle"
                      fill="white"
                      className="text-[11px] font-medium"
                    >
                      {cp.name}
                    </text>
                    {/* Article count badge */}
                    <text
                      x={cp.cx}
                      y={cp.cy + 12}
                      textAnchor="middle"
                      fill="white"
                      className="text-[10px]"
                      opacity={0.85}
                    >
                      {cp.article_count}편
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Right Panel: Selected Cluster Detail or Balance */}
          <div className="space-y-6">
            {/* Selected Cluster Detail */}
            {selectedCluster ? (
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedCluster.color }}
                  />
                  <h3 className="font-serif text-lg font-bold text-on-surface">
                    {selectedCluster.name}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-surface-container rounded-xl p-3 text-center">
                    <p className="text-xs text-on-surface-variant">글 수</p>
                    <p className="text-lg font-bold text-on-surface">{selectedCluster.article_count}</p>
                  </div>
                  <div className="bg-surface-container rounded-xl p-3 text-center">
                    <p className="text-xs text-on-surface-variant">평균 순위</p>
                    <p className="text-lg font-bold text-on-surface">{selectedCluster.avg_position?.toFixed(1) ?? '-'}</p>
                  </div>
                  <div className="bg-surface-container rounded-xl p-3 text-center">
                    <p className="text-xs text-on-surface-variant">클릭</p>
                    <p className="text-lg font-bold text-on-surface">{selectedCluster.total_clicks?.toLocaleString() ?? '-'}</p>
                  </div>
                  <div className="bg-surface-container rounded-xl p-3 text-center">
                    <p className="text-xs text-on-surface-variant">노출</p>
                    <p className="text-lg font-bold text-on-surface">{selectedCluster.total_impressions?.toLocaleString() ?? '-'}</p>
                  </div>
                </div>

                {/* Articles in this cluster */}
                <h4 className="text-sm font-medium text-on-surface mb-2">클러스터 내 글</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {clusterArticles.length > 0 ? (
                    clusterArticles.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-2 p-2 bg-surface-container rounded-lg text-sm"
                      >
                        <Icon name="article" size={16} className="text-on-surface-variant shrink-0" />
                        <span className="text-on-surface truncate">{a.title}</span>
                        {a.seo_score != null && (
                          <span className="ml-auto text-xs text-on-surface-variant shrink-0">{a.seo_score}점</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-on-surface-variant">
                      이 클러스터에 속한 글 목록입니다.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Placeholder when nothing selected */
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 text-center">
                <Icon name="touch_app" size={32} className="text-on-surface-variant mx-auto mb-2" />
                <p className="text-sm text-on-surface-variant">
                  클러스터를 클릭하면 세부 정보를 확인할 수 있습니다.
                </p>
              </div>
            )}

            {/* Cluster Balance */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5">
              <h3 className="font-serif text-base font-bold text-on-surface mb-4">클러스터 밸런스</h3>
              <div className="space-y-3">
                {clusters.map((c) => {
                  const pct = totalArticles > 0 ? Math.round((c.article_count / totalArticles) * 100) : 0;
                  const idealMin = Math.round(100 / clusters.length) - 5;
                  const idealMax = Math.round(100 / clusters.length) + 5;
                  const isInRange = pct >= idealMin && pct <= idealMax;

                  return (
                    <div key={c.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="text-on-surface">{c.name}</span>
                        </div>
                        <span className="text-on-surface-variant">
                          {c.article_count}편 ({pct}%)
                        </span>
                      </div>
                      <div className="relative h-2 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: c.color }}
                        />
                        {/* Ideal range indicator */}
                        <div
                          className="absolute inset-y-0 border-l-2 border-r-2 border-outline-variant/50"
                          style={{
                            left: `${idealMin}%`,
                            width: `${idealMax - idealMin}%`,
                          }}
                        />
                      </div>
                      {!isInRange && (
                        <p className="text-[11px] mt-0.5 text-on-surface-variant">
                          {pct < idealMin ? '보강 필요' : '과밀'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-on-surface-variant mt-3">
                점선 구간이 권장 비율 범위입니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
