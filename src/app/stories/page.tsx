'use client';
import { Search, Home, BookOpen, Bookmark, User, PenSquare } from "lucide-react";
import Link from "next/link";
import StoryCard from "@/components/StoryCard";
import HamburgerMenu from "@/components/HamburgerMenu";
import SearchModal from "@/components/SearchModal";
import { useEffect, useRef, useState } from "react";

// 더미 데이터 생성 함수
const generateDummyStories = (page: number) => {
  // 최대 5페이지(30개 스토리)까지만 생성
  if (page >= 5) return [];
  
  return Array.from({ length: 6 }, (_, i) => ({
    id: page * 6 + i,
    author: `작성자 ${page * 6 + i}`,
    timeAgo: "방금 전",
    title: `독서 이야기 ${page * 6 + i}`,
    content: "이 책을 읽으면서 느낀 점은... 이 책을 읽으면서 느낀 점은... 이 책을 읽으면서 느낀 점은...",
    likes: Math.floor(Math.random() * 100),
    comments: Math.floor(Math.random() * 30),
    category: ["소설", "에세이", "논픽션"][Math.floor(Math.random() * 3)],
    images: Array.from(
      { length: Math.floor(Math.random() * 4) + 1 }, // 1~4개의 이미지
      () => "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1000&auto=format&fit=crop"
    )
  }));
};

export default function StoriesPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stories, setStories] = useState(() => generateDummyStories(0));
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreStories = async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    // 실제 API 호출을 시뮬레이션하기 위한 지연
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const nextPage = page + 1;
    const newStories = generateDummyStories(nextPage);
    
    if (newStories.length === 0) {
      setHasMore(false);
    } else {
      setStories(prev => [...prev, ...newStories]);
      setPage(nextPage);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '20px',
      threshold: 1.0
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [target] = entries;
      if (target.isIntersecting && !isLoading) {
        loadMoreStories();
      }
    }, options);

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isLoading]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 햄버거 메뉴 */}
      <HamburgerMenu isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} />

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

      {/* 새 글 작성 버튼 */}
      <Link
        href="/stories/new"
        className={`fixed right-6 bottom-6 z-30 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 hover:scale-110 ${
          isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <PenSquare className="w-6 h-6 text-white" />
      </Link>

      <div className="min-h-screen flex flex-col items-center px-4 md:pl-24 pb-8">
        <div className="w-full max-w-6xl pt-16 md:pt-8">
          {/* 이야기 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                author={story.author}
                timeAgo={story.timeAgo}
                title={story.title}
                content={story.content}
                likes={story.likes}
                comments={story.comments}
                category={story.category}
                images={story.images}
              />
            ))}
          </div>

          {/* 로딩 인디케이터와 끝 메시지 */}
          <div ref={loadingRef} className="w-full py-8 flex flex-col items-center justify-center">
            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
              </div>
            )}
            {!hasMore && (
              <div className="text-gray-400 text-center">
                <p className="text-lg font-medium">모든 이야기를 불러왔습니다</p>
                <p className="text-sm mt-1">새로운 이야기를 기다려주세요 📚</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 