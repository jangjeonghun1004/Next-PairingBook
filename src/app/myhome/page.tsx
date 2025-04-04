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

// 팔로우한 친구 타입 정의
interface FollowedFriend {
  id: number;
  name: string;
  avatar: string;
  isOnline: boolean;
}

// 더미 데이터 생성 함수 - 팔로우한 친구들의 스토리
const generateDummyStories = (page: number): Story[] => {
  // 최대 5페이지(30개 스토리)까지만 생성
  if (page >= 5) return [];


  return Array.from({ length: 6 }, (_, i) => {
    const id = page * 6 + i;
    const imageCount = (id % 3) + 1; // 1~3개의 이미지로 고정

    return {
      id,
      author: `팔로우한 친구 ${id % 10}`, // 10명의 친구로 제한
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

// 팔로우한 친구 더미 데이터 생성
const generateFollowedFriends = (): FollowedFriend[] => {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i,
    name: `친구 ${i}`,
    avatar: `https://i.pravatar.cc/150?img=${i + 10}`, // 다양한 아바타 이미지
    isOnline: Math.random() > 0.3, // 70% 확률로 온라인
  }));
};

export default function MyHomePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [followedFriends, setFollowedFriends] = useState<FollowedFriend[]>([]);
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
    setFollowedFriends(generateFollowedFriends());
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
          {/* 팔로우한 친구 프로필 아이콘 */}
          <div className="mb-8">
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                팔로우한
              </span>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                친구들
              </span>
            </div>
            <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide">
              {followedFriends.map((friend) => (
                <div key={friend.id} className="flex flex-col items-center gap-2 shrink-0">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500">
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {friend.isOnline && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-gray-900"></div>
                    )}
                  </div>
                  <span className="text-sm font-medium">{friend.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 이야기 목록 */}
          <div className="flex flex-col gap-6">
            {isClient && stories.map((story) => (
              <div key={story.id} className="w-full max-w-2xl mx-auto">
                <StoryCard
                  author={story.author}
                  timeAgo={story.timeAgo}
                  title={story.title}
                  content={story.content}
                  likes={story.likes}
                  comments={story.comments}
                  category={story.category}
                  images={story.images}
                  hideFollowButton={true}
                />
              </div>
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