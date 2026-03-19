'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AppShell from '@/components/AppShell';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StyleCheckResult {
  overall: number;
  categories: {
    name: string;
    score: number;
    issues: string[];
  }[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TOOLBAR_BUTTONS = [
  { icon: 'format_bold', label: 'Bold', prefix: '**', suffix: '**' },
  { icon: 'format_italic', label: 'Italic', prefix: '_', suffix: '_' },
  { icon: 'title', label: 'Heading', prefix: '## ', suffix: '' },
  {
    icon: 'format_list_bulleted',
    label: 'List',
    prefix: '- ',
    suffix: '',
  },
  { icon: 'link', label: 'Link', prefix: '[', suffix: '](url)' },
  { icon: 'image', label: 'Image', prefix: '![alt](', suffix: ')' },
] as const;

const LS_KEY_CONTENT = 'blog-copilot-editor-content';
const LS_KEY_SEO = 'blog-copilot-editor-seo';

/* ------------------------------------------------------------------ */
/*  Score color helper                                                 */
/* ------------------------------------------------------------------ */

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-error';
}

function scoreBarWidth(score: number) {
  return `${Math.min(Math.max(score, 0), 100)}%`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function EditorPage() {
  /* -- State ------------------------------------------------------ */
  const [markdown, setMarkdown] = useState('');
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const [seoOpen, setSeoOpen] = useState(false);
  const [styleCheckOpen, setStyleCheckOpen] = useState(false);
  const [styleCheckLoading, setStyleCheckLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);

  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [mainKeyword, setMainKeyword] = useState('');
  const [seoScore] = useState(0);
  const [internalLinks] = useState<string[]>([
    '/blog/seo-basics',
    '/blog/content-strategy',
    '/blog/keyword-research',
  ]);

  const [styleResult, setStyleResult] = useState<StyleCheckResult | null>(
    null,
  );

  /* -- Persistence ------------------------------------------------ */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY_CONTENT);
      if (saved) setMarkdown(saved);
      const seo = localStorage.getItem(LS_KEY_SEO);
      if (seo) {
        const parsed = JSON.parse(seo);
        setMetaTitle(parsed.metaTitle || '');
        setMetaDescription(parsed.metaDescription || '');
        setMainKeyword(parsed.mainKeyword || '');
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY_CONTENT, markdown);
    } catch {
      // ignore
    }
  }, [markdown]);

  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEY_SEO,
        JSON.stringify({ metaTitle, metaDescription, mainKeyword }),
      );
    } catch {
      // ignore
    }
  }, [metaTitle, metaDescription, mainKeyword]);

  /* -- Helpers ---------------------------------------------------- */
  const wordCount = markdown.length;

  const insertMarkdown = useCallback(
    (prefix: string, suffix: string) => {
      const textarea = document.querySelector(
        '#editor-textarea',
      ) as HTMLTextAreaElement | null;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = markdown.slice(start, end);
      const newText =
        markdown.slice(0, start) +
        prefix +
        (selected || '텍스트') +
        suffix +
        markdown.slice(end);
      setMarkdown(newText);
    },
    [markdown],
  );

  /* -- API calls -------------------------------------------------- */
  const runStyleCheck = async () => {
    setStyleCheckLoading(true);
    setStyleCheckOpen(true);
    try {
      const res = await fetch('/api/style-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: markdown }),
      });
      if (res.ok) {
        const data = await res.json();
        setStyleResult(data);
      }
    } catch {
      // silently fail
    } finally {
      setStyleCheckLoading(false);
    }
  };

  const generateDraft = async (sectionTitle?: string) => {
    setDraftLoading(true);
    try {
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: sectionTitle, content: markdown }),
      });
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let received = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) {
            received = true;
            setMarkdown((prev) => prev + chunk);
          }
        }
        // If streaming produced nothing, try JSON fallback
        if (!received) {
          try {
            const text = await res.text();
            const data = JSON.parse(text);
            if (data.draft) setMarkdown((prev) => prev + '\n\n' + data.draft);
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch {
      // silently fail
    } finally {
      setDraftLoading(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem(LS_KEY_CONTENT, markdown);
    localStorage.setItem(
      LS_KEY_SEO,
      JSON.stringify({ metaTitle, metaDescription, mainKeyword }),
    );
  };

  /* -- Render ----------------------------------------------------- */
  return (
    <AppShell title="에디터">
      <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] max-w-7xl mx-auto">
        {/* ===== Top toolbar ===== */}
        <div className="flex items-center gap-1 px-2 py-2 bg-surface-container-lowest rounded-2xl mb-4 border border-outline-variant flex-wrap">
          {TOOLBAR_BUTTONS.map((btn) => (
            <button
              key={btn.icon}
              onClick={() => insertMarkdown(btn.prefix, btn.suffix)}
              title={btn.label}
              className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">
                {btn.icon}
              </span>
            </button>
          ))}

          <div className="w-px h-6 bg-outline-variant mx-1" />

          <span className="text-xs text-on-surface-variant px-2">
            {wordCount.toLocaleString()}자
          </span>

          <div className="flex-1" />

          <button
            onClick={runStyleCheck}
            disabled={styleCheckLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">
              spellcheck
            </span>
            AI 스타일 체크
          </button>

          <button
            onClick={() => setSeoOpen((p) => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">
              search
            </span>
            SEO
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-on-primary hover:opacity-90 transition-opacity cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">save</span>
            저장
          </button>
        </div>

        {/* ===== Mobile tabs ===== */}
        <div className="flex md:hidden mb-3 gap-2">
          <button
            onClick={() => setMobileTab('edit')}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              mobileTab === 'edit'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            편집
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              mobileTab === 'preview'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            미리보기
          </button>
        </div>

        {/* ===== Split pane ===== */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
          {/* -- Left: Editor -- */}
          <div
            className={`flex flex-col min-h-0 ${
              mobileTab !== 'edit' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <textarea
              id="editor-textarea"
              className="flex-1 w-full resize-none bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 font-mono text-sm text-on-surface leading-relaxed outline-none focus:border-primary placeholder:text-on-surface-variant/50"
              placeholder="마크다운으로 글을 작성하세요..."
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              spellCheck={false}
            />
          </div>

          {/* -- Right: Preview -- */}
          <div
            className={`flex flex-col min-h-0 ${
              mobileTab !== 'preview' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="flex-1 overflow-y-auto bg-surface-container-lowest rounded-2xl border border-outline-variant p-6">
              <article className="prose prose-stone max-w-none [&_h1]:font-serif [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-on-surface [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_a]:text-secondary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-on-surface-variant [&_code]:bg-surface-container [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-surface-container [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_img]:rounded-xl [&_img]:my-4">
                {markdown ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {markdown}
                  </ReactMarkdown>
                ) : (
                  <p className="text-on-surface-variant/50 text-center mt-20">
                    마크다운 미리보기가 여기에 표시됩니다
                  </p>
                )}
              </article>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SEO Settings Slide-out ===== */}
      {seoOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSeoOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-surface-container-lowest shadow-xl flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-outline-variant shrink-0">
              <h2 className="font-serif text-lg font-bold text-on-surface">
                SEO 설정
              </h2>
              <button
                onClick={() => setSeoOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Meta title */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-on-surface">
                  메타 타이틀
                </label>
                <input
                  className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  maxLength={60}
                  placeholder="페이지 제목 (60자 이내)"
                />
                <p className="text-xs text-on-surface-variant text-right">
                  <span
                    className={
                      metaTitle.length > 60 ? 'text-error' : ''
                    }
                  >
                    {metaTitle.length}
                  </span>
                  /60
                </p>
              </div>

              {/* Meta description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-on-surface">
                  메타 설명
                </label>
                <textarea
                  className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary resize-none h-20"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  maxLength={160}
                  placeholder="페이지 설명 (160자 이내)"
                />
                <p className="text-xs text-on-surface-variant text-right">
                  <span
                    className={
                      metaDescription.length > 160 ? 'text-error' : ''
                    }
                  >
                    {metaDescription.length}
                  </span>
                  /160
                </p>
              </div>

              {/* Main keyword */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-on-surface">
                  대표 키워드
                </label>
                <input
                  className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                  value={mainKeyword}
                  onChange={(e) => setMainKeyword(e.target.value)}
                  placeholder="메인 키워드"
                />
              </div>

              {/* Internal links */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface">
                  내부 링크 제안
                </label>
                <ul className="space-y-1.5">
                  {internalLinks.map((link) => (
                    <li key={link}>
                      <button
                        onClick={() =>
                          setMarkdown(
                            (prev) =>
                              prev + `\n[링크 텍스트](${link})`,
                          )
                        }
                        className="w-full text-left px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-sm text-secondary transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base align-middle mr-1.5">
                          link
                        </span>
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* SEO Score gauge */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface">
                  SEO 점수
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16">
                    <svg
                      viewBox="0 0 36 36"
                      className="w-16 h-16 -rotate-90"
                    >
                      <circle
                        cx="18"
                        cy="18"
                        r="15.91"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-surface-container"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.91"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${seoScore} ${100 - seoScore}`}
                        strokeLinecap="round"
                        className={scoreColor(seoScore)}
                      />
                    </svg>
                    <span
                      className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${scoreColor(seoScore)}`}
                    >
                      {seoScore}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    메타 정보와 키워드를 입력하면 점수가 계산됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Style Check Result Modal ===== */}
      {styleCheckOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setStyleCheckOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-surface-container-lowest shadow-xl flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-outline-variant shrink-0">
              <h2 className="font-serif text-lg font-bold text-on-surface">
                AI 스타일 체크
              </h2>
              <button
                onClick={() => setStyleCheckOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-5 space-y-6">
              {styleCheckLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <span className="material-symbols-outlined text-4xl text-primary animate-spin">
                    progress_activity
                  </span>
                  <p className="text-sm text-on-surface-variant">
                    스타일을 분석하고 있습니다...
                  </p>
                </div>
              ) : styleResult ? (
                <>
                  {/* Overall score */}
                  <div className="text-center py-4">
                    <p
                      className={`text-5xl font-bold ${scoreColor(styleResult.overall)}`}
                    >
                      {styleResult.overall}
                    </p>
                    <p className="text-sm text-on-surface-variant mt-1">
                      전체 점수
                    </p>
                  </div>

                  {/* Category scores */}
                  <div className="space-y-4">
                    {styleResult.categories.map((cat) => (
                      <div
                        key={cat.name}
                        className="bg-surface-container rounded-xl p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-on-surface">
                            {cat.name}
                          </span>
                          <span
                            className={`text-sm font-bold ${scoreColor(cat.score)}`}
                          >
                            {cat.score}
                          </span>
                        </div>

                        {/* Score bar */}
                        <div className="w-full bg-surface-container-high rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              cat.score >= 80
                                ? 'bg-green-500'
                                : cat.score >= 60
                                  ? 'bg-yellow-500'
                                  : 'bg-error'
                            }`}
                            style={{ width: scoreBarWidth(cat.score) }}
                          />
                        </div>

                        {/* Issues */}
                        {cat.issues.length > 0 && (
                          <ul className="space-y-1 mt-2">
                            {cat.issues.map((issue, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-xs text-on-surface-variant"
                              >
                                <span className="material-symbols-outlined text-sm text-error mt-0.5">
                                  warning
                                </span>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* AI draft button per section */}
                        <button
                          onClick={() => generateDraft(cat.name)}
                          disabled={draftLoading}
                          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-sm">
                            auto_awesome
                          </span>
                          AI 초안 작성
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">
                    spellcheck
                  </span>
                  <p className="text-sm text-on-surface-variant">
                    스타일 체크 결과가 여기에 표시됩니다
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
