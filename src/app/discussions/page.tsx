'use client';
import { useEffect, useRef, useState } from "react";
import HamburgerMenu from "@/components/HamburgerMenu";
import SearchModal from "@/components/SearchModal";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/Sidebar";
import NewPostButton from "@/components/NewPostButton";
import DiscussionCard from "@/components/DiscussionCard";
import {Filter, Search } from "lucide-react";

// 토론 타입 정의
interface Discussion {
  id: number;
  title: string;
  content: string;
  author: string;
  bookTitle: string;
  bookAuthor: string;
  timeAgo: string;
  likes: number;
  comments: number;
  tags: string[];
  images: string[];
}

// 더미 데이터 생성 함수
const generateDummyDiscussions = (page: number): Discussion[] => {
  // 최대 5페이지(30개 토론)까지만 생성
  if (page >= 5) return [];
  
  // 고정된 시드 값을 사용하여 일관된 결과 생성
  //const seed = page * 100;
  
  const bookTitles = [
    "1984", "동물농장", "위대한 개츠비", "파우스트", "변신", 
    "노인과 바다", "파리대왕", "이방인", "알리바바와 40인의 도둑", "로미오와 줄리엣"
  ];
  
  const bookAuthors = [
    "조지 오웰", "조지 오웰", "F. 스콧 피츠제럴드", "요한 볼프강 폰 괴테", "프란츠 카프카",
    "어니스트 헤밍웨이", "윌리엄 골딩", "알베르 카뮈", "알렉산드르 뒤마", "윌리엄 셰익스피어"
  ];
  
  const tags = [
    ["고전", "디스토피아"], ["고전", "알레고리"], ["고전", "로맨스"], ["고전", "드라마"], ["고전", "심리"],
    ["고전", "모험"], ["고전", "스릴러"], ["고전", "실존주의"], ["고전", "모험"], ["고전", "로맨스"]
  ];
  
  // 이미지 URL 배열
  const imageUrls = [
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000",
    "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1000",
    "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1000",
    "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=1000",
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000",
    "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1000",
    "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1000",
    "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=1000",
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000",
    "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1000"
  ];
  
  return Array.from({ length: 6 }, (_, i) => {
    const id = page * 6 + i;
    const bookIndex = id % bookTitles.length;
    
    // 이미지 개수는 0~3개 사이로 랜덤하게 설정
    const imageCount = Math.floor(Math.random() * 4);
    const images = imageCount > 0 
      ? Array.from({ length: imageCount }, (_, imgIndex) => 
          imageUrls[(bookIndex + imgIndex) % imageUrls.length])
      : [];
    
    return {
      id,
      title: `${bookTitles[bookIndex]}에 대한 토론`,
      content: "이 책을 읽고 나서 느낀 점은... 이 책을 읽고 나서 느낀 점은... 이 책을 읽고 나서 느낀 점은... 이 책을 읽고 나서 느낀 점은... 이 책을 읽고 나서 느낀 점은...",
      author: `독서가 ${id % 20}`,
      bookTitle: bookTitles[bookIndex],
      bookAuthor: bookAuthors[bookIndex],
      timeAgo: "방금 전",
      likes: 10 + (id % 90), // 10~99 사이의 고정된 값
      comments: 5 + (id % 25), // 5~29 사이의 고정된 값
      tags: tags[bookIndex],
      images
    };
  });
};

export default function DiscussionsPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("최신순");
  const [searchQuery, setSearchQuery] = useState("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 사이드에서만 데이터 로드
  useEffect(() => {
    setIsClient(true);
    setDiscussions(generateDummyDiscussions(0));
  }, []);

  const loadMoreDiscussions = async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    // 실제 API 호출을 시뮬레이션하기 위한 지연
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const nextPage = page + 1;
    const newDiscussions = generateDummyDiscussions(nextPage);
    
    if (newDiscussions.length === 0) {
      setHasMore(false);
    } else {
      setDiscussions(prev => [...prev, ...newDiscussions]);
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
        loadMoreDiscussions();
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
      <NewPostButton isMenuOpen={isMenuOpen} path="/discussions/new" />

      <div className="min-h-screen flex flex-col items-center px-4 md:pl-28 pb-8">
        <div className="w-full max-w-4xl pt-16 md:pt-8">
          {/* 헤더 */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                토론
              </span>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                공간
              </span>
            </div>
            <p className="text-gray-400">책에 대한 다양한 의견을 나누는 공간입니다.</p>
          </div>

          {/* 검색 및 필터 */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="토론 검색..."
                className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="최신순">최신순</option>
                <option value="인기순">인기순</option>
                <option value="댓글순">댓글순</option>
              </select>
            </div>
          </div>

          {/* 토론 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isClient && discussions.map((discussion) => (
              <DiscussionCard
                key={discussion.id}
                id={discussion.id}
                title={discussion.title}
                content={discussion.content}
                author={discussion.author}
                bookTitle={discussion.bookTitle}
                bookAuthor={discussion.bookAuthor}
                timeAgo={discussion.timeAgo}
                likes={discussion.likes}
                comments={discussion.comments}
                tags={discussion.tags}
                images={discussion.images}
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
                <p className="text-lg font-medium">모든 토론을 불러왔습니다</p>
                <p className="text-sm mt-1">새로운 토론을 기다려주세요 📚</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 