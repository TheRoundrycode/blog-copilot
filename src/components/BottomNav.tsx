'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';

const bottomNavItems = [
  { label: '대시보드', icon: 'dashboard', href: '/dashboard' },
  { label: '토픽', icon: 'lightbulb', href: '/topics' },
  { label: '글쓰기', icon: 'edit_document', href: '/write' },
  { label: '클러스터', icon: 'hub', href: '/cluster-map' },
  { label: 'AI채팅', icon: 'chat', href: '/chat' },
];

interface BottomNavProps {
  onOpenChat?: () => void;
}

export default function BottomNav({ onOpenChat }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-surface-container-lowest border-t border-outline-variant pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {bottomNavItems.map((item) => {
          const isChat = item.href === '#chat';
          const isActive = !isChat && (pathname === item.href || pathname?.startsWith(item.href + '/'));

          if (isChat) {
            return (
              <button
                key={item.href}
                onClick={onOpenChat}
                className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1 text-on-surface-variant cursor-pointer"
              >
                <Icon name={item.icon} size={24} />
                <span className="text-[11px] font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1 ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <Icon name={item.icon} size={24} filled={isActive} />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
