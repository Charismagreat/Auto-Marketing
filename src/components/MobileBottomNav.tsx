'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Compass,
  Video,
  ShoppingBag,
  Calendar,
} from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  // 로그인이나 온보딩 화면에서는 하단바 숨김
  if (pathname === '/login' || pathname === '/onboarding') {
    return null;
  }

  const navItems = [
    { label: '홈', href: '/', icon: Home },
    { label: '레퍼런스', href: '/references', icon: Compass },
    { label: '숏폼', href: '/studio/video', icon: Video },
    { label: '상세페이지', href: '/studio/detail', icon: ShoppingBag },
    { label: '캘린더', href: '/calendar', icon: Calendar },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
              isActive
                ? 'text-indigo-600 font-extrabold scale-105'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
