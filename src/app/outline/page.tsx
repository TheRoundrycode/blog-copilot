'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AppShell from '@/components/AppShell';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ExperienceType = '체험기' | '인터뷰' | '사례연구' | '데이터 분석';

interface OutlineNode {
  id: string;
  level: 'H1' | 'H2' | 'H3';
  text: string;
  wordCount: number;
  isExperience?: boolean;
  experienceType?: ExperienceType;
  experienceContent?: string;
  children: OutlineNode[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let idCounter = 0;
function uid() {
  return `node-${++idCounter}-${Date.now()}`;
}

function blankNode(level: 'H1' | 'H2' | 'H3', text = ''): OutlineNode {
  return { id: uid(), level, text, wordCount: 0, children: [] };
}

function totalWords(nodes: OutlineNode[]): number {
  return nodes.reduce(
    (sum, n) => sum + n.wordCount + totalWords(n.children),
    0,
  );
}

const EXPERIENCE_TYPES: ExperienceType[] = [
  '체험기',
  '인터뷰',
  '사례연구',
  '데이터 분석',
];

/* ------------------------------------------------------------------ */
/*  Sortable wrapper                                                   */
/* ------------------------------------------------------------------ */

function SortableItem({
  node,
  onUpdate,
  onDelete,
  onAddChild,
}: {
  node: OutlineNode;
  onUpdate: (id: string, patch: Partial<OutlineNode>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const indent =
    node.level === 'H1' ? '' : node.level === 'H2' ? 'ml-8' : 'ml-16';

  const badgeColor =
    node.level === 'H1'
      ? 'bg-primary text-on-primary'
      : node.level === 'H2'
        ? 'bg-secondary text-on-secondary'
        : 'bg-surface-container-high text-on-surface';

  if (node.isExperience) {
    return (
      <div ref={setNodeRef} style={style} className={`${indent} mb-3`}>
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-xl">
                drag_indicator
              </span>
            </button>

            <span
              className={`shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${badgeColor}`}
            >
              {node.level}
            </span>

            <span className="shrink-0 text-xs font-medium text-primary bg-primary/15 rounded-full px-2 py-0.5">
              경험 블록
            </span>

            <input
              className="flex-1 bg-transparent border-none outline-none text-on-surface font-serif text-base"
              value={node.text}
              placeholder="경험 블록 제목"
              onChange={(e) => onUpdate(node.id, { text: e.target.value })}
            />

            <button
              onClick={() => onDelete(node.id)}
              className="text-on-surface-variant hover:text-error cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Type selector */}
          <div className="flex gap-2 flex-wrap">
            {EXPERIENCE_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => onUpdate(node.id, { experienceType: t })}
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                  node.experienceType === t
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Experience content area */}
          <textarea
            className="w-full min-h-[80px] rounded-lg border-2 border-dashed border-outline-variant bg-transparent p-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none resize-none focus:border-primary/50"
            placeholder="경험 내용을 입력하세요..."
            value={node.experienceContent || ''}
            onChange={(e) =>
              onUpdate(node.id, { experienceContent: e.target.value })
            }
          />
        </div>
      </div>
    );
  }

  const textSize =
    node.level === 'H1'
      ? 'text-xl'
      : node.level === 'H2'
        ? 'text-lg'
        : 'text-base';
  const containerBg =
    node.level === 'H1'
      ? 'bg-surface-container-lowest rounded-2xl p-4 shadow-sm'
      : 'bg-surface-container-lowest rounded-xl p-3';

  return (
    <div ref={setNodeRef} style={style} className={`${indent} mb-3`}>
      <div className={`${containerBg} flex items-center gap-2`}>
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-on-surface-variant hover:text-on-surface shrink-0"
        >
          <span className="material-symbols-outlined text-xl">
            drag_indicator
          </span>
        </button>

        {/* Level badge */}
        <span
          className={`shrink-0 px-2 py-0.5 rounded text-xs font-semibold ${badgeColor}`}
        >
          {node.level}
        </span>

        {/* Editable text */}
        <input
          className={`flex-1 bg-transparent border-none outline-none text-on-surface font-serif ${textSize}`}
          value={node.text}
          placeholder={`${node.level} 제목 입력`}
          onChange={(e) =>
            onUpdate(node.id, {
              text: e.target.value,
              wordCount: e.target.value.length,
            })
          }
        />

        {/* Word count badge */}
        <span className="shrink-0 rounded-full bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant">
          {node.wordCount}자
        </span>

        {/* Add child */}
        {node.level !== 'H3' && (
          <button
            onClick={() => onAddChild(node.id)}
            className="text-on-surface-variant hover:text-primary cursor-pointer"
            title="하위 항목 추가"
          >
            <span className="material-symbols-outlined text-xl">add</span>
          </button>
        )}

        {/* Delete */}
        <button
          onClick={() => onDelete(node.id)}
          className="text-on-surface-variant hover:text-error cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function OutlinePage() {
  const router = useRouter();
  const [topic] = useState('블로그 글쓰기');
  const [keyword] = useState('SEO 최적화');
  const [seoKeyword, setSeoKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const [outline, setOutline] = useState<OutlineNode[]>([
    {
      id: uid(),
      level: 'H1',
      text: '',
      wordCount: 0,
      children: [],
    },
  ]);

  /* -- Flat list for DnD ------------------------------------------- */
  const flatNodes: OutlineNode[] = [];
  outline.forEach((h1) => {
    flatNodes.push(h1);
    h1.children.forEach((h2) => {
      flatNodes.push(h2);
      h2.children.forEach((h3) => flatNodes.push(h3));
    });
  });

  const flatIds = flatNodes.map((n) => n.id);

  /* -- Sensors ----------------------------------------------------- */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  /* -- Mutations --------------------------------------------------- */
  const updateNode = useCallback(
    (id: string, patch: Partial<OutlineNode>) => {
      setOutline((prev) =>
        prev.map((h1) => {
          if (h1.id === id) return { ...h1, ...patch };
          return {
            ...h1,
            children: h1.children.map((h2) => {
              if (h2.id === id) return { ...h2, ...patch };
              return {
                ...h2,
                children: h2.children.map((h3) =>
                  h3.id === id ? { ...h3, ...patch } : h3,
                ),
              };
            }),
          };
        }),
      );
    },
    [],
  );

  const deleteNode = useCallback((id: string) => {
    setOutline((prev) =>
      prev
        .filter((h1) => h1.id !== id)
        .map((h1) => ({
          ...h1,
          children: h1.children
            .filter((h2) => h2.id !== id)
            .map((h2) => ({
              ...h2,
              children: h2.children.filter((h3) => h3.id !== id),
            })),
        })),
    );
  }, []);

  const addChild = useCallback((parentId: string) => {
    setOutline((prev) =>
      prev.map((h1) => {
        if (h1.id === parentId) {
          return {
            ...h1,
            children: [...h1.children, blankNode('H2')],
          };
        }
        return {
          ...h1,
          children: h1.children.map((h2) => {
            if (h2.id === parentId) {
              return {
                ...h2,
                children: [...h2.children, blankNode('H3')],
              };
            }
            return h2;
          }),
        };
      }),
    );
  }, []);

  /* -- Drag end ---------------------------------------------------- */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeNode = flatNodes.find((n) => n.id === active.id);
      const overNode = flatNodes.find((n) => n.id === over.id);
      if (!activeNode || !overNode) return;

      // Only allow reorder among siblings at the same level
      if (activeNode.level !== overNode.level) return;

      setOutline((prev) => {
        if (activeNode.level === 'H1') {
          const oldIndex = prev.findIndex((n) => n.id === active.id);
          const newIndex = prev.findIndex((n) => n.id === over.id);
          return arrayMove(prev, oldIndex, newIndex);
        }

        return prev.map((h1) => {
          if (activeNode.level === 'H2') {
            const oldIndex = h1.children.findIndex((n) => n.id === active.id);
            const newIndex = h1.children.findIndex((n) => n.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
              return {
                ...h1,
                children: arrayMove(h1.children, oldIndex, newIndex),
              };
            }
          }
          if (activeNode.level === 'H3') {
            return {
              ...h1,
              children: h1.children.map((h2) => {
                const oldIndex = h2.children.findIndex(
                  (n) => n.id === active.id,
                );
                const newIndex = h2.children.findIndex(
                  (n) => n.id === over.id,
                );
                if (oldIndex !== -1 && newIndex !== -1) {
                  return {
                    ...h2,
                    children: arrayMove(h2.children, oldIndex, newIndex),
                  };
                }
                return h2;
              }),
            };
          }
          return h1;
        });
      });
    },
    [flatNodes],
  );

  /* -- AI outline generation -------------------------------------- */
  const generateOutline = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, keyword }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.outline) setOutline(data.outline);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  /* -- Add experience block --------------------------------------- */
  const addExperienceBlock = () => {
    if (outline.length === 0) return;
    const lastH1 = outline[outline.length - 1];
    const expNode: OutlineNode = {
      id: uid(),
      level: 'H2',
      text: '',
      wordCount: 0,
      isExperience: true,
      experienceType: '체험기',
      experienceContent: '',
      children: [],
    };
    setOutline((prev) =>
      prev.map((h1) =>
        h1.id === lastH1.id
          ? { ...h1, children: [...h1.children, expNode] }
          : h1,
      ),
    );
  };

  /* -- Derived stats ---------------------------------------------- */
  const estimatedWords = totalWords(outline);
  const h2Count = outline.reduce((s, h1) => s + h1.children.length, 0);
  const h3CountFixed = outline.reduce(
    (s, h1) =>
      s + h1.children.reduce((ss, h2) => ss + h2.children.length, 0),
    0,
  );

  return (
    <AppShell title="아웃라인 설계">
      <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
        {/* ---- Main content ---- */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-serif text-2xl font-bold text-on-surface">
                아웃라인 설계
              </h1>
              <p className="text-sm text-on-surface-variant mt-1">
                주제:{' '}
                <span className="font-medium text-on-surface">{topic}</span>{' '}
                &middot; 키워드:{' '}
                <span className="font-medium text-on-surface">{keyword}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={addExperienceBlock}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">
                  experience
                </span>
                경험 블록 추가
              </button>

              <button
                onClick={generateOutline}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">
                  auto_awesome
                </span>
                {loading ? '생성 중...' : 'AI 아웃라인 생성'}
              </button>
            </div>
          </div>

          {/* Outline tree */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={flatIds}
              strategy={verticalListSortingStrategy}
            >
              {flatNodes.map((node) => (
                <SortableItem
                  key={node.id}
                  node={node}
                  onUpdate={updateNode}
                  onDelete={deleteNode}
                  onAddChild={addChild}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Add H1 */}
          <button
            onClick={() =>
              setOutline((prev) => [...prev, blankNode('H1')])
            }
            className="mt-4 flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            H1 섹션 추가
          </button>
        </div>

        {/* ---- Right panel ---- */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-6 space-y-6">
            {/* SEO keyword */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 space-y-3">
              <h3 className="font-serif text-sm font-bold text-on-surface">
                SEO 키워드
              </h3>
              <input
                className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                placeholder="대표 키워드 입력"
                value={seoKeyword}
                onChange={(e) => setSeoKeyword(e.target.value)}
              />
            </div>

            {/* Estimated word count */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 space-y-2">
              <h3 className="font-serif text-sm font-bold text-on-surface">
                예상 글자수
              </h3>
              <p className="text-3xl font-bold text-primary">
                {estimatedWords.toLocaleString()}
                <span className="text-sm font-normal text-on-surface-variant ml-1">
                  자
                </span>
              </p>
            </div>

            {/* Structure analysis */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 space-y-3">
              <h3 className="font-serif text-sm font-bold text-on-surface">
                구조 분석
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">H1</span>
                  <span className="font-medium text-on-surface">
                    {outline.length}개
                  </span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5">
                  <div
                    className="bg-primary rounded-full h-1.5"
                    style={{
                      width: `${Math.min(outline.length * 25, 100)}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">H2</span>
                  <span className="font-medium text-on-surface">
                    {h2Count}개
                  </span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5">
                  <div
                    className="bg-secondary rounded-full h-1.5"
                    style={{
                      width: `${Math.min(h2Count * 10, 100)}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">H3</span>
                  <span className="font-medium text-on-surface">
                    {h3CountFixed}개
                  </span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5">
                  <div
                    className="bg-tertiary rounded-full h-1.5"
                    style={{
                      width: `${Math.min(h3CountFixed * 8, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Start writing button */}
            <button
              onClick={() => router.push('/editor')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-medium bg-primary text-on-primary hover:opacity-90 transition-opacity cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              글쓰기 시작
            </button>
          </div>
        </aside>
      </div>

      {/* Mobile CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4 lg:hidden z-30">
        <button
          onClick={() => router.push('/editor')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-medium bg-primary text-on-primary shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
          글쓰기 시작
        </button>
      </div>
    </AppShell>
  );
}
