'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';

const navItems = [
  { label: '대시보드', icon: 'dashboard', href: '/dashboard' },
  { label: '토픽 선택', icon: 'lightbulb', href: '/topics' },
  { label: '딥 리서치', icon: 'science', href: '/research' },
  { label: '아웃라인', icon: 'account_tree', href: '/outline' },
  { label: '에디터', icon: 'edit_document', href: '/editor' },
  { label: '클러스터 맵', icon: 'hub', href: '/cluster-map' },
];

interface SidebarProps {
  onOpenChat?: () => void;
}

export default function Sidebar({ onOpenChat }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-surface-container-lowest border-r border-outline-variant">
      {/* Logo */}
      <div className="px-6 py-5">
        <h1 className="font-serif text-xl font-bold text-on-surface tracking-tight">
          AI 블로그 코파일럿
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                isActive
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Icon name={item.icon} size={22} filled={isActive} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* AI Chat Button */}
      <div className="px-3 pb-5">
        <button
          onClick={onOpenChat}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          <Icon name="chat" size={22} />
          <span>AI 채팅</span>
        </button>
      </div>
    </aside>
  );
}
