'use client';

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Heart,
    Calendar,
    Users,
    Lock,
    Globe,
    MessageSquare,
    Share2,
    Clock,
    MapPin,
    Info,
    Eye,
} from "lucide-react";
import TopicModal from "@/components/TopicModal";
// import dynamic from "next/dynamic";
import Loading from "@/components/Loading";
import { useSession } from "next-auth/react";

// KakaoMap 컴포넌트를 dynamic import로 로드 (클라이언트 사이드에서만 렌더링)
// const MapComponent = dynamic(() => import('@/components/MapComponent'), {
//     ssr: false,
//     loading: () => <div className="w-full h-[300px] bg-gray-800 animate-pulse rounded-xl flex items-center justify-center">지도 로딩 중...</div>
// });

// 토론 인터페이스 (Prisma 모델에 맞춤)
interface Discussion {
    id: string;
    title: string;
    content: string;
    bookTitle: string;
    bookAuthor: string;
    tags: string[];
    topics: string[];
    imageUrls: string[];
    scheduledAt: Date | null;
    maxParticipants: number | null;
    privacy: string;
    createdAt: Date;
    updatedAt: Date;
    authorId: string;
    author: {
        id: string;
        name: string | null;
        image: string | null;
    };
    location?: {
        address: string | '인천 주부토로 81번길 23';
        lat: number;
        lng: number;
    } | null;
}

