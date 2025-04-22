'use client';
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import HamburgerMenu from "@/components/HamburgerMenu";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/Sidebar";
import { toast } from "react-hot-toast";
import { HomeIcon, Activity, Edit, MessageSquare, Heart, MessageCircle } from "lucide-react";
import Loading from "@/components/Loading";
import { timeAgo } from "@/lib/utils";
import ImageSlider from "@/components/ImageSlider";

// 타입 정의
interface User {
  id: string;
  name: string;
  image: string;
  lastActive: string;
  isOnline: boolean;
}

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
    id: string;
    name: string;
    image: string;
  };
  // 이미지 분석을 위한 속성 추가
  imageLayout?: 'portrait' | 'landscape' | 'square';
  // 고유 식별자 추가 (무한 스크롤 시 key 충돌 방지)
  clientId?: string;
}

interface Discussion {
  id: string;
  title: string;
  bookTitle: string;
  bookAuthor: string;
  imageUrls: string[];
  scheduledAt: string | null;
  privacy: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    image: string;
  };
  participants: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      image: string;
    };
  }>;
  participantCount: number;
  status?: string; // 참여 상태 추가 (approved, pending)
}

interface PendingRequest {
  id: string;
  title: string;
  bookTitle: string;
  bookAuthor: string;
  createdAt: string;
  imageUrls: string[];
  pendingParticipants: Array<{
    id: string;
    userId: string;
    name: string;
    image: string;
    requestDate: string;
  }>;
}

interface HomeData {
  followedUsers: User[];
  recentStories: Story[];
  myDiscussions: Discussion[];
  pendingRequests: PendingRequest[];
  myStories: Story[];
  likedStories: Story[];
  isLoading: boolean;
  error: string | null;
}

