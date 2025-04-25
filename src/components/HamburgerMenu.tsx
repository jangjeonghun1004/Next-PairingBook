'use client';

import { BookOpen, Home, MessageSquare, User, Edit, LogOut, LogIn, Wrench } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

interface HamburgerMenuProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function HamburgerMenu({ isOpen, onOpenChange }: HamburgerMenuProps) {
  const { status, data: session } = useSession();
  const isAuthenticated = status === 'authenticated';
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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

  // 모바일 메뉴 내부에서 터치 이벤트 처리
  useEffect(() => {
    const menuElement = menuRef.current;
    
    const handleTouchMove = (e: TouchEvent) => {
      // 메뉴 내부 영역이면 이벤트를 계속 진행하고, 아니면 이벤트 중지
      const isInsideMenu = menuElement?.contains(e.target as Node);
      if (!isInsideMenu) {
        e.preventDefault();
      }
    };

    // 메뉴가 열려있을 때만 이벤트 리스너 추가
    if (isOpen && menuElement) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen]);

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  return (
    <>
      {/* 모바일 메뉴 */}
      <div
        className={`md:hidden fixed inset-0 bg-gray-900/95 backdrop-blur-sm z-40 transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
      >
        <div 
          ref={menuRef}
          className="flex flex-col h-full pt-20 pb-8 px-6 overflow-y-auto overscroll-contain"
        >
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
              href="/myhome"
              className="flex items-center gap-4 p-4 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all"
              onClick={() => onOpenChange(false)}
            >
              <Home className="w-6 h-6" />
              <span className="text-base font-medium">홈</span>
            </Link>
            <Link
              href="/stories"
              className="flex items-center gap-4 p-4 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all"
              onClick={() => onOpenChange(false)}
            >
              <BookOpen className="w-6 h-6" />
              <span className="text-base font-medium">이야기</span>
            </Link>

            <Link
              href="/discussions"
              className="flex items-center gap-4 p-4 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all"
              onClick={() => onOpenChange(false)}
            >
              <MessageSquare className="w-6 h-6" />
              <span className="text-base font-medium">독서 토론</span>
            </Link>
          </nav>

          {/* 프로필 섹션 */}
          <div className="mt-auto">
            <Link
              href="/profile"
              className="flex items-center gap-4 p-4 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all w-full"
              onClick={() => onOpenChange(false)}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center overflow-hidden">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt="프로필 이미지"
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-base font-medium">내 프로필</span>
                <span className="text-sm text-gray-400">페어링 BOOK 관리</span>
              </div>
            </Link>
          </div>

          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`text-gray-300 px-6 py-3 rounded-lg flex items-center gap-4 w-full text-left transition-all 
                ${showMoreMenu && 'bg-gray-800/50'}
              `}
            >
              <Wrench className="w-6 h-6" />
              <span className="text-base font-medium">관리 도구</span>
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
    </>
  );
} 