'use client';
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import HamburgerMenu from "@/components/HamburgerMenu";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/Sidebar";
import { toast } from "react-hot-toast";
import { Heart, MessageCircle, Send } from "lucide-react";
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

// interface Discussion {
//   id: string;
//   title: string;
//   bookTitle: string;
//   bookAuthor: string;
//   imageUrls: string[];
//   scheduledAt: string | null;
//   privacy: string;
//   createdAt: string;
//   author: {
//     id: string;
//     name: string;
//     image: string;
//   };
//   participants: Array<{
//     id: string;
//     user: {
//       id: string;
//       name: string;
//       image: string;
//     };
//   }>;
//   participantCount: number;
//   status?: string; // 참여 상태 추가 (approved, pending)
// }

// interface PendingRequest {
//   id: string;
//   title: string;
//   bookTitle: string;
//   bookAuthor: string;
//   createdAt: string;
//   imageUrls: string[];
//   pendingParticipants: Array<{
//     id: string;
//     userId: string;
//     name: string;
//     image: string;
//     requestDate: string;
//   }>;
// }

interface HomeData {
  followedUsers: User[];
  recentStories: Story[];
  // myDiscussions: Discussion[];
  // pendingRequests: PendingRequest[];
  // myStories: Story[];
  // likedStories: Story[];
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
    // myDiscussions: [],
    // pendingRequests: [],
    // myStories: [],
    // likedStories: [],
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
        // myDiscussions: responseData.myDiscussions,
        // pendingRequests: responseData.pendingRequests,
        // myStories: responseData.myStories,
        // likedStories: responseData.likedStories,
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

      {/* 메인 콘텐츠 - 인스타그램 스타일로 변경 */}
      <main className="md:pl-64 min-h-screen">
        <div className="max-w-5xl mx-auto pt-20 md:pt-8">
          {/* 인스타그램 상단 네비게이션 영역 */}
          <div className="flex flex-col border-b border-gray-800">
            {/* 로고 및 프로필 영역 */} {/* 프로필 아이콘 */}
            {/* <div className="flex justify-between items-center py-4 px-6">
              <div className="flex-1">
                <h1 className="text-2xl font-bold">페어링 BOOK</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || '사용자'}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {session?.user?.name ? session.user.name[0] : '?'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div> */}

            {/* 팔로우한 친구 섹션 - 인스타그램 스토리 섹션 스타일 */}
            <div className="py-4 px-6 overflow-x-auto">
              <div className="flex gap-4 items-center">
                {/* 팔로우한 친구 목록 */}
                {data.followedUsers.map((friend) => (
                  <div key={friend.id} className="flex flex-col items-center gap-1 shrink-0">
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
                    <span className="text-xs">{friend.name || '사용자'}</span>
                  </div>
                ))}

                {data.followedUsers.length === 0 && (
                  <div className="text-gray-400 text-sm">
                    팔로우한 친구가 없습니다
                  </div>
                )}
              </div>
            </div>
          </div>

          {data.isLoading ? (
            <div className="flex justify-center py-10">
              <Loading />
            </div>
          ) : data.error ? (
            <ErrorState />
          ) : (
            <div className="flex">
              {/* 메인 피드 영역 */}
              <div className="flex-1 pt-5">
                {/* 최근 스토리 섹션 */}
                <section>
                  {data.recentStories.length === 0 ? (
                    <div className="flex justify-center py-10">
                      <EmptyState message="아직 친구의 이야기가 없습니다." />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-1 max-w-3xl mx-auto md:justify-items-center">
                      {data.recentStories.map((story) => {
                        return (
                          <div
                            key={story.clientId || story.id}
                            className="w-full bg-gray-800/30 overflow-hidden border border-gray-700/50 md:w-3/5"
                          >
                            {/* 헤더 - 인스타그램 스타일 */}
                            <div className="flex items-center p-3 border-b border-gray-700/50">
                              <div className="w-10 h-10 rounded-full overflow-hidden">
                                {story.author.image ? (
                                  <Image
                                    src={story.author.image}
                                    alt={story.author.name || '작성자'}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                                    <span className="text-sm font-medium text-white">{(story.author.name || '?')[0]}</span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-3 flex-1">
                                <div className="font-medium text-sm">{story.author.name || '익명'}</div>
                                <div className="text-xs text-gray-400">{timeAgo(story.createdAt)}</div>
                              </div>
                              <button className="text-gray-400 hover:text-white p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="19" cy="12" r="1" />
                                  <circle cx="5" cy="12" r="1" />
                                </svg>
                              </button>
                            </div>

                            {/* 이미지 슬라이더 - 이미지 크기 증가 */}
                            <div className="w-full h-auto">
                              <ImageSlider images={story.image_urls} imageLayout={story.imageLayout || 'square'} title={story.title} />
                            </div>

                            {/* 액션 버튼 영역 - 인스타그램 스타일 */}
                            <div className="px-4 pt-2 pb-1 flex items-center gap-4">
                              <button className="p-1 hover:text-red-500 transition-colors">
                                <Heart className="w-6 h-6" />
                              </button>
                              <button className="p-1 hover:text-blue-500 transition-colors">
                                <MessageCircle className="w-6 h-6" />
                              </button>
                              <div className="ml-auto">
                                <button className="p-1 hover:text-yellow-500 transition-colors">
                                <Send className="w-6 h-6" />
                                </button>
                              </div>
                            </div>

                            {/* 좋아요 카운트 */}
                            <div className="px-4 py-1">
                              <p className="text-sm font-medium">좋아요 {story.likes}개</p>
                            </div>

                            {/* 스토리 내용 */}
                            <div className="px-4 pb-3">
                              <div className="flex items-baseline gap-2">
                                <p className="text-sm text-gray-300 line-clamp-2">{story.content}</p>
                              </div>

                              {/* 댓글 버튼 */}
                              {story.commentCount > 0 && (
                                <button className="text-xs text-gray-400 mt-1 hover:text-gray-300">
                                  댓글 {story.commentCount}개 모두 보기
                                </button>
                              )}
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
              </div>

              {/* 우측 사이드바 영역 (데스크톱에서만 표시) */}
              <div className="hidden lg:block w-80 pl-8 py-6">
                {/* 사용자 프로필 */}
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 rounded-full overflow-hidden mr-4">
                    {session?.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || '사용자'}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <span className="text-xl font-medium">
                          {session?.user?.name ? session.user.name[0] : '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{session?.user?.name}</div>
                    <div className="text-sm text-gray-400">{session?.user?.email}</div>
                  </div>
                </div>

                {/* 페어링북 정보 */}
                <div className="mt-8">
                  <p className="text-xs text-gray-500 mb-2">© 2025 페어링 BOOK</p>
                  <div className="text-xs text-gray-500 space-x-1">
                    <a href="#" className="hover:underline">소개</a>
                    <span>·</span>
                    <a href="#" className="hover:underline">도움말</a>
                    <span>·</span>
                    <a href="#" className="hover:underline">개인정보처리방침</a>
                    <span>·</span>
                    <a href="#" className="hover:underline">약관</a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 