export default function MyHomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [data, setData] = useState<HomeData>({
    followedUsers: [],
    recentStories: [],
    myDiscussions: [],
    pendingRequests: [],
    myStories: [],
    likedStories: [],
    isLoading: true,
    error: null
  });
  const [page, setPage] = useState(0);
  const [hasMoreStories, setHasMoreStories] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 로그인 상태가 아니면 홈페이지로 리다이렉트
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    // 로그인 상태일 때만 데이터 로드
    if (status === 'authenticated') {
      fetchHomeData();
    }
  }, [status, router]);

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

  // 스토리 이미지 분석
  const analyzeStoryImages = async (stories: Story[]): Promise<Story[]> => {
    const promises = stories.map(async (story) => {
      if (!story.image_urls || story.image_urls.length === 0) {
        return { ...story, imageLayout: 'square' as const };
      }

      try {
        // 첫 번째 이미지의 크기 분석
        const layout = await getImageLayout(story.image_urls[0]);
        // 고유 ID 생성 (클라이언트 사이드에서만 실행됨)
        // 무한 스크롤로 추가될 때 id가 중복될 수 있으므로 clientId 속성 추가
        return { 
          ...story, 
          imageLayout: layout,
          clientId: story.id + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
        };
      } catch (error) {
        console.error('이미지 분석 중 오류:', error);
        return { 
          ...story, 
          imageLayout: 'square' as const,
          clientId: story.id + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
        };
      }
    });

    return Promise.all(promises);
  };

  // 초기 홈 데이터 로드
  const fetchHomeData = async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/myhome');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '데이터를 불러오는 중 오류가 발생했습니다.');
      }

      const responseData = await response.json();
      
      // 스토리 이미지 분석
      const storiesWithLayout = await analyzeStoryImages(responseData.recentStories);

      setData({
        followedUsers: responseData.followedUsers,
        recentStories: storiesWithLayout,
        myDiscussions: responseData.myDiscussions,
        pendingRequests: responseData.pendingRequests,
        myStories: responseData.myStories,
        likedStories: responseData.likedStories,
        isLoading: false,
        error: null
      });
      
      // 첫 페이지를 로드했으므로 page를 0으로 설정
      setPage(0);
      // 더 불러올 데이터가 있는지 확인 (초기 데이터가 5개 미만이면 더 이상 없다고 가정)
      setHasMoreStories(responseData.recentStories.length >= 5);
    } catch (error: unknown) {
      console.error('마이홈 데이터 로드 중 오류:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : '데이터를 불러오는 중 오류가 발생했습니다.';

      setData(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast.error(errorMessage);
    }
  };

  // 추가 스토리 로드
  const loadMoreStories = useCallback(async () => {
    if (isLoadingMore || !hasMoreStories) return;

    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      
      const response = await fetch(`/api/stories/feed?page=${nextPage}`);
      
      if (!response.ok) {
        throw new Error('추가 스토리를 불러오는 중 오류가 발생했습니다.');
      }
      
      const responseData = await response.json();
      
      if (responseData.stories.length === 0) {
        setHasMoreStories(false);
      } else {
        // 새로 로드한 스토리들의 이미지도 분석
        const newStoriesWithLayout = await analyzeStoryImages(responseData.stories);
        
        setData(prev => ({
          ...prev,
          recentStories: [...prev.recentStories, ...newStoriesWithLayout]
        }));
        setPage(nextPage);
        setHasMoreStories(responseData.hasMore);
      }
    } catch (error) {
      console.error('추가 스토리 로드 중 오류:', error);
      toast.error('추가 스토리를 불러오는 데 실패했습니다.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, isLoadingMore, hasMoreStories]);

  // 무한 스크롤 인터섹션 옵저버 설정
  useEffect(() => {
    if (!loadingRef.current || data.isLoading) return;

    const options = {
      root: null,
      rootMargin: '20px',
      threshold: 0.5
    };

    const observer = new IntersectionObserver(entries => {
      const [entry] = entries;
      if (entry.isIntersecting && !isLoadingMore && hasMoreStories) {
        loadMoreStories();
      }
    }, options);

    observer.observe(loadingRef.current);

    return () => {
      if (loadingRef.current) {
        observer.unobserve(loadingRef.current);
      }
    };
  }, [loadMoreStories, data.isLoading, isLoadingMore, hasMoreStories]);

  const ErrorState = () => (
    <div className="w-full py-10 flex justify-center">
      <div className="text-red-400 text-center">
        <p>{data.error}</p>
        <button
          onClick={fetchHomeData}
          className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-gray-400 text-center py-8">
      <p>{message}</p>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* 모바일 헤더 */}
      <MobileHeader isMenuOpen={isMenuOpen} onMenuToggle={setIsMenuOpen} />

      {/* 햄버거 메뉴 */}
      <HamburgerMenu isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} />

      {/* 좌측 사이드바 */}
      <Sidebar />

      {/* 메인 콘텐츠 */}
      <main className="px-4 md:pl-64 py-8 pb-20">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">마이홈</h1>
            <div className="text-sm text-gray-400">
              {session?.user?.name}님, 반갑습니다!
            </div>
          </div>

          {/* 메인 메뉴 */}
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <Link href="/myhome" className="flex-1 min-w-32 bg-indigo-600 hover:bg-indigo-700 rounded-lg p-4 transition-colors">
              <div className="flex items-center justify-center flex-col gap-2">
                <HomeIcon className="w-6 h-6" />
                <span className="font-medium text-sm">마이홈</span>
              </div>
            </Link>
            <Link href="/stories/manage" className="flex-1 min-w-32 bg-gray-800/70 hover:bg-gray-700 rounded-lg p-4 transition-colors">
              <div className="flex items-center justify-center flex-col gap-2">
                <Edit className="w-6 h-6" />
                <span className="font-medium text-sm">이야기 관리</span>
              </div>
            </Link>
            <Link href="/discussions/manage" className="flex-1 min-w-32 bg-gray-800/70 hover:bg-gray-700 rounded-lg p-4 transition-colors">
              <div className="flex items-center justify-center flex-col gap-2">
                <Activity className="w-6 h-6" />
                <span className="font-medium text-sm">토론 관리</span>
              </div>
            </Link>
            <Link href="/comments/manage" className="flex-1 min-w-32 bg-gray-800/70 hover:bg-gray-700 rounded-lg p-4 transition-colors">
              <div className="flex items-center justify-center flex-col gap-2">
                <MessageSquare className="w-6 h-6" />
                <span className="font-medium text-sm">댓글 관리</span>
              </div>
            </Link>
          </div>

          {data.isLoading ? (
            <Loading />
          ) : data.error ? (
            <ErrorState />
          ) : (
            <>
              {/* 팔로우한 친구 섹션 */}
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">팔로우한 친구</h2>
                </div>

                {data.followedUsers.length === 0 ? (
                  <EmptyState message="아직 팔로우한 친구가 없습니다." />
                ) : (
                  <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide">
                    {data.followedUsers.map((friend) => (
                      <div key={friend.id} className="flex flex-col items-center gap-2 shrink-0">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500">
                            {friend.image ? (
                              <Image
                                src={friend.image}
                                alt={friend.name || '사용자'}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-indigo-800 flex items-center justify-center">
                                <span className="text-xl font-medium">{(friend.name || '?')[0]}</span>
                              </div>
                            )}
                          </div>
                          {friend.isOnline && (
                            <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-gray-900"></div>
                          )}
                        </div>
                        <span className="text-sm font-medium">{friend.name || '사용자'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* 최근 스토리 섹션 */}
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">팔로우한 친구의 이야기</h2>
                </div>

                {data.recentStories.length === 0 ? (
                  <EmptyState message="아직 친구의 이야기가 없습니다." />
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-1 md:justify-items-center">
                    {data.recentStories.map((story) => {
                      return (
                        <div key={story.clientId || story.id} className="w-full md:w-2/3 lg:w-1/2">
                          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-gray-800/70 transition-colors">
                            {/* 헤더 유지 */}
                            <div className="flex items-center justify-between p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center">
                                  {story.author.image ? (
                                    <Image
                                      src={story.author.image}
                                      alt={story.author.name || '작성자'}
                                      width={24}
                                      height={24}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-sm font-medium">{(story.author.name || '?')[0]}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="font-medium">{story.author.name || '익명'}</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* 이미지 컨테이너: 이미지 비율에 따라 다른 클래스 적용 */}
                            <ImageSlider 
                              images={story.image_urls} 
                              imageLayout={story.imageLayout || 'square'} 
                              title={story.title}
                            />
                            
                            {/* 스토리 내용 */}
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium line-clamp-1 flex-1">{story.title}</h3>
                              </div>
                              <p className="text-sm text-gray-300 line-clamp-2 mb-4">
                                {story.content}
                              </p>
                              <div className="flex items-center gap-4 text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Heart className="w-4 h-4" />
                                  <span className="text-sm">{story.likes}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-4 h-4" />
                                  <span className="text-sm">{story.commentCount}</span>
                                </div>
                                <div className="text-xs text-gray-400">{timeAgo(story.createdAt)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* 무한 스크롤을 위한 로딩 인디케이터 */}
                    <div ref={loadingRef} className="w-full flex justify-center py-4">
                      {isLoadingMore && <Loading />}
                      {!hasMoreStories && data.recentStories.length > 0 && (
                        <div className="text-gray-400 text-sm py-2">더 이상 스토리가 없습니다</div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
} 