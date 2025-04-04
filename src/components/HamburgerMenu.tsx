'use client';

import { Bookmark, BookOpen, Home, Menu, Search, User, X } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import SearchModal from "./SearchModal";

interface HamburgerMenuProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function HamburgerMenu({ isOpen, onOpenChange }: HamburgerMenuProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 메뉴가 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    // 컴포넌트가 언마운트될 때 스크롤 복원
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <>
      {/* 모바일 메뉴 */}
      <div 
        className={`md:hidden fixed inset-0 bg-gray-900/95 backdrop-blur-sm z-40 transition-all duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col h-full pt-20 pb-8 px-6 overflow-y-auto">
          {/* 로고 */}
          <div className="flex items-center gap-2 mb-8 mt-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-xl font-bold text-white">P</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                페어링
              </span>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                BOOK
              </span>
            </div>
          </div>

          {/* 네비게이션 */}
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              className="flex items-center gap-4 p-4 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all"
              onClick={() => onOpenChange(false)}
            >
              <Home className="w-6 h-6" />
              <span className="text-base font-medium">홈</span>
            </Link>
            <Link
              href="/stories"
              className="flex items-center gap-4 p-4 rounded-xl text-white bg-gray-800/50 transition-all"
              onClick={() => onOpenChange(false)}
            >
              <BookOpen className="w-6 h-6" />
              <span className="text-base font-medium">이야기</span>
            </Link>
            <button
              onClick={() => {
                onOpenChange(false);
                setIsSearchOpen(true);
              }}
              className="flex items-center gap-4 p-4 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all text-left"
            >
              <Search className="w-6 h-6" />
              <span className="text-base font-medium">검색</span>
            </button>
            <button
              className="flex items-center gap-4 p-4 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all text-left"
              onClick={() => onOpenChange(false)}
            >
              <Bookmark className="w-6 h-6" />
              <span className="text-base font-medium">저장</span>
            </button>
          </nav>

          {/* 프로필 섹션 */}
          <div className="mt-auto">
            <button
              className="flex items-center gap-4 p-4 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all w-full"
              onClick={() => onOpenChange(false)}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-base font-medium">프로필</span>
                <span className="text-sm text-gray-400">로그인이 필요합니다</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 검색 모달 */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
} 