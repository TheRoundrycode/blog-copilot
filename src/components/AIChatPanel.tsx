'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Icon from './Icon';
import type { ChatMessage } from '@/lib/types';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const quickActions = [
  { label: '콘텐츠 감사', prompt: '내 블로그의 콘텐츠를 감사하고 개선점을 알려줘.' },
  { label: '클러스터 분석', prompt: '현재 클러스터 구성을 분석하고 전략적 제안을 해줘.' },
  { label: 'SEO 팁', prompt: '블로그 SEO 점수를 높이기 위한 실전 팁을 알려줘.' },
  { label: '글감 추천', prompt: '지금 내 블로그에 어울리는 새로운 글감을 추천해줘.' },
];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function AIChatPanel({ isOpen, onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput('');
      setIsLoading(true);

      // Create placeholder AI message
      const aiMessageId = generateId();
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error('응답 오류가 발생했습니다.');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMessageId ? { ...m, content: m.content + text } : m
              )
            );
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId
              ? { ...m, content: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 다시 시도해 주세요.' }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-96 bg-surface-container-lowest border-l border-outline-variant shadow-xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-2">
            <Icon name="smart_toy" size={22} className="text-primary" />
            <h2 className="font-serif text-lg font-bold text-on-surface">AI 코파일럿</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors cursor-pointer"
          >
            <Icon name="close" size={22} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
              <Icon name="forum" size={40} className="text-on-surface-variant/40" />
              <p className="text-sm text-on-surface-variant">
                블로그에 대해 무엇이든 물어보세요.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-on-primary rounded-2xl rounded-br-md p-3 ml-8'
                    : 'bg-surface-container text-on-surface rounded-2xl rounded-bl-md p-3 mr-8'
                }`}
              >
                {msg.role === 'assistant' ? (
                  msg.content ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 text-on-surface">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    /* Typing indicator */
                    <div className="flex items-center gap-1 py-1 px-1">
                      <span className="w-2 h-2 bg-on-surface-variant/50 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-on-surface-variant/50 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-on-surface-variant/50 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  )
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length === 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                onClick={() => sendMessage(qa.prompt)}
                className="bg-surface-container text-on-surface-variant rounded-full px-3 py-1.5 text-sm hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                {qa.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-outline-variant p-3 shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="블로그에 대해 무엇이든 물어보세요..."
              rows={1}
              className="flex-1 resize-none bg-surface-container rounded-2xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-[120px]"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="bg-primary text-on-primary rounded-full p-2 shrink-0 disabled:opacity-40 hover:opacity-90 transition-opacity cursor-pointer disabled:cursor-not-allowed"
            >
              <Icon name="send" size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
