'use client';

import { Bookmark, BookOpen, Home, Menu, Search, User, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import SearchModal from "./SearchModal";

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800/80 backdrop-blur-sm"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* 모바일 메뉴 */}
      <div
        className={`fixed inset-0 bg-gray-900/95 backdrop-blur-sm z-40 transition-transform duration-300 md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col items-center gap-8 p-8">
          {/* 로고 */}
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
            P
          </div>

          {/* 네비게이션 */}
          <nav className="flex flex-col items-center gap-8 w-full">
            <Link
              href="/"
              className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors w-full p-4 rounded-lg hover:bg-gray-800"
              onClick={() => setIsOpen(false)}
            >
              <Home className="w-6 h-6" />
              <span className="text-lg">홈</span>
            </Link>
            <Link
              href="/stories"
              className="flex items-center gap-4 text-white w-full p-4 rounded-lg bg-gray-800"
              onClick={() => setIsOpen(false)}
            >
              <BookOpen className="w-6 h-6" />
              <span className="text-lg">이야기</span>
            </Link>
            <button
              className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors w-full p-4 rounded-lg hover:bg-gray-800"
              onClick={() => {
                setIsOpen(false);
                setIsSearchOpen(true);
              }}
            >
              <Search className="w-6 h-6" />
              <span className="text-lg">검색</span>
            </button>
            <button className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors w-full p-4 rounded-lg hover:bg-gray-800">
              <Bookmark className="w-6 h-6" />
              <span className="text-lg">저장</span>
            </button>
          </nav>

          {/* 프로필 */}
          <div className="mt-auto">
            <button className="flex items-center gap-4 text-gray-300 hover:text-white transition-colors w-full p-4 rounded-lg hover:bg-gray-800">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <span className="text-lg">프로필</span>
            </button>
          </div>
        </div>
      </div>

      {/* 검색 모달 */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
} 