export default function DiscussionDetailPage() {
    const params = useParams();
    // const router = useRouter();
    const [discussion, setDiscussion] = useState<Discussion | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [participationStatus, setParticipationStatus] = useState<string | null>(null);
    const [participantsCount, setParticipantsCount] = useState<number>(0);
    const [isJoinLoading, setIsJoinLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'topics'>('info');
    const { data: session } = useSession();

    // 데이터 로드
    const fetchDiscussion = useCallback(async () => {
        setIsLoading(true);
        try {
            // API에서 토론 데이터 가져오기
            const response = await fetch(`/api/discussions/${params.id}`);

            if (!response.ok) {
                throw new Error('토론을 불러오는데 실패했습니다');
            }

            const data = await response.json();
            setDiscussion(data);

            // 참가 상태 확인
            await checkParticipationStatus();
        } catch (error) {
            console.error("토론을 불러오는 중 오류가 발생했습니다:", error);
        } finally {
            setIsLoading(false);
        }
    }, [params.id]);

    // 참가 상태 확인
    const checkParticipationStatus = useCallback(async () => {
        try {
            const response = await fetch(`/api/discussions/${params.id}/participants`);

            if (!response.ok) {
                if (response.status !== 401) { // 401은 로그인 필요로 무시
                    console.error('참가 상태 확인 실패');
                }
                return;
            }

            const data = await response.json();
            setParticipantsCount(data.participantsCount || 0);

            if (data.participation) {
                setParticipationStatus(data.participation.status);
            } else {
                setParticipationStatus(null);
            }
        } catch (error) {
            console.error('참가 상태 확인 중 오류:', error);
        }
    }, [params.id]);

    // 토론 정보 로드 및 참가 상태 확인
    useEffect(() => {
        if (params.id) {
            fetchDiscussion();
            if (session) {
                checkParticipationStatus();
            }
        }
    }, [params.id, fetchDiscussion, session, checkParticipationStatus]);

    // 좋아요 토글 함수
    const toggleLike = () => {
        setIsLiked(!isLiked);
        setToastMessage(isLiked ? "좋아요가 취소되었습니다." : "좋아요를 눌렀습니다.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // 공유 함수
    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setToastMessage("링크가 클립보드에 복사되었습니다.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // 날짜 포맷 함수
    const formatDate = (date: Date | null | string) => {
        if (!date) return "날짜 미정";
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 참가 신청 함수
    const handleJoinRequest = async () => {
        if (isJoinLoading) return;

        try {
            setIsJoinLoading(true);

            const response = await fetch(`/api/discussions/${params.id}/participants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    // 이미 참가 중인 경우
                    setToastMessage(`이미 참가 신청한 토론입니다. (상태: ${data.status === 'approved' ? '승인됨' : '대기 중'})`);
                } else {
                    setToastMessage(data.error || '참가 신청 중 오류가 발생했습니다.');
                }
            } else {
                setToastMessage(data.status === 'approved' ? '토론 참가가 승인되었습니다.' : '토론 참가 신청이 완료되었습니다.');
                setParticipationStatus(data.status);

                // 참가자 수 업데이트
                if (data.status === 'approved') {
                    setParticipantsCount(prev => prev + 1);
                }
            }

            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (error) {
            console.error('참가 신청 중 오류:', error);
            setToastMessage('참가 신청 중 오류가 발생했습니다.');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } finally {
            setIsJoinLoading(false);
        }
    };

    // 참가 버튼 텍스트와 스타일
    const getParticipationButtonText = (): string => {
        switch (participationStatus) {
            case 'approved':
                return '참가 승인됨';
            case 'pending':
                return '승인 대기 중';
            case 'rejected':
                return '참가 거절됨';
            default:
                return '토론 참가 신청';
        }
    };

    const getParticipationButtonStyle = (): string => {
        switch (participationStatus) {
            case 'approved':
                return 'bg-green-600 hover:bg-green-700';
            case 'pending':
                return 'bg-yellow-600 hover:bg-yellow-700';
            case 'rejected':
                return 'bg-red-600 hover:bg-red-700';
            default:
                return 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700';
        }
    };

    // 프라이버시 타입 아이콘 및 텍스트
    const renderPrivacyInfo = (privacy: string) => {
        switch (privacy) {
            case 'public':
                return {
                    icon: <Globe className="w-5 h-5 text-green-400" />,
                    text: "공개 토론",
                    description: "누구나 참여할 수 있는 공개 토론입니다."
                };
            case 'private':
                return {
                    icon: <Lock className="w-5 h-5 text-yellow-400" />,
                    text: "비공개 토론",
                    description: "초대된 사용자만 참여할 수 있는 비공개 토론입니다."
                };
            case 'invitation':
                return {
                    icon: <Users className="w-5 h-5 text-blue-400" />,
                    text: "초대 토론",
                    description: "승인된 사용자만 참여할 수 있는 초대 토론입니다."
                };
            default:
                return {
                    icon: <Globe className="w-5 h-5 text-gray-400" />,
                    text: "정보 없음",
                    description: "토론 정보가 제공되지 않았습니다."
                };
        }
    };

    // 남은 시간 계산
    const getRemainingTimeText = (date: Date | null | string) => {
        if (!date) return "날짜 미정";

        const scheduledDate = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();

        // 과거 날짜면 "종료됨" 표시
        if (scheduledDate < now) {
            return "토론 종료됨";
        }

        const diff = scheduledDate.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            return `${days}일 ${hours}시간 남음`;
        } else if (hours > 0) {
            return `${hours}시간 ${minutes}분 남음`;
        } else {
            return `${minutes}분 남음`;
        }
    };

    const privacyInfo = discussion ? renderPrivacyInfo(discussion.privacy) : renderPrivacyInfo('');

    // 토론 주제 모달 열기
    const openTopicModal = () => {
        setIsTopicModalOpen(true);
        // 기록에 상태 추가하여 뒤로가기 처리 가능하게 함
        window.history.pushState({ topicModalOpen: true }, '');
    };

    // 모달 닫기 함수
    const closeTopicModal = () => {
        setIsTopicModalOpen(false);
        // 모달이 닫힐 때 body 스타일 초기화
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';

        // 스크롤 위치 복원
        const scrollY = parseInt(document.body.style.top || '0', 10) * -1;
        window.scrollTo(0, scrollY);
    };

    // 주제 탭을 클릭했을 때 처리
    const handleTopicsTabClick = () => {
        // 토픽이 있으면 모달 열기, 없으면 탭만 활성화
        if (discussion?.topics && discussion.topics.length > 0) {
            openTopicModal();
        } else {
            setActiveTab('topics');
        }
    };

    // 뒤로가기 시 모달 닫기 처리
    useEffect(() => {
        const handlePopState = () => {
            if (isTopicModalOpen) {
                closeTopicModal();
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isTopicModalOpen]);

    // 만약 isTopicModalOpen이 true인 상태에서 렌더링된다면
    if (isTopicModalOpen && discussion?.topics) {
        return (
            <TopicModal
                isOpen={isTopicModalOpen}
                onClose={closeTopicModal}
                topics={discussion.topics}
            />
        );
    }

    return (
        <div className="min-h-screen overflow-x-hidden">
            {/* 토스트 알림 */}
            {showToast && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 bg-opacity-90 text-white px-4 py-2 rounded-lg shadow-lg">
                    {toastMessage}
                </div>
            )}

            {/* 메인 콘텐츠 */}
            <div className="min-h-screen flex flex-col items-center px-4 pb-8 w-full">
                <div className="w-full max-w-4xl pt-12 md:pt-8">
                    {/* 헤더 */}
                    <div className="flex items-center justify-between mb-6 sticky top-0 z-10 bg-gradient-to-r from-gray-900/95 to-gray-900/95 backdrop-blur-md py-3 sm:py-4 rounded-xl px-3 sm:px-4">
                        <Link
                            href="/discussions"
                            className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-800/70 transition-all duration-200 transform hover:scale-105"
                        >
                            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Link>
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500 absolute left-1/2 transform -translate-x-1/2">토론 상세</h1>
                        <div className="w-[36px] h-[36px] sm:w-[72px]"></div> {/* 좌우 균형을 맞추기 위한 더미 div */}

                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center p-1.5 sm:p-2 rounded-lg hover:bg-gray-800/70 transition-all duration-200 transform hover:scale-105"
                            aria-label="공유하기"
                        >
                            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>

                    </div>

                    {isLoading ? (<Loading />) : discussion ? (
                        <div className="space-y-6 sm:space-y-8 mt-4 sm:mt-6">
                            {/* 탭 네비게이션 */}
                            <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
                                <div className="flex border-b border-gray-700">
                                    <button
                                        onClick={() => setActiveTab('info')}
                                        className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'info' ? 'text-indigo-400 border-indigo-400' : 'text-gray-400 border-transparent hover:text-gray-200'}`}
                                    >
                                        <Info className="w-4 h-4" />
                                        토론 소개
                                    </button>
                                    <button
                                        onClick={handleTopicsTabClick}
                                        className={`py-3 px-4 cursor-pointer font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'topics' ? 'text-indigo-400 border-indigo-400' : 'text-gray-400 border-transparent hover:text-gray-200'}`}
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        토론 주제
                                        {discussion.topics?.length > 0 && (
                                            <span className="bg-indigo-500 text-white text-xs rounded-full px-2 py-0.5">
                                                {discussion.topics.length}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {/* 토론 제목 및 기본 정보 */}
                                <div className="p-4 sm:p-6">
                                    <h1 className="text-xl sm:text-2xl font-bold mb-3">{discussion.title}</h1>

                                    {/* 태그 영역 */}
                                    {discussion.tags && discussion.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {discussion.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* 저자 및 생성일 */}
                                    {/* <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            {discussion.author.image ? (
                                                <img
                                                    src={discussion.author.image}
                                                    alt={discussion.author.name || '익명'}
                                                    className="w-5 h-5 rounded-full"
                                                />
                                            ) : (
                                                <div className="w-5 h-5 bg-gray-700 rounded-full"></div>
                                            )}
                                            <span>{discussion.author.name || '익명'}</span>
                                        </div>
                                        <span>•</span>
                                        <span>{formatDate(discussion.createdAt)}</span>
                                    </div> */}

                                    {/* 활용 책 정보 */}
                                    {/* <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                                        <span>도서:</span>
                                        <span className="font-medium text-gray-300">{discussion.bookTitle}</span>
                                        <span>•</span>
                                        <span>{discussion.bookAuthor} 저</span>
                                    </div> */}

                                    {/* 탭 컨텐츠 */}
                                    {activeTab === 'info' && (
                                        <div className="mt-5 prose prose-invert max-w-none">
                                            <p className="whitespace-pre-wrap text-gray-300">{discussion.content}</p>
                                        </div>
                                    )}

                                    {/* 토픽이 없거나 적을 때 빈 상태 */}
                                    {activeTab === 'topics' && (!discussion.topics || discussion.topics.length === 0) && (
                                        <div className="mt-5 flex flex-col items-center py-8">
                                            <MessageSquare className="w-10 h-10 text-gray-500 mb-3" />
                                            <p className="text-gray-400 text-center">등록된 토론 주제가 없습니다.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 토론 설정 카드 */}
                            <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar className="w-4 h-4 text-indigo-400" />
                                    <h2 className="text-lg font-medium">토론 설정</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* 예정 날짜 */}
                                    <div className="flex flex-col">
                                        <p className="text-sm text-gray-400 mb-1">예정 날짜</p>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-indigo-400" />
                                            <p className="font-medium">{formatDate(discussion.scheduledAt)}</p>
                                        </div>
                                        {discussion.scheduledAt && (
                                            <div className="mt-1 text-sm text-indigo-400 flex items-center gap-1">
                                                <span>{getRemainingTimeText(discussion.scheduledAt)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 참가 인원 */}
                                    <div className="flex flex-col">
                                        <p className="text-sm text-gray-400 mb-1">참가 인원</p>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-5 h-5 text-indigo-400" />
                                            <p className="font-medium">
                                                {participantsCount}명 참여 중
                                                {discussion.maxParticipants && ` (최대 ${discussion.maxParticipants}명)`}
                                            </p>
                                        </div>
                                        {discussion.maxParticipants && (
                                            <div className="mt-2 w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full"
                                                    style={{
                                                        width: `${Math.min(100, (participantsCount / discussion.maxParticipants) * 100)}%`
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* 공개 설정 */}
                                    <div className="flex flex-col">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-400 mb-1">공개 설정</p>
                                            <div className="flex items-center gap-2 p-3 bg-gray-800/70 rounded-lg h-14">
                                                {privacyInfo.icon}
                                                <p className="font-medium">{privacyInfo.text}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 참가 신청 */}
                                    <div className="flex flex-col">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-400 mb-1">참가 신청</p>
                                            <button
                                                onClick={handleJoinRequest}
                                                disabled={isJoinLoading || participationStatus === 'rejected'}
                                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed h-14 ${getParticipationButtonStyle()}`}
                                            >
                                                {isJoinLoading ? (
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <Users className="w-5 h-5" />
                                                )}
                                                <span>{getParticipationButtonText()}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 위치 정보 카드 */}
                            <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
                                <div className="flex items-center gap-2 mb-4">
                                    <MapPin className="w-4 h-4 text-indigo-400" />
                                    <h2 className="text-lg font-medium">모임 장소</h2>
                                </div>

                                {true ? (
                                    // <div className="space-y-3">
                                    //     <p className="font-medium">{discussion.location.address}</p>
                                    //     <div className="w-full h-[300px] rounded-xl overflow-hidden">
                                    //         <MapComponent
                                    //             latitude={discussion.location.lat}
                                    //             longitude={discussion.location.lng}
                                    //             address={discussion.location.address || '인천 주부토로 81번길 23'}
                                    //         />
                                    //     </div>
                                    // </div>
                                    // <div className="space-y-3">
                                    //     <p className="font-medium">{'discussion.location.address'}</p>
                                    //     <div className="w-full h-[300px] rounded-xl overflow-hidden">
                                    //         <MapComponent address={'종로구 혜화로6길 17'} />
                                    //     </div>
                                    // </div>

                                    <Link className="text-gray-400" href={'https://map.kakao.com/link/search/종로구 혜화로6길 17 소원책방'} target="_blank">
                                        <div className="flex flex-col items-center justify-center p-6 bg-gray-800/50 rounded-xl border border-gray-700/50">
                                            <MapPin className="w-10 h-10 text-gray-500 mb-2" />
                                            서울 종로구 혜화로6길 17 소원책방
                                            <p className="text-gray-400">웹 지도 보기</p>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-6 bg-gray-800/50 rounded-xl border border-gray-700/50">
                                        <MapPin className="w-10 h-10 text-gray-500 mb-2" />
                                        <p className="text-gray-400">등록된 모임 장소가 없습니다</p>
                                    </div>
                                )}
                            </div>

                            {/* 좋아요 및 댓글 작성 섹션 */}
                            <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
                                <div className="flex items-center gap-2 mb-6">
                                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                                    <h2 className="text-lg font-medium">좋아요 & 댓글 작성</h2>
                                </div>

                                {/* 좋아요 및 통계 */}
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700/50">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={toggleLike}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isLiked ? 'text-red-400 bg-red-500/10' : 'text-gray-300 hover:bg-gray-700/50'}`}
                                        >
                                            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-400' : ''}`} />
                                            <span>좋아요</span>
                                        </button>
                                        <div className="text-sm text-gray-400">
                                            12명이 좋아합니다
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Eye className="w-4 h-4" />
                                        <span>142회 조회</span>
                                    </div>
                                </div>

                                {/* 댓글 작성 폼 */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-3 border-b border-gray-700/50 pb-3">
                                        <div className="w-8 h-8 bg-indigo-500/30 rounded-full flex items-center justify-center">
                                            <Users className="w-4 h-4 text-indigo-300" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="토론에 대한 의견을 작성해주세요..."
                                            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-300"
                                        />
                                        <button className="text-indigo-500 font-medium hover:text-indigo-400 transition-colors">
                                            게시
                                        </button>
                                    </div>
                                </div>

                                {/* 댓글 리스트 */}
                                <div className="space-y-4">
                                    <h3 className="text-md font-medium text-gray-400 mb-4">최근 댓글</h3>

                                    <div className="flex gap-3 pb-4 border-b border-gray-700/30">
                                        <div className="w-8 h-8 bg-purple-500/30 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-medium text-purple-300">김</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium">김독서</span>
                                                <span className="text-xs text-gray-500">2시간 전</span>
                                            </div>
                                            <p className="text-gray-300">저도 이 책을 읽었는데, 3장에서 언급된 내용이 특히 인상적이었습니다. 이 토론에서 함께 이야기하고 싶네요!</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pb-4 border-b border-gray-700/30">
                                        <div className="w-8 h-8 bg-green-500/30 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-medium text-green-300">이</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium">이북클럽</span>
                                                <span className="text-xs text-gray-500">1일 전</span>
                                            </div>
                                            <p className="text-gray-300">토론 주제가 정말 흥미롭네요. 참가신청했습니다. 함께 이야기 나눌 수 있기를 기대합니다!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full py-12 text-center">
                            <p className="text-xl text-gray-400">토론을 찾을 수 없습니다.</p>
                        </div>
                    )}



                </div>
            </div>
        </div>
    );
} 