'use client';
import { ArrowLeft, Search, Home, BookOpen, Bookmark, User } from "lucide-react";
import Link from "next/link";
import StoryCard from "@/components/StoryCard";
import HamburgerMenu from "@/components/HamburgerMenu";
import SearchModal from "@/components/SearchModal";
import { useState } from "react";

export default function StoriesPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 햄버거 메뉴 */}
      <HamburgerMenu />

      {/* 좌측 사이드바 */}
      <aside className="hidden md:flex fixed top-0 left-0 h-full w-20 bg-gray-900/80 backdrop-blur-sm z-10 flex-col items-center py-6 border-r border-gray-800">
        <div className="flex flex-col items-center gap-8">
          {/* 로고 */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
            P
          </div>

          {/* 네비게이션 */}
          <nav className="flex flex-col items-center gap-6">
            <Link href="/" className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors group">
              <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-xs">홈</span>
            </Link>
            <Link href="/stories" className="flex flex-col items-center gap-1 text-white transition-colors group">
              <BookOpen className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-xs">이야기</span>
            </Link>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors group"
            >
              <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-xs">검색</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors group">
              <Bookmark className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-xs">저장</span>
            </button>
          </nav>

          {/* 프로필 */}
          <div className="mt-auto">
            <button className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="text-xs">프로필</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 검색 모달 */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <div className="min-h-screen flex flex-col items-center px-4 md:pl-24 pb-8">
        <div className="w-full max-w-6xl pt-16 md:pt-8">
          {/* 이야기 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StoryCard
              author="김독서"
              timeAgo="2시간 전"
              title="데미안을 읽고"
              content="데미안을 읽으면서 느낀 점은... 데미안을 읽으면서 느낀 점은... 데미안을 읽으면서 느낀 점은... 데미안을 읽으면서 느낀 점은..."
              likes={24}
              comments={8}
              category="소설"
              imageUrl="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1000&auto=format&fit=crop"
            />
            <StoryCard
              author="이책사"
              timeAgo="5시간 전"
              title="어린 왕자의 여행"
              content="어린 왕자를 읽으면서 느낀 점은... 어린 왕자를 읽으면서 느낀 점은... 어린 왕자를 읽으면서 느낀 점은... 어린 왕자를 읽으면서 느낀 점은..."
              likes={42}
              comments={15}
              category="에세이"
              imageUrl="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1000&auto=format&fit=crop"
            />
            <StoryCard
              author="책사랑"
              timeAgo="1일 전"
              title="1984를 읽고"
              content="1984를 읽으면서 느낀 점은... 1984를 읽으면서 느낀 점은... 1984를 읽으면서 느낀 점은... 1984를 읽으면서 느낀 점은..."
              likes={36}
              comments={12}
              category="논픽션"
              imageUrl="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1000&auto=format&fit=crop"
            />
            <StoryCard
              author="독서왕"
              timeAgo="3일 전"
              title="노인과 바다"
              content="노인과 바다를 읽으면서 느낀 점은... 노인과 바다를 읽으면서 느낀 점은... 노인과 바다를 읽으면서 느낀 점은..."
              likes={28}
              comments={5}
              category="소설"
              imageUrl="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1000&auto=format&fit=crop"
            />
            <StoryCard
              author="책벌레"
              timeAgo="4일 전"
              title="동물농장"
              content="동물농장을 읽으면서 느낀 점은... 동물농장을 읽으면서 느낀 점은... 동물농장을 읽으면서 느낀 점은..."
              likes={31}
              comments={9}
              category="소설"
              imageUrl="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1000&auto=format&fit=crop"
            />
            <StoryCard
              author="책사랑"
              timeAgo="5일 전"
              title="위대한 개츠비"
              content="위대한 개츠비를 읽으면서 느낀 점은... 위대한 개츠비를 읽으면서 느낀 점은... 위대한 개츠비를 읽으면서 느낀 점은..."
              likes={19}
              comments={4}
              category="소설"
              imageUrl="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1000&auto=format&fit=crop"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 