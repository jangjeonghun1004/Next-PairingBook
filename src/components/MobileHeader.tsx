'use client';

import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import { useEffect, useState } from "react";

interface MobileHeaderProps {
  isMenuOpen: boolean;
  onMenuToggle: (isOpen: boolean) => void;
}

export default function MobileHeader({ isMenuOpen, onMenuToggle }: MobileHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  // 스크롤 이벤트 핸들러 추가
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    // 스크롤 이벤트 리스너 등록
    window.addEventListener('scroll', handleScroll);
    
    // 초기 로드 시 한 번 실행
    handleScroll();
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`md:hidden fixed top-0 left-0 right-0 z-[100] transition-all duration-200 ${
      scrolled ? 'bg-gray-900/90 backdrop-blur-md shadow-md' : 'bg-gray-900/80 backdrop-blur-sm'
    } border-b border-gray-800`}>
      <div className="max-w-7xl mx-auto px-4 py-3.5">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Logo size="lg" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">페어링 BOOK</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isMenuOpen ? (
              <button
                onClick={() => onMenuToggle(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="메뉴 닫기"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => onMenuToggle(true)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="메뉴 열기"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 