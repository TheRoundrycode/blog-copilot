'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Icon from './Icon';
import AIChatPanel from './AIChatPanel';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppShell({ children, title }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const handleOpenChat = () => {
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
  };

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar onOpenChat={handleOpenChat} />

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 h-full">
            <Sidebar onOpenChat={() => { handleOpenChat(); setMobileMenuOpen(false); }} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <header className="flex items-center gap-3 px-4 h-14 bg-surface-container-lowest border-b border-outline-variant md:hidden">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1 -ml-1 text-on-surface cursor-pointer"
          >
            <Icon name="menu" size={24} />
          </button>
          <h1 className="font-serif text-lg font-bold text-on-surface truncate">
            {title || 'AI 블로그 코파일럿'}
          </h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav onOpenChat={handleOpenChat} />

      {/* AI Chat Slide-over */}
      <AIChatPanel isOpen={chatOpen} onClose={handleCloseChat} />
    </div>
  );
}
