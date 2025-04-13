'use client';

import { Home, BookOpen, Search, Bookmark, User, MessageSquare, PenSquare, Menu, Settings, Activity, Moon, HelpCircle, LogOut, LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

interface SidebarProps {
  onSearchClick: () => void;
}

export default function Sidebar({ onSearchClick }: SidebarProps) {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
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

        <button
          onClick={onSearchClick}
          className="px-3 py-3 rounded-lg flex items-center gap-4 text-gray-400 hover:bg-gray-800/50 hover:text-gray-300 transition-all text-left"
        >
          <Search className="w-6 h-6 flex-shrink-0" />
          <span className="text-sm">검색</span>
        </button>

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

        <Link
          href="/saved"
          className={`px-3 py-3 rounded-lg flex items-center gap-4 transition-all ${isActive('/saved')
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
            }`}
        >
          <Bookmark className="w-6 h-6 flex-shrink-0" />
          <span className="text-sm">저장</span>
        </Link>

        <Link
          href="/profile"
          className={`px-3 py-3 rounded-lg flex items-center gap-4 transition-all ${isActive('/profile')
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
            }`}
        >
          <User className="w-6 h-6 flex-shrink-0" />
          <span className="text-sm">프로필</span>
        </Link>
      </div>

      {/* 하단 메뉴 */}
      <div className="mt-auto">
        {isAuthenticated && (
          <Link
            href="/new"
            className="px-3 py-3 rounded-lg flex items-center gap-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20 mb-4"
          >
            <PenSquare className="w-6 h-6 flex-shrink-0" />
            <span className="text-sm">새 글</span>
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
                href="/settings"
                className="px-4 py-3 flex items-center gap-3 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">설정</span>
              </Link>

              {isAuthenticated && (
                <Link
                  href="/activity"
                  className="px-4 py-3 flex items-center gap-3 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <Activity className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">활동</span>
                </Link>
              )}

              {isAuthenticated && (
                <Link
                  href="/saved"
                  className="px-4 py-3 flex items-center gap-3 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <Bookmark className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">저장된 항목</span>
                </Link>
              )}

              <button
                className="w-full px-4 py-3 flex items-center gap-3 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <Moon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">테마 변경</span>
              </button>

              <Link
                href="/help"
                className="px-4 py-3 flex items-center gap-3 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <HelpCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">도움말</span>
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