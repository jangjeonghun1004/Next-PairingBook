'use client';
import { useEffect, useRef, useState } from "react";
import StoryCard from "@/components/StoryCard";
import HamburgerMenu from "@/components/HamburgerMenu";
import SearchModal from "@/components/SearchModal";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/Sidebar";
import NewPostButton from "@/components/NewPostButton";

// 스토리 타입 정의
interface Story {
  id: number;
  author: string;
  timeAgo: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  category: string;
  images: string[];
}

// 더미 데이터 생성 함수
const generateDummyStories = (page: number): Story[] => {
  // 최대 5페이지(30개 스토리)까지만 생성
  if (page >= 5) return [];
  
  
  return Array.from({ length: 6 }, (_, i) => {
    const id = page * 6 + i;
    const imageCount = (id % 3) + 1; // 1~3개의 이미지로 고정
    
    return {
      id,
      author: `작성자 ${id}`,
      timeAgo: "방금 전",
      title: `독서 이야기 ${id}`,
      content: "이 책을 읽으면서 느낀 점은... 이 책을 읽으면서 느낀 점은... 이 책을 읽으면서 느낀 점은...",
      likes: 10 + (id % 90), // 10~99 사이의 고정된 값
      comments: 5 + (id % 25), // 5~29 사이의 고정된 값
      category: ["소설", "에세이", "논픽션"][id % 3],
      images: Array.from(
        { length: imageCount },
        (_, imgIndex) => `https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1000&auto=format&fit=crop&id=${id}-${imgIndex}`
      )
    };
  });
};

export default function StoriesPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 사이드에서만 데이터 로드
  useEffect(() => {
    setIsClient(true);
    setStories(generateDummyStories(0));
  }, []);

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
    if (!isClient) return;
    
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
  }, [isLoading, isClient]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 모바일 헤더 */}
      <MobileHeader isMenuOpen={isMenuOpen} onMenuToggle={setIsMenuOpen} />

      {/* 햄버거 메뉴 */}
      <HamburgerMenu isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} />

      {/* 좌측 사이드바 */}
      <Sidebar onSearchClick={() => setIsSearchOpen(true)} />

      {/* 검색 모달 */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* 새 글 작성 버튼 */}
      <NewPostButton isMenuOpen={isMenuOpen} path="/stories/new" />

      <div className="min-h-screen flex flex-col items-center px-4 md:pl-24 pb-8">
        <div className="w-full max-w-6xl pt-16 md:pt-8">
          {/* 이야기 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {isClient && stories.map((story) => (
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