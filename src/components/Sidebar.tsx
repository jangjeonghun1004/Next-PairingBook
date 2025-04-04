'use client';

import { Home, BookOpen, Search, Bookmark, User, MessageSquare, PenSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  onSearchClick: () => void;
}

export default function Sidebar({ onSearchClick }: SidebarProps) {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="hidden md:flex flex-col w-24 h-screen fixed left-0 top-0 bg-gray-900 border-r border-gray-800 z-10">
      {/* 로고 영역 */}
      <Link href="/">
      <div className="flex items-center justify-center h-16 border-b border-gray-800">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span className="text-lg font-bold text-white">P</span>
        </div>
      </div>
      </Link>
      
      {/* 메인 메뉴 */}
      <div className="flex flex-col items-center py-4 gap-2">
        <Link 
          href="/myhome" 
          className={`w-full px-3 py-2 rounded-xl flex items-center gap-3 transition-all ${
            isActive('/') 
              ? 'bg-indigo-500/20 text-indigo-400' 
              : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
          }`}
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">홈</span>
        </Link>
        
        <Link 
          href="/stories" 
          className={`w-full px-3 py-2 rounded-xl flex items-center gap-3 transition-all ${
            isActive('/stories') 
              ? 'bg-indigo-500/20 text-indigo-400' 
              : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
          }`}
        >
          <BookOpen className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">스토리</span>
        </Link>
        
        <Link 
          href="/discussions" 
          className={`w-full px-3 py-2 rounded-xl flex items-center gap-3 transition-all ${
            isActive('/discussions') 
              ? 'bg-indigo-500/20 text-indigo-400' 
              : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
          }`}
        >
          <MessageSquare className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">토론</span>
        </Link>
        
        <button 
          onClick={onSearchClick}
          className="w-full px-3 py-2 rounded-xl flex items-center gap-3 text-gray-400 hover:bg-gray-800/50 hover:text-gray-300 transition-all"
        >
          <Search className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">검색</span>
        </button>
        
        <Link 
          href="/myhome" 
          className={`w-full px-3 py-2 rounded-xl flex items-center gap-3 transition-all ${
            isActive('/myhome') 
              ? 'bg-indigo-500/20 text-indigo-400' 
              : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
          }`}
        >
          <Bookmark className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">저장</span>
        </Link>
      </div>
      
      {/* 구분선 */}
      <div className="flex-1 border-b border-gray-800 mx-3 my-2"></div>
      
      {/* 프로필 및 새 글 작성 */}
      <div className="flex flex-col items-center py-4 gap-2">
        <Link 
          href="/profile" 
          className={`w-full px-3 py-2 rounded-xl flex items-center gap-3 transition-all ${
            isActive('/profile') 
              ? 'bg-indigo-500/20 text-indigo-400' 
              : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
          }`}
        >
          <User className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">프로필</span>
        </Link>
        
        <Link 
          href="/new" 
          className="w-full px-3 py-2 rounded-xl flex items-center gap-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20"
        >
          <PenSquare className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">새 글</span>
        </Link>
      </div>
    </div>
  );
} 