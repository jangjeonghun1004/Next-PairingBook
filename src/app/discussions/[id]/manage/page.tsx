'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, User, User2, Check, Clock, Ban, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';

// 참여자 상태 타입
type ParticipantStatus = 'pending' | 'approved' | 'rejected';

// 참여자 타입
interface Participant {
  id: string;
  userId: string;
  name: string;
  image: string | null;
  status: ParticipantStatus;
  createdAt: string;
}

// 토론 타입
interface Discussion {
  id: string;
  title: string;
  bookTitle: string;
  bookAuthor: string;
  imageUrls: string[];
  authorId: string;
  participants: Participant[];
  isLoading: boolean;
  error: string | null;
}

export default function DiscussionManagePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [discussion, setDiscussion] = useState<Discussion>({
    id: '',
    title: '',
    bookTitle: '',
    bookAuthor: '',
    imageUrls: [],
    authorId: '',
    participants: [],
    isLoading: true,
    error: null
  });
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // 토론 정보 가져오기
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && params.id) {
      fetchDiscussion();
    }
  }, [status, params.id, router]);

  const fetchDiscussion = async () => {
    try {
      const response = await fetch(`/api/discussions/${params.id}?includeParticipants=true`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '토론 정보를 불러오는 중 오류가 발생했습니다.');
      }
      
      const data = await response.json();
      
      // 토론 생성자가 아니면 접근 거부
      if (data.authorId !== session?.user?.id) {
        router.push(`/discussions/${params.id}`);
        toast.error('토론 생성자만 관리 페이지에 접근할 수 있습니다.');
        return;
      }
      
      setDiscussion({
        ...data,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setDiscussion(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || '토론 정보를 불러오는 중 오류가 발생했습니다.'
      }));
      toast.error(error.message || '토론 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 참여자 상태 변경 함수
  const handleStatusChange = async (participantId: string, newStatus: ParticipantStatus) => {
    try {
      setPendingActionId(participantId);
      setDropdownOpen(null);
      
      const response = await fetch(
        `/api/discussions/${params.id}/participants/${participantId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '처리 중 오류가 발생했습니다.');
      }
      
      // 성공적으로 처리된 경우 UI 업데이트
      setDiscussion(prev => ({
        ...prev,
        participants: prev.participants.map(participant => {
          if (participant.id === participantId) {
            return {
              ...participant,
              status: newStatus
            };
          }
          return participant;
        })
      }));
      
      const statusMessages = {
        approved: '참여자를 승인했습니다.',
        pending: '참여자를 대기 상태로 변경했습니다.',
        rejected: '참여자를 거절했습니다.'
      };
      
      toast.success(statusMessages[newStatus]);
    } catch (error: any) {
      console.error('참여자 상태 변경 중 오류:', error);
      toast.error(error.message || '처리 중 오류가 발생했습니다.');
    } finally {
      setPendingActionId(null);
    }
  };
  
  // 시간 경과 표시 함수
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

  // 상태별 참여자 필터링
  const pendingParticipants = discussion.participants.filter(p => p.status === 'pending');
  const approvedParticipants = discussion.participants.filter(p => p.status === 'approved');
  const rejectedParticipants = discussion.participants.filter(p => p.status === 'rejected');
  
  if (discussion.isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto py-10 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
          </div>
        </div>
      </div>
    );
  }

  if (discussion.error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto py-10">
          <div className="text-red-400 text-center">
            <p>{discussion.error}</p>
            <button
              onClick={fetchDiscussion}
              className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link 
            href={`/discussions/${discussion.id}`}
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> 토론으로 돌아가기
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden">
              <Image 
                src={discussion.imageUrls[0] || '/images/default-book.jpg'} 
                alt={discussion.title}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">{discussion.title} 관리</h1>
              <p className="text-gray-400">
                참여자 상태를 관리하고 토론을 운영하세요.
              </p>
            </div>
          </div>
        </div>
        
        {/* 참여자 관리 섹션 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">참여자 관리</h2>
          
          {/* 대기 중인 참여 신청자 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              대기 중인 참여 신청자 ({pendingParticipants.length}명)
            </h3>
            
            {pendingParticipants.length === 0 ? (
              <p className="text-gray-400 text-sm">대기 중인 참여 신청자가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {pendingParticipants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between bg-gray-800/70 p-3 rounded-lg">
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
                            <User2 className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{participant.name || '익명 사용자'}</div>
                        <div className="text-xs text-gray-400">신청일: {timeAgo(participant.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleStatusChange(participant.id, 'approved')}
                        disabled={pendingActionId === participant.id}
                        className={`px-3 py-1.5 ${pendingActionId === participant.id ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'} rounded-lg text-sm transition-colors flex items-center gap-1`}
                      >
                        <Check className="w-4 h-4" />
                        {pendingActionId === participant.id ? '처리 중...' : '승인'}
                      </button>
                      <button 
                        onClick={() => handleStatusChange(participant.id, 'rejected')}
                        disabled={pendingActionId === participant.id}
                        className={`px-3 py-1.5 ${pendingActionId === participant.id ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'} rounded-lg text-sm transition-colors flex items-center gap-1`}
                      >
                        <Ban className="w-4 h-4" />
                        {pendingActionId === participant.id ? '처리 중...' : '거절'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 승인된 참여자 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              승인된 참여자 ({approvedParticipants.length}명)
            </h3>
            
            {approvedParticipants.length === 0 ? (
              <p className="text-gray-400 text-sm">승인된 참여자가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {approvedParticipants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between bg-gray-800/70 p-3 rounded-lg">
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
                            <User2 className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{participant.name || '익명 사용자'}</div>
                        <div className="text-xs text-gray-400">승인일: {timeAgo(participant.createdAt)}</div>
                      </div>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setDropdownOpen(dropdownOpen === participant.id ? null : participant.id)}
                        className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      
                      {dropdownOpen === participant.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 z-10">
                          <button
                            onClick={() => handleStatusChange(participant.id, 'pending')}
                            disabled={pendingActionId === participant.id}
                            className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                          >
                            <Clock className="w-4 h-4" />
                            대기 상태로 변경
                          </button>
                          <button
                            onClick={() => handleStatusChange(participant.id, 'rejected')}
                            disabled={pendingActionId === participant.id}
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                          >
                            <Ban className="w-4 h-4" />
                            참여 거절하기
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 거절된 참여자 */}
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-500" />
              거절된 참여자 ({rejectedParticipants.length}명)
            </h3>
            
            {rejectedParticipants.length === 0 ? (
              <p className="text-gray-400 text-sm">거절된 참여자가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {rejectedParticipants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between bg-gray-800/70 p-3 rounded-lg">
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
                            <User2 className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{participant.name || '익명 사용자'}</div>
                        <div className="text-xs text-gray-400">거절일: {timeAgo(participant.createdAt)}</div>
                      </div>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setDropdownOpen(dropdownOpen === participant.id ? null : participant.id)}
                        className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      
                      {dropdownOpen === participant.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 z-10">
                          <button
                            onClick={() => handleStatusChange(participant.id, 'approved')}
                            disabled={pendingActionId === participant.id}
                            className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            승인하기
                          </button>
                          <button
                            onClick={() => handleStatusChange(participant.id, 'pending')}
                            disabled={pendingActionId === participant.id}
                            className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                          >
                            <Clock className="w-4 h-4" />
                            대기 상태로 변경
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* 하단 버튼 */}
        <div className="flex justify-between">
          <Link
            href={`/discussions/${discussion.id}`}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
          >
            토론으로 돌아가기
          </Link>
          
          <Link
            href="/myhome"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            마이홈으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
} 