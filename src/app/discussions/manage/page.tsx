'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import {
  ArrowRight,
  BookText,
  Users,
  Calendar,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Loading from '@/components/Loading';
import MobileHeader from '@/components/MobileHeader';
import HamburgerMenu from '@/components/HamburgerMenu';
import MyCreatedDiscussions from '@/components/MyCreatedDiscussions';

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
  myCreatedDiscussions: Discussion[];
  isLoading: boolean;
  error: string | null;
}

export default function DiscussionsManagePage() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [cancelDiscussionId, setCancelDiscussionId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [data, setData] = useState<DiscussionData>({
    myDiscussions: [],
    pendingRequests: [],
    myCreatedDiscussions: [],
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

  // 데이터가 로드된 후 디버깅 정보 출력
  useEffect(() => {
    if (!data.isLoading && data.myDiscussions.length > 0) {
      const approvedCount = data.myDiscussions.filter(d => hasStatus(d, 'APPROVED')).length;
      const pendingCount = data.myDiscussions.filter(d => hasStatus(d, 'PENDING')).length;

      // 개발 콘솔에서 확인용
      console.log({
        '승인된 토론 수': approvedCount,
        '대기 중인 토론 수': pendingCount,
        '모든 토론 데이터': data.myDiscussions
      });
    }
  }, [data]);

  const fetchDiscussionsData = async () => {
    try {
      const response = await fetch('/api/discussions/me');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '토론 데이터를 불러오는 중 오류가 발생했습니다.');
      }

      const responseData = await response.json();

      // 데이터 디버깅
      console.log('API 응답 데이터:', responseData);

      // 상태 값 체크 - status가 없는 경우 기본 상태를 APPROVED로 설정
      const processedMyDiscussions = responseData.myDiscussions.map((discussion: Discussion) => ({
        ...discussion,
        status: discussion.status || 'APPROVED'
      }));

      console.log('처리된 참여 중인 토론 데이터:', processedMyDiscussions);
      console.log('APPROVED 토론:', processedMyDiscussions.filter((d: Discussion) => d.status === 'APPROVED').length);
      console.log('PENDING 토론:', processedMyDiscussions.filter((d: Discussion) => d.status === 'PENDING').length);

      setData({
        myDiscussions: processedMyDiscussions,
        pendingRequests: responseData.pendingRequests || [],
        myCreatedDiscussions: responseData.myCreatedDiscussions || [],
        isLoading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '토론 데이터를 불러오는 중 오류가 발생했습니다.';
      setData(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast.error(errorMessage);
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
    } catch (error: unknown) {
      console.error('토론 참여 취소 중 오류:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : '참여 취소 중 오류가 발생했습니다.';
      toast.error(errorMessage);
    } finally {
      setIsCancelling(false);
      setCancelDiscussionId(null);
    }
  };

  // 토론 상태 확인 함수 (안전한 비교)
  const hasStatus = (discussion: Discussion, statusToCheck: string): boolean => {
    // status가 없으면 'APPROVED'로 간주하고, 대소문자 무시하고 비교
    const status = (discussion.status || 'APPROVED').toUpperCase();
    return status === statusToCheck.toUpperCase();
  };

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
    <div className="min-h-screen">
      {/* Mobile Header */}
      <MobileHeader isMenuOpen={isMenuOpen} onMenuToggle={setIsMenuOpen} />
      {/* Hamburger Menu */}
      <HamburgerMenu isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} />
      {/* Left Sidebar */}
      <Sidebar />

      <div className="min-h-screen flex flex-col items-center px-4 md:pl-64 pb-8 w-full">
        <div className="w-full max-w-6xl pt-20 md:pt-8">

          {/* Header */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                토론
              </span>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                관리
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-gray-400">내가 참여 중인 토론과 토론 참여 요청을 관리할 수 있습니다.</p>
            </div>
          </div>

          <div className="mx-auto space-y-10">
            {data.isLoading ? (
              <Loading />
            ) : data.error ? (
              <ErrorState />
            ) : (
              <>
                {/* 내가 작성한 토론 섹션 */}
                <MyCreatedDiscussions discussions={data.myCreatedDiscussions} />

                {/* 참여 중인 토론 섹션 */}
                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-400" />
                      <h2 className="text-xl font-semibold">참여 중인 토론</h2>
                    </div>
                    <Link href="/discussions" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                      더보기 <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {data.myDiscussions.length === 0 ? (
                    <EmptyState message="아직 참여 중인 토론이 없습니다." />
                  ) : (
                    <>
                      {/* 승인된 토론 */}
                      {data.myDiscussions.filter(d => hasStatus(d, 'APPROVED')).length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {data.myDiscussions
                            .filter(d => hasStatus(d, 'APPROVED'))
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

                                {/* 참여자 목록 표시 - 새로 추가 */}
                                {discussion.participants && discussion.participants.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-700">
                                    <h3 className="text-xs text-gray-400 mb-2">참여자</h3>
                                    <div className="flex flex-wrap gap-1">
                                      {discussion.participants.slice(0, 5).map(participant => (
                                        <div key={participant.id} className="w-6 h-6 rounded-full overflow-hidden" title={participant.user.name || '사용자'}>
                                          {participant.user.image ? (
                                            <Image
                                              src={participant.user.image}
                                              alt={participant.user.name || '사용자'}
                                              width={24}
                                              height={24}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full bg-indigo-800 flex items-center justify-center">
                                              <span className="text-xs font-medium">{(participant.user.name || '?')[0]}</span>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                      {discussion.participants.length > 5 && (
                                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                                          <span className="text-xs">+{discussion.participants.length - 5}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* 참여 취소 버튼 (토론 생성자가 아닐 경우에만 표시) */}
                                {discussion.author.id !== session?.user?.id && (
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
                      )}

                      {/* 승인된 토론 섹션에 아무것도 없을 경우 메시지 표시 */}
                      {data.myDiscussions.filter(d => hasStatus(d, 'APPROVED')).length === 0 && (
                        <div className="text-gray-400 text-center py-8">
                          <p>승인된 토론이 없습니다.</p>
                        </div>
                      )}

                      {/* 대기 중인 토론이 있을 경우에만 표시 */}
                      {data.myDiscussions.filter(d => hasStatus(d, 'PENDING')).length > 0 && (
                        <>
                          <div className="mt-8 mb-4">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-yellow-500" />
                              <h3 className="text-lg font-medium">승인 대기 중인 토론</h3>
                            </div>
                            <p className="text-sm text-gray-400 mt-1 ml-7">참여 승인을 기다리고 있는 토론입니다.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {data.myDiscussions
                              .filter(d => hasStatus(d, 'PENDING'))
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
    </div>
  );
} 