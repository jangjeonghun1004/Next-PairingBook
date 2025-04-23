'use client';

import { Home, BookOpen, User, MessageSquare, Menu, LogOut, LogIn, Edit } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";



export default function Sidebar() {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const isActive = (path: string) => {
    return pathname === path;
  };

  // 외부 클릭 감지를 위한 이벤트 리스너
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  return (
    <div className="hidden md:flex flex-col w-60 h-screen fixed left-0 top-0 border-r border-gray-800 z-10 px-3 py-8">
      {/* 로고 영역 */}
      <div className="pl-3 py-2 flex items-center">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span className="text-lg font-bold text-white">P</span>
        </div>
        <span className="ml-2 text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          페어링 BOOK
        </span>
      </div>

      {/* 메인 메뉴 */}
      <div className="flex flex-col gap-1 mt-10">
        <Link
          href="/myhome"
          className={`px-3 py-3 rounded-lg flex items-center gap-4 transition-all ${isActive('/myhome')
            ? 'bg-indigo-500/20 text-indigo-400'
            : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
            }`}
        >
          <Home className="w-6 h-6 flex-shrink-0" />
          <span className="text-sm">홈</span>
        </Link>

        {/* <button
          onClick={onSearchClick}
          className="px-3 py-3 rounded-lg flex items-center gap-4 text-gray-400 hover:bg-gray-800/50 hover:text-gray-300 transition-all text-left"
        >
          <Search className="w-6 h-6 flex-shrink-0" />
          <span className="text-sm">검색</span>
        </button> */}

        <Link
          href="/stories"
          className={`px-3 py-3 rounded-lg flex items-center gap-4 transition-all ${isActive('/stories')
            ? 'bg-indigo-500/20 text-indigo-400'
            : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
            }`}
        >
          <BookOpen className="w-6 h-6 flex-shrink-0" />
          <span className="text-sm">이야기</span>
        </Link>

        <Link
          href="/discussions"
          className={`px-3 py-3 rounded-lg flex items-center gap-4 transition-all ${isActive('/discussions')
            ? 'bg-indigo-500/20 text-indigo-400'
            : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
            }`}
        >
          <MessageSquare className="w-6 h-6 flex-shrink-0" />
          <span className="text-sm">독서 토론</span>
        </Link>

        {/* <Link
          href="/saved"
          className={`px-3 py-3 rounded-lg flex items-center gap-4 transition-all ${isActive('/saved')
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
            }`}
        >
          <Bookmark className="w-6 h-6 flex-shrink-0" />
          <span className="text-sm">저장</span>
        </Link> */}
      </div>

      {/* 하단 메뉴 */}
      <div className="mt-auto">
        {isAuthenticated && (
          <Link
            href="/profile"
            className="w-full flex items-center gap-4 p-4 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-base font-medium">내 프로필</span>
              <span className="text-sm text-gray-400">프로필 관리</span>
            </div>
          </Link>
        )}

        <div className="relative" ref={moreMenuRef}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`px-3 py-3 rounded-lg flex items-center gap-4 w-full text-left transition-all ${showMoreMenu
              ? 'bg-gray-800/50 text-gray-300'
              : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
              }`}
          >
            <Menu className="w-6 h-6 flex-shrink-0" />
            <span className="text-sm">더 보기</span>
          </button>

          {/* 더 보기 메뉴 */}
          {showMoreMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 z-20">
              <Link
                href="/stories/manage"
                className="px-4 py-3 flex items-center gap-3 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <BookOpen className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">이야기 관리</span>
              </Link>

              <Link
                href="/discussions/manage"
                className="px-4 py-3 flex items-center gap-3 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">토론 관리</span>
              </Link>

              <Link
                href="/comments/manage"
                className="px-4 py-3 flex items-center gap-3 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <Edit className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">댓글 관리</span>
              </Link>

              <div className="border-t border-gray-700"></div>

              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 flex items-center gap-3 text-red-400 hover:bg-gray-700 transition-colors"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">로그아웃</span>
                </button>
              ) : (
                <Link
                  href="/"
                  className="px-4 py-3 flex items-center gap-3 text-green-400 hover:bg-gray-700 transition-colors"
                >
                  <LogIn className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">로그인</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 