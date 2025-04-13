'use client';

import { useEffect, useRef, useState } from "react";
import HamburgerMenu from "@/components/HamburgerMenu";
import SearchModal from "@/components/SearchModal";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/Sidebar";
import NewPostButton from "@/components/NewPostButton";
import Loading from "@/components/Loading";
import { Heart, MessageCircle, BookText } from "lucide-react";
import StoryDetailModal from "@/components/StoryDetailModal";

// 스토리 타입 정의
interface Story {
  id: string;
  title: string;
  content: string;
  category: string;
  image_urls: string[];
  likes: number;
  commentCount: number;
  createdAt: string;
  author: {
    name: string | null;
    image: string | null;
    id: string | null;
  };
  // 이미지 분석을 위한 속성 추가
  imageLayout?: 'portrait' | 'landscape' | 'square';
  gridSpan?: 'row' | 'col' | 'both' | 'none';
}

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
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [historyStateAdded, setHistoryStateAdded] = useState(false);

  // 브라우저 뒤로가기 처리
  useEffect(() => {
    // popstate 이벤트 핸들러 정의
    const handlePopState = (event: PopStateEvent) => {
      console.log('popstate 이벤트 발생', event.state);
      // 뒤로가기 버튼 클릭 시 모달 닫기
      if (isModalOpen) {
        setIsModalOpen(false);
        setSelectedStory(null);
      }
    };
    
    // 모달이 열릴 때
    if (isModalOpen) {
      console.log('모달이 열림, 히스토리 상태 추가');
      
      // 모달이 열리면 히스토리에 상태 추가
      if (!historyStateAdded) {
        window.history.pushState({ modal: true }, '', window.location.pathname);
        setHistoryStateAdded(true);
      }
      
      // popstate 이벤트 리스너 등록
      window.addEventListener('popstate', handlePopState);
    }
    
    // 클린업 함수: 컴포넌트 언마운트 시, 또는 의존성 변경 시 실행
    return () => {
      console.log('이벤트 리스너 제거');
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isModalOpen]); // handleCloseModal은 제거하고 직접 상태 변경

  // 모달 닫힐 때 히스토리 상태 초기화
  useEffect(() => {
    if (!isModalOpen && historyStateAdded) {
      setHistoryStateAdded(false);
    }
  }, [isModalOpen, historyStateAdded]);

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    console.log('모달 닫기 핸들러 호출');
    setIsModalOpen(false);
    setSelectedStory(null);
  };

  // 스토리 선택 핸들러
  const handleStoryClick = (story: Story, imageIndex: number = 0) => {
    setSelectedStory(story);
    setCurrentImageIndex(imageIndex);
    setIsModalOpen(true);
  };

  // 클라이언트 사이드에서만 데이터 로드
  useEffect(() => {
    setIsClient(true);
    loadStories(0);
  }, []);

  const loadStories = async (pageNum: number) => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/stories?page=${pageNum}`);
      const data = await response.json();

      if (response.ok) {
        // 이미지 분석 및 그리드 레이아웃 결정
        const storiesWithLayout = await analyzeImages(data.stories);

        if (pageNum === 0) {
          setStories(storiesWithLayout);
        } else {
          setStories(prev => [...prev, ...storiesWithLayout]);
        }
        setHasMore(data.hasMore);
        setPage(pageNum);
      } else {
        console.error('스토리를 불러오는데 실패했습니다:', data.error);
      }
    } catch (error) {
      console.error('스토리를 불러오는 중 오류가 발생했습니다:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 이미지 크기 분석 함수
  const analyzeImages = async (stories: Story[]): Promise<Story[]> => {
    // 이미지 분석을 위한 Promise 배열
    const promises = stories.map(async (story) => {
      if (!story.image_urls || story.image_urls.length === 0) {
        return { ...story, imageLayout: 'square' as const, gridSpan: 'none' as const };
      }

      try {
        // 첫 번째 이미지의 크기 분석
        const layout = await getImageLayout(story.image_urls[0]);

        // 그리드 배치 결정
        let gridSpan: 'row' | 'col' | 'both' | 'none';

        // 이미지 비율에 따라 적절한 그리드 스팬 할당
        if (layout === 'landscape') {
          // 가로형 이미지는 가로로 2칸 차지 (약 30% 확률)
          gridSpan = Math.random() > 0.7 ? 'row' : 'none';
        } else if (layout === 'portrait') {
          // 세로형 이미지는 항상 세로로 2칸 차지
          gridSpan = 'col';
        } else if (Math.random() > 0.9) {
          // 정사각형 이미지 중 일부는 2x2 그리드 차지 (10% 확률)
          gridSpan = 'both';
        } else {
          gridSpan = 'none';
        }

        return { ...story, imageLayout: layout, gridSpan };
      } catch (error) {
        console.error('이미지 분석 중 오류:', error);
        return { ...story, imageLayout: 'square' as const, gridSpan: 'none' as const };
      }
    });

    return Promise.all(promises);
  };

  // 이미지 크기 비율 계산
  const getImageLayout = (imageUrl: string): Promise<'portrait' | 'landscape' | 'square'> => {
    return new Promise((resolve) => {
      const img = new globalThis.Image();
      img.onload = () => {
        const { width, height } = img;
        const ratio = width / height;

        // 비율 기준 조정: 더 엄격한 기준 적용
        if (ratio > 1.3) {
          resolve('landscape');
        } else if (ratio < 0.75) {
          resolve('portrait');
        } else {
          resolve('square');
        }
      };

      img.onerror = () => {
        // 이미지 로드 실패 시 기본값으로 square 반환
        resolve('square');
      };

      img.src = imageUrl;
    });
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
        loadStories(page + 1);
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
  }, [isLoading, isClient, page]);

  // 별도 컴포넌트: EndMessage
  const EndMessage = () => (
    <div className="text-gray-400 text-center">
      <p className="text-lg font-medium">모든 이야기를 불러왔습니다</p>
      <p className="text-sm mt-1">새로운 이야기를 기다려주세요</p>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* 모바일 헤더, 햄버거 메뉴, 사이드바, 검색 모달, 새 글 작성 버튼 */}
      <MobileHeader isMenuOpen={isMenuOpen} onMenuToggle={setIsMenuOpen} />
      <HamburgerMenu isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} />
      <Sidebar onSearchClick={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <NewPostButton isMenuOpen={isMenuOpen} path="/stories/new" />

      <main className="min-h-screen flex flex-col items-center px-4 md:pl-64 pb-8">
        <section className="w-full max-w-6xl pt-12 md:pt-8">
          {/* 갤러리(인스타그램) 보기 모드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 auto-rows-auto max-w-full grid-flow-dense">
            {isClient &&
              stories.map((story) => {
                // 그리드 스팬 클래스 결정
                const gridClass = story.gridSpan === 'row'
                  ? 'sm:col-span-2'
                  : story.gridSpan === 'col'
                    ? 'row-span-2'
                    : story.gridSpan === 'both'
                      ? 'sm:col-span-2 row-span-2'
                      : '';

                // 이미지 레이아웃에 따른 컨테이너 스타일 결정
                const containerClass = story.imageLayout === 'portrait'
                  ? 'aspect-[3/4]' // 세로형 이미지
                  : story.imageLayout === 'landscape'
                    ? 'aspect-[4/3]' // 가로형 이미지
                    : 'aspect-square'; // 정사각형 이미지

                return (
                  <div
                    key={story.id}
                    onClick={() => handleStoryClick(story)}
                    className={`relative block overflow-hidden group ${gridClass} cursor-pointer`}
                  >
                    <div className={`w-full h-full bg-gray-800/30 ${containerClass} max-h-[600px]`}>
                      {story.image_urls && story.image_urls.length > 0 && (
                        <div className="relative w-full h-full overflow-hidden">
                          <img
                            src={story.image_urls[0]}
                            alt={story.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {/* 오버레이 */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-4">
                              <div className="flex items-center gap-1 text-white">
                                <Heart className="w-5 h-5" />
                                <span>{story.likes}</span>
                              </div>
                              <div className="flex items-center gap-1 text-white">
                                <MessageCircle className="w-5 h-5" />
                                <span>{story.commentCount}</span>
                              </div>
                            </div>
                          </div>

                          {/* 이미지 인디케이터 */}
                          {story.image_urls.length > 1 && (
                            <div className="absolute top-2 right-2 z-10">
                              <div className="w-5 h-5 rounded-full bg-gray-900/60 backdrop-blur-sm flex items-center justify-center">
                                <BookText className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          )}

                          {/* 타이틀 오버레이 - 항상 표시되는 하단 그라데이션 */}
                          {/* <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pt-12 pb-3 z-10">
                            <h3 className="text-sm font-medium text-white line-clamp-1">{story.title}</h3>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-300">{story.author.name || '익명'}</p>
                              <p className="text-xs text-gray-400">{timeAgo(story.createdAt)}</p>
                            </div>
                          </div> */}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* 로딩 인디케이터 및 끝 메시지 */}
          <div ref={loadingRef} className="w-full py-8 flex flex-col items-center justify-center">
            {isLoading ? <Loading /> : !hasMore && <EndMessage />}
          </div>
        </section>
      </main>

      {/* 스토리 상세 모달 */}
      {selectedStory && (
        <StoryDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            console.log('StoryDetailModal onClose 콜백 실행');
            // 모달 닫기 시 호출되는 콜백
            handleCloseModal();
            
            // 스토리 정보 갱신 (최신 likes와 comments 카운트 반영)
            if (selectedStory) {
              fetch(`/api/stories/${selectedStory.id}`)
                .then(res => res.json())
                .then(data => {
                  if (data) {
                    // 스토리 목록에서 해당 스토리 업데이트
                    setStories(prevStories => 
                      prevStories.map(story => 
                        story.id === selectedStory.id 
                          ? { 
                              ...story, 
                              likes: data.likesCount || story.likes,
                              commentCount: data.commentsCount || story.commentCount
                            } 
                          : story
                      )
                    );
                  }
                })
                .catch(err => console.error('Error updating story data:', err));
            }
          }}
          story={{
            id: selectedStory.id,
            author: selectedStory.author.name || '익명',
            timeAgo: selectedStory.createdAt,
            title: selectedStory.title,
            content: selectedStory.content,
            likes: selectedStory.likes,
            comments: selectedStory.commentCount,
            category: selectedStory.category,
            images: selectedStory.image_urls,
            currentImageIndex
          }}
        />
      )}
    </div>
  );
} 