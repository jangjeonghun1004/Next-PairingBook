'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  ArrowRight, 
  BookText, 
  Users, 
  Calendar, 
  Check, 
  X, 
  Plus,
  Activity,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import SearchModal from '@/components/SearchModal';

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

interface DiscussionData {
  myDiscussions: Discussion[];
  pendingRequests: PendingRequest[];
  isLoading: boolean;
  error: string | null;
}

export default function DiscussionsManagePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [cancelDiscussionId, setCancelDiscussionId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [data, setData] = useState<DiscussionData>({
    myDiscussions: [],
    pendingRequests: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchDiscussionsData();
    }
  }, [status, router]);

  const fetchDiscussionsData = async () => {
    try {
      const response = await fetch('/api/discussions/me');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '토론 데이터를 불러오는 중 오류가 발생했습니다.');
      }
      
      const responseData = await response.json();
      
      setData({
        myDiscussions: responseData.myDiscussions || [],
        pendingRequests: responseData.pendingRequests || [],
        isLoading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '토론 데이터를 불러오는 중 오류가 발생했습니다.';
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

  // 참여 취소 함수 추가
  const handleCancelParticipation = async (discussionId: string) => {
    try {
      setIsCancelling(true);
      
      const response = await fetch('/api/discussions/participants/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ discussionId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '참여 취소 중 오류가 발생했습니다.');
      }
      
      // 성공적으로 처리된 경우 UI 업데이트
      setData(prev => ({
        ...prev,
        myDiscussions: prev.myDiscussions.filter(d => d.id !== discussionId)
      }));

      toast.success('토론 참여가 취소되었습니다.');
    } catch (error: any) {
      console.error('토론 참여 취소 중 오류:', error);
      toast.error(error.message || '참여 취소 중 오류가 발생했습니다.');
    } finally {
      setIsCancelling(false);
      setCancelDiscussionId(null);
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
          onClick={fetchDiscussionsData}
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
      <Sidebar onSearchClick={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <div className="md:pl-64 p-6">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/myhome"
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>마이홈으로 돌아가기</span>
              </Link>
            </div>
            <h1 className="text-2xl font-bold mb-2">토론 관리</h1>
            <p className="text-gray-400">내가 참여 중인 토론과 토론 참여 요청을 관리할 수 있습니다.</p>
          </div>

          {/* 새 토론 만들기 버튼 */}
          <div className="flex justify-end">
            <Link href="/discussions/create" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              <span>새 토론 만들기</span>
            </Link>
          </div>

          {data.isLoading ? (
            <LoadingState />
          ) : data.error ? (
            <ErrorState />
          ) : (
            <>
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
                        <div 
                          key={discussion.id} 
                          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 hover:bg-gray-800/70 transition-colors group"
                        >
                          <Link href={`/discussions/${discussion.id}`}>
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
                          
                          {/* 참여 취소 버튼 (토론 생성자가 아닐 경우에만 표시) */}
                          {discussion.author.id !== session?.user.id && (
                            <div className="mt-3 pt-3 border-t border-gray-700">
                              <button
                                onClick={() => setCancelDiscussionId(discussion.id)}
                                className="w-full px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>참여 취소</span>
                              </button>
                            </div>
                          )}
                        </div>
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
                                    className={`px-3 py-1 ${pendingActionId === participant.id ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'} rounded-lg text-sm transition-colors flex items-center gap-1`}
                                  >
                                    {pendingActionId === participant.id ? '처리 중...' : (
                                      <>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>승인</span>
                                      </>
                                    )}
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleParticipantAction(discussion.id, participant.id, 'rejected');
                                    }}
                                    disabled={pendingActionId === participant.id}
                                    className={`px-3 py-1 ${pendingActionId === participant.id ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'} rounded-lg text-sm transition-colors flex items-center gap-1`}
                                  >
                                    {pendingActionId === participant.id ? '처리 중...' : (
                                      <>
                                        <X className="w-3.5 h-3.5" />
                                        <span>거절</span>
                                      </>
                                    )}
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
            </>
          )}
        </div>
      </div>

      {/* 참여 취소 확인 모달 */}
      {cancelDiscussionId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-xl font-bold">토론 참여 취소</h3>
            </div>
            
            <p className="mb-6 text-gray-300">
              정말로 이 토론의 참여를 취소하시겠습니까? 취소 후에는 다시 참여 신청이 필요할 수 있습니다.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCancelDiscussionId(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                disabled={isCancelling}
              >
                취소
              </button>
              <button
                onClick={() => cancelDiscussionId && handleCancelParticipation(cancelDiscussionId)}
                disabled={isCancelling}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
              >
                {isCancelling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>처리 중...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>참여 취소</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 