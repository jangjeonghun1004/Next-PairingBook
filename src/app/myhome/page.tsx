'use client';
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import HamburgerMenu from "@/components/HamburgerMenu";
import SearchModal from "@/components/SearchModal";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/Sidebar";
import StoryCard from "@/components/StoryCard";
import { toast } from "react-hot-toast";
import { BookOpen, Calendar, Users, Clock, ArrowRight, BookText, HomeIcon, Activity, BookOpenCheck, Settings, Edit, MessageSquare } from "lucide-react";

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
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

  const fetchHomeData = async () => {
    try {
      const response = await fetch('/api/myhome');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '데이터를 불러오는 중 오류가 발생했습니다.');
      }
      
      const responseData = await response.json();
      
      setData({
        followedUsers: responseData.followedUsers,
        recentStories: responseData.recentStories,
        myDiscussions: responseData.myDiscussions,
        pendingRequests: responseData.pendingRequests,
        myStories: responseData.myStories,
        likedStories: responseData.likedStories,
        isLoading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '데이터를 불러오는 중 오류가 발생했습니다.';
      setData(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast.error(errorMessage);
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 시간 경과 계산 함수
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval}년 전`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}개월 전`;
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}일 전`;
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}시간 전`;
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}분 전`;
    
    return `${Math.floor(seconds)}초 전`;
  };

  // 참여 신청자 승인/거절 처리 함수
  const handleParticipantAction = async (
    discussionId: string,
    participantId: string,
    action: 'approved' | 'rejected'
  ) => {
    try {
      setPendingActionId(participantId);
      
      const response = await fetch(
        `/api/discussions/${discussionId}/participants/${participantId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: action }),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '처리 중 오류가 발생했습니다.');
      }
      
      // 성공적으로 처리된 경우 UI 업데이트
      setData(prev => {
        const updatedPendingRequests = prev.pendingRequests.map(discussion => {
          if (discussion.id === discussionId) {
            return {
              ...discussion,
              pendingParticipants: discussion.pendingParticipants.filter(p => p.id !== participantId)
            };
          }
          return discussion;
        }).filter(discussion => discussion.pendingParticipants.length > 0);

        return {
          ...prev,
          pendingRequests: updatedPendingRequests
        };
      });

      toast.success(
        action === 'approved'
          ? '참여 요청이 승인되었습니다.'
          : '참여 요청이 거절되었습니다.'
      );
    } catch (error: any) {
      console.error('참여 요청 처리 중 오류:', error);
      toast.error(error.message || '처리 중 오류가 발생했습니다.');
    } finally {
      setPendingActionId(null);
    }
  };

  const LoadingState = () => (
    <div className="w-full py-10 flex justify-center">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
      </div>
    </div>
  );

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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 모바일 헤더 */}
      <MobileHeader isMenuOpen={isMenuOpen} onMenuToggle={setIsMenuOpen} />

      {/* 햄버거 메뉴 */}
      <HamburgerMenu isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} />

      {/* 좌측 사이드바 */}
      <Sidebar onSearchClick={() => setIsSearchOpen(true)} />

      {/* 검색 모달 */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

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
            <LoadingState />
          ) : data.error ? (
            <ErrorState />
          ) : (
            <>
              {/* 팔로우한 친구 섹션 */}
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">팔로우한 친구</h2>
                  <Link href="/users" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    더보기 <ArrowRight className="w-3 h-3" />
                  </Link>
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
                  <Link href="/stories" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    더보기 <ArrowRight className="w-3 h-3" />
                  </Link>
          </div>

                {data.recentStories.length === 0 ? (
                  <EmptyState message="아직 친구의 이야기가 없습니다." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.recentStories.slice(0, 4).map((story) => (
                      <div key={story.id} className="w-full">
                <StoryCard
                          id={story.id}
                          author={story.author.name || '익명'}
                          authorId={story.author.id}
                          timeAgo={timeAgo(story.createdAt)}
                  title={story.title}
                  content={story.content}
                  likes={story.likes}
                          comments={story.commentCount}
                  category={story.category}
                          images={story.image_urls}
                          hideFollowButton={false}
                />
              </div>
            ))}
          </div>
                )}
              </section>

              {/* 참여 중인 토론 섹션 */}
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">참여 중인 토론</h2>
                  <Link href="/discussions" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    더보기 <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                
                {data.myDiscussions.length === 0 ? (
                  <EmptyState message="아직 참여 중인 토론이 없습니다." />
                ) : (
                  <>
                    {/* 승인된 토론 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.myDiscussions
                        .filter(d => d.status === 'approved')
                        .map((discussion) => (
                        <Link 
                          key={discussion.id} 
                          href={`/discussions/${discussion.id}`}
                          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 hover:bg-gray-800/70 transition-colors"
                        >
                          <div className="aspect-video mb-3 relative rounded-lg overflow-hidden">
                            <Image 
                              src={discussion.imageUrls[0] || '/images/default-book.jpg'} 
                              alt={discussion.title}
                              width={300}
                              height={169}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                            <div className="absolute bottom-2 left-2 flex gap-2">
                              <div className="text-sm font-medium bg-indigo-500/80 px-2 py-1 rounded-full">
                                {discussion.privacy === 'public' ? '공개' : '비공개'}
                              </div>
                            </div>
                          </div>
                          
                          <h3 className="font-medium line-clamp-1 mb-1">{discussion.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                            <BookText className="w-4 h-4" />
                            <span className="line-clamp-1">{discussion.bookTitle}</span>
          </div>

                          <div className="flex justify-between text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{discussion.participantCount}명 참여 중</span>
          </div>

                            {discussion.scheduledAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(discussion.scheduledAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* 대기 중인 토론이 있을 경우에만 표시 */}
                    {data.myDiscussions.some(d => d.status === 'pending') && (
                      <>
                        <div className="mt-8 mb-4">
                          <h3 className="text-lg font-medium">승인 대기 중인 토론</h3>
                          <p className="text-sm text-gray-400">참여 승인을 기다리고 있는 토론입니다.</p>
          </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {data.myDiscussions
                            .filter(d => d.status === 'pending')
                            .map((discussion) => (
                            <Link 
                              key={discussion.id} 
                              href={`/discussions/${discussion.id}`}
                              className="bg-gray-800/50 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-4 hover:bg-gray-800/70 transition-colors"
                            >
                              <div className="aspect-video mb-3 relative rounded-lg overflow-hidden">
                                <div className="absolute inset-0 bg-black/20 z-10"></div>
                                <Image 
                                  src={discussion.imageUrls[0] || '/images/default-book.jpg'} 
                                  alt={discussion.title}
                                  width={300}
                                  height={169}
                                  className="w-full h-full object-cover blur-[1px]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                                <div className="absolute bottom-2 left-2 z-20">
                                  <div className="text-sm font-medium bg-yellow-500/80 px-2 py-1 rounded-full">
                                    승인 대기 중
                                  </div>
                                </div>
          </div>

                              <h3 className="font-medium line-clamp-1 mb-1">{discussion.title}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                <BookText className="w-4 h-4" />
                                <span className="line-clamp-1">{discussion.bookTitle}</span>
          </div>

                              <div className="text-xs text-yellow-400/80">
                                참여 승인을 기다리고 있습니다
                              </div>
                            </Link>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </section>

              {/* 참여 신청자 관리 섹션 */}
              {data.pendingRequests.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">참여 신청자 관리</h2>
                      <p className="text-sm text-gray-400">내가 만든 토론에 참여를 원하는 사용자들입니다.</p>
                    </div>
                    <div className="bg-red-500/20 px-3 py-1 rounded-full">
                      <span className="text-sm font-medium text-red-400">처리 필요: {data.pendingRequests.reduce((total, discussion) => total + discussion.pendingParticipants.length, 0)}건</span>
                    </div>
          </div>

                  <div className="space-y-6">
                    {data.pendingRequests.map((discussion) => (
                      <div key={discussion.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-red-500/20">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                            <Image 
                              src={discussion.imageUrls[0] || '/images/default-book.jpg'} 
                              alt={discussion.title}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium mb-1 line-clamp-1">{discussion.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <BookText className="w-4 h-4" />
                              <span className="line-clamp-1">{discussion.bookTitle}</span>
                            </div>
                          </div>
                          <Link 
                            href={`/discussions/${discussion.id}/manage`} 
                            className="shrink-0 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg text-sm transition-colors"
                          >
                            참여자 관리
                          </Link>
          </div>

                        <div className="border-t border-gray-700 pt-4">
                          <h4 className="text-sm font-medium mb-3">대기 중인 참여 신청자 ({discussion.pendingParticipants.length}명)</h4>
                          <div className="space-y-3">
                            {discussion.pendingParticipants.map((participant) => (
                              <div key={participant.id} className="flex items-center justify-between bg-gray-800/50 p-2 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full overflow-hidden">
                                    {participant.image ? (
                                      <Image 
                                        src={participant.image} 
                                        alt={participant.name || '사용자'} 
                                        width={40} 
                                        height={40}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-indigo-800 flex items-center justify-center">
                                        <span className="text-sm font-medium">{(participant.name || '?')[0]}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-medium">{participant.name || '익명 사용자'}</div>
                                    <div className="text-xs text-gray-400">{timeAgo(participant.requestDate)}</div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleParticipantAction(discussion.id, participant.id, 'approved');
                                    }}
                                    disabled={pendingActionId === participant.id}
                                    className={`px-3 py-1 ${pendingActionId === participant.id ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'} rounded-lg text-sm transition-colors`}
                                  >
                                    {pendingActionId === participant.id ? '처리 중...' : '승인'}
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleParticipantAction(discussion.id, participant.id, 'rejected');
                                    }}
                                    disabled={pendingActionId === participant.id}
                                    className={`px-3 py-1 ${pendingActionId === participant.id ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'} rounded-lg text-sm transition-colors`}
                                  >
                                    {pendingActionId === participant.id ? '처리 중...' : '거절'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 내가 작성한 스토리 섹션 */}
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">내가 작성한 이야기</h2>
                  <Link href="/stories/new" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    새 이야기 작성 <ArrowRight className="w-3 h-3" />
                  </Link>
          </div>

                {data.myStories.length === 0 ? (
                  <EmptyState message="아직 작성한 이야기가 없습니다." />
                ) : (
                  <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide">
                    {data.myStories.map((story) => (
                      <Link
                        key={story.id}
                        href={`/stories/${story.id}`}
                        className="min-w-[250px] max-w-[250px] bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 hover:bg-gray-800/70 transition-colors"
                      >
                        <div className="aspect-square mb-3 rounded-lg overflow-hidden">
                          <Image 
                            src={story.image_urls[0] || '/images/default-story.jpg'} 
                            alt={story.title}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-medium line-clamp-1 mb-1">{story.title}</h3>
                        <div className="flex justify-between text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            <span>{story.category}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{timeAgo(story.createdAt)}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
              </div>
            )}
              </section>

              {/* 좋아요한 스토리 섹션 */}
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">좋아요한 이야기</h2>
                </div>
                
                {data.likedStories.length === 0 ? (
                  <EmptyState message="아직 좋아요한 이야기가 없습니다." />
                ) : (
                  <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide">
                    {data.likedStories.map((story) => (
                      <Link
                        key={story.id}
                        href={`/stories/${story.id}`}
                        className="min-w-[250px] max-w-[250px] bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 hover:bg-gray-800/70 transition-colors"
                      >
                        <div className="aspect-square mb-3 rounded-lg overflow-hidden">
                          <Image 
                            src={story.image_urls[0] || '/images/default-story.jpg'} 
                            alt={story.title}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-medium line-clamp-1 mb-1">{story.title}</h3>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-indigo-500/20">
                              {story.author.image ? (
                                <Image 
                                  src={story.author.image} 
                                  alt={story.author.name || '작성자'} 
                                  width={24} 
                                  height={24}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-xs">{(story.author.name || '?')[0]}</span>
              </div>
            )}
          </div>
                            <span className="text-sm text-gray-300">{story.author.name || '익명'}</span>
                          </div>
                          <div className="text-xs text-gray-400">{timeAgo(story.createdAt)}</div>
                        </div>
                      </Link>
                    ))}
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