'use client';

import { useEffect, useRef, useState } from "react";
import HamburgerMenu from "@/components/HamburgerMenu";
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
  // 스크롤 위치 저장을 위한 변수 추가
  const [savedScrollPosition, setSavedScrollPosition] = useState(0);
  // 메인 컨테이너 ref 추가
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // 브라우저 뒤로가기 처리
  useEffect(() => {
    // popstate 이벤트 핸들러 정의
    const handlePopState = () => {
      if (isModalOpen) {
        handleCloseModal();
      }
    };
    
    // 모달이 열릴 때
    if (isModalOpen) {
      // 모달이 열리면 히스토리에 상태 추가
      if (!historyStateAdded) {
        window.history.pushState({ modal: true }, '', window.location.pathname);
        setHistoryStateAdded(true);
      }
      
      // popstate 이벤트 리스너 등록
      window.addEventListener('popstate', handlePopState);
    }
    
    // 클린업 함수
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isModalOpen, historyStateAdded]);

  // 모달 닫힐 때 히스토리 상태 초기화
  useEffect(() => {
    if (!isModalOpen && historyStateAdded) {
      setHistoryStateAdded(false);
    }
  }, [isModalOpen, historyStateAdded]);

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStory(null);
    
    // 약간의 지연 후 저장된 스크롤 위치로 복원
    setTimeout(() => {
      window.scrollTo({
        top: savedScrollPosition,
        behavior: 'instant'
      });
    }, 10);
  };

  // 스토리 선택 핸들러
  const handleStoryClick = (story: Story, imageIndex: number = 0) => {
    // 현재 스크롤 위치 저장
    setSavedScrollPosition(window.scrollY);
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
    const promises = stories.map(async (story) => {
      if (!story.image_urls || story.image_urls.length === 0) {
        return { ...story, imageLayout: 'square' as const, gridSpan: 'none' as const };
      }

      try {
        // 첫 번째 이미지의 크기 분석
        const layout = await getImageLayout(story.image_urls[0]);
        let gridSpan: 'row' | 'col' | 'both' | 'none';

        // 이미지 비율에 따라 그리드 스팬 할당
        if (layout === 'landscape') {
          gridSpan = Math.random() > 0.7 ? 'row' : 'none';
        } else if (layout === 'portrait') {
          gridSpan = 'col';
        } else if (Math.random() > 0.9) {
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
        const ratio = img.width / img.height;
        if (ratio > 1.3) resolve('landscape');
        else if (ratio < 0.75) resolve('portrait');
        else resolve('square');
      };

      img.onerror = () => resolve('square');
      img.src = imageUrl;
    });
  };

  // 무한 스크롤 설정
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

  // 스토리 업데이트 함수
  const updateStoryData = (storyId: string) => {
    fetch(`/api/stories/${storyId}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setStories(prevStories => 
            prevStories.map(story => 
              story.id === storyId 
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
  };

  // 별도 컴포넌트: EndMessage
  const EndMessage = () => (
    <div className="text-gray-400 text-center">
      <p className="text-lg font-medium">모든 이야기를 불러왔습니다</p>
      <p className="text-sm mt-1">새로운 이야기를 기다려주세요</p>
    </div>
  );

  // 공통 CSS 클래스
  const transitionClasses = "transition-all duration-300";
  const hoverScaleClasses = "transition-transform duration-500 group-hover:scale-105";

  return (
    <div className="min-h-screen">
      {/* UI 컴포넌트 */}
      <MobileHeader isMenuOpen={isMenuOpen} onMenuToggle={setIsMenuOpen} />
      <HamburgerMenu isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} />
      <Sidebar/>
      <NewPostButton isMenuOpen={isMenuOpen} path="/stories/new" />

      <main ref={mainContainerRef} className="min-h-screen flex flex-col items-center px-4 md:pl-64 pb-8">
        <section className="w-full max-w-6xl pt-12 md:pt-8">
          {/* 갤러리 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-2 auto-rows-auto max-w-full grid-flow-dense">
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
                  ? 'aspect-[3/4]'
                  : story.imageLayout === 'landscape'
                    ? 'aspect-[4/3]'
                    : 'aspect-square';

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
                            className={`w-full h-full object-cover ${hoverScaleClasses}`}
                          />
                          {/* 오버레이 */}
                          <div className={`absolute inset-0 bg-black/0 group-hover:bg-black/40 ${transitionClasses} flex items-center justify-center`}>
                            <div className={`opacity-0 group-hover:opacity-100 ${transitionClasses} flex gap-4`}>
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
            handleCloseModal();
            if (selectedStory) {
              updateStoryData(selectedStory.id);
            }
          }}
          story={{
            id: selectedStory.id,
            author: selectedStory.author.name || '익명',
            authorImage: selectedStory.author.image || '',
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