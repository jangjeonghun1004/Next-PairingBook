'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    BookOpen,
    ArrowLeft,
    Heart,
    Calendar,
    Users,
    Lock,
    Globe,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    Share2,
    Clock,
    Eye
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import HamburgerMenu from "@/components/HamburgerMenu";
import SearchModal from "@/components/SearchModal";

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
}

export default function DiscussionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [discussion, setDiscussion] = useState<Discussion | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [activeSection, setActiveSection] = useState<string>("content");
    const [participationStatus, setParticipationStatus] = useState<string | null>(null);
    const [participantsCount, setParticipantsCount] = useState<number>(0);
    const [isJoinLoading, setIsJoinLoading] = useState(false);

    // 데이터 로드
    useEffect(() => {
        const loadDiscussion = async () => {
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
        };

        if (params.id) {
        loadDiscussion();
        }
    }, [params.id]);

    // 참가 상태 확인
    const checkParticipationStatus = async () => {
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
    };

    // 이미지 네비게이션 함수
    const goToPreviousImage = () => {
        const imageCount = discussion?.imageUrls?.length || 0;
        if (imageCount > 0) {
            setCurrentImageIndex(prevIndex => 
                prevIndex === 0 ? imageCount - 1 : prevIndex - 1
            );
        }
    };

    const goToNextImage = () => {
        const imageCount = discussion?.imageUrls?.length || 0;
        if (imageCount > 0) {
            setCurrentImageIndex(prevIndex => 
                prevIndex === imageCount - 1 ? 0 : prevIndex + 1
            );
        }
    };

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
                    description: "초대받은 사용자만 참여할 수 있습니다."
                };
            case 'invitation':
                return {
                    icon: <Users className="w-5 h-5 text-blue-400" />,
                    text: "초대 토론",
                    description: "승인 후 참여 가능합니다."
                };
            default:
                return {
                    icon: <Globe className="w-5 h-5 text-green-400" />,
                    text: "공개 토론",
                    description: "누구나 참여할 수 있는 공개 토론입니다."
                };
        }
    };

    // 남은 시간 계산
    const getRemainingTimeText = (date: Date | null | string) => {
        if (!date) return "날짜 미정";
        
        const targetDate = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diffTime = targetDate.getTime() - now.getTime();
        
        if (diffTime <= 0) return "토론 진행 중";
        
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffDays > 0) {
            return `${diffDays}일 ${diffHours}시간 남음`;
        } else if (diffHours > 0) {
            return `${diffHours}시간 ${diffMinutes}분 남음`;
        } else {
            return `${diffMinutes}분 남음`;
        }
    };

    // 로딩 중 표시
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
                </div>
            </div>
        );
    }

    // 데이터가 없는 경우
    if (!discussion) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
                <p className="text-xl mb-4">토론 발제문을 찾을 수 없습니다.</p>
                <button
                    onClick={() => router.push('/discussions')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    토론 목록으로 돌아가기
                </button>
            </div>
        );
    }

    // 프라이버시 정보
    const privacyInfo = renderPrivacyInfo(discussion.privacy);

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

            {/* 토스트 메시지 */}
            {showToast && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg">
                    {toastMessage}
                </div>
            )}

            {/* 메인 콘텐츠 */}
            <main className="md:pl-64 pt-16 pb-20">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* 뒤로 가기 버튼 */}
                        <button
                        onClick={() => router.push('/discussions')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        토론 목록으로 돌아가기
                    </button>

                    {/* 토론 정보 */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl overflow-hidden">
                        {/* 헤더 섹션 */}
                        <div className="p-6 border-b border-gray-700">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                                <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-0">{discussion.title}</h1>
                                <div className="flex items-center gap-2">
                                    {/* 참가 신청 버튼 */}
                                    <button
                                        onClick={handleJoinRequest}
                                        disabled={isJoinLoading || participationStatus === 'rejected'}
                                        className={`px-4 py-2 ${getParticipationButtonStyle()} rounded-lg transition-colors flex items-center gap-2 ${isJoinLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isJoinLoading ? (
                                            <>
                                                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                                                처리 중...
                                            </>
                                        ) : (
                                            <>
                                                <Users className="w-4 h-4" />
                                                {getParticipationButtonText()}
                                            </>
                                        )}
                        </button>
                        </div>
                    </div>

                        {/* 작성자 정보 */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full overflow-hidden">
                                    {discussion.author.image ? (
                                        <img
                                            src={discussion.author.image}
                                            alt={discussion.author.name || '작성자'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-lg font-bold">
                                                {discussion.author.name ? discussion.author.name.charAt(0).toUpperCase() : 'U'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium">{discussion.author.name || '익명 사용자'}</p>
                                    <p className="text-sm text-gray-400">
                                        {formatDate(discussion.createdAt)}
                                    </p>
                                </div>
                            </div>

                            {/* 책 정보 */}
                            <div className="flex items-center gap-3 mb-2 bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                                <div className="w-10 h-10 flex items-center justify-center bg-indigo-500/20 rounded-lg">
                                    <BookOpen className="w-5 h-5 text-indigo-400" />
                                        </div>
                                <div>
                                    <p className="font-medium">{discussion.bookTitle}</p>
                                    <p className="text-sm text-gray-400">{discussion.bookAuthor}</p>
                                </div>
                            </div>
                        </div>

                        {/* 토론 정보 카드 */}
                        <div className="p-6 bg-gray-800/50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {/* 토론 일시 */}
                                <div className="bg-gray-800 p-4 rounded-lg flex items-start gap-3 border border-gray-700/50 hover:border-indigo-500/50 transition-colors">
                                    <div className="w-10 h-10 flex items-center justify-center bg-indigo-500/20 rounded-lg">
                                        <Calendar className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium">토론 예정 일시</p>
                                        <p className="text-sm text-gray-300">{formatDate(discussion.scheduledAt)}</p>
                                    </div>
                                </div>

                                {/* 남은 시간 */}
                                <div className="bg-gray-800 p-4 rounded-lg flex items-start gap-3 border border-gray-700/50 hover:border-indigo-500/50 transition-colors">
                                    <div className="w-10 h-10 flex items-center justify-center bg-indigo-500/20 rounded-lg">
                                        <Clock className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium">남은 시간</p>
                                        <p className="text-sm text-gray-300">{getRemainingTimeText(discussion.scheduledAt)}</p>
                                    </div>
                                </div>

                                {/* 공개 설정 */}
                                <div className="bg-gray-800 p-4 rounded-lg flex items-start gap-3 border border-gray-700/50 hover:border-indigo-500/50 transition-colors">
                                    <div className="w-10 h-10 flex items-center justify-center bg-indigo-500/20 rounded-lg">
                                    {privacyInfo.icon}
                                    </div>
                                    <div>
                                        <p className="font-medium">{privacyInfo.text}</p>
                                        <p className="text-sm text-gray-300">
                                            {discussion.maxParticipants 
                                                ? `${participantsCount}명 참가 중 / 최대 ${discussion.maxParticipants}명` 
                                                : '인원 제한 없음'}
                                        </p>
                                    </div>
                                    </div>
                                </div>

                            {/* 탭 네비게이션 */}
                            <div className="flex border-b border-gray-700 mb-6">
                                <button
                                    onClick={() => setActiveSection("content")}
                                    className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors ${activeSection === 'content' ? 'text-indigo-400 border-indigo-400' : 'text-gray-400 border-transparent hover:text-gray-200'}`}
                                >
                                    <Eye className="w-4 h-4" />
                                    토론 내용
                                </button>
                                <button
                                    onClick={() => setActiveSection("topics")}
                                    className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors ${activeSection === 'topics' ? 'text-indigo-400 border-indigo-400' : 'text-gray-400 border-transparent hover:text-gray-200'}`}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    토론 주제
                                    {discussion.topics?.length > 0 && <span className="bg-indigo-500 text-white text-xs rounded-full px-1.5">{discussion.topics.length}</span>}
                                </button>
                        </div>

                            {/* 이미지가 있는 경우 이미지 갤러리 표시 */}
                            {discussion.imageUrls && discussion.imageUrls.length > 0 && (
                                <div className="mb-6 relative">
                                    <div className="aspect-w-16 aspect-h-9 bg-gray-800 rounded-lg overflow-hidden border border-gray-700/50">
                                        <img
                                            src={discussion.imageUrls[currentImageIndex]}
                                            alt={`토론 이미지 ${currentImageIndex + 1}`}
                                            className="w-full h-full object-contain"
                                        />
                            </div>
                                    {discussion.imageUrls.length > 1 && (
                                        <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between px-4">
                                            <button
                                                onClick={goToPreviousImage}
                                                className="w-10 h-10 rounded-full bg-black bg-opacity-50 flex items-center justify-center hover:bg-opacity-70 transition-all"
                                            >
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                            <button
                                                onClick={goToNextImage}
                                                className="w-10 h-10 rounded-full bg-black bg-opacity-50 flex items-center justify-center hover:bg-opacity-70 transition-all"
                                            >
                                                <ChevronRight className="w-6 h-6" />
                                            </button>
                            </div>
                                    )}
                                    <div className="mt-2 text-center text-sm text-gray-400">
                                        {currentImageIndex + 1} / {discussion.imageUrls.length}
                                    </div>
                                </div>
                            )}

                            {/* 콘텐츠 섹션 */}
                            {activeSection === "content" && (
                                <div className="mb-6 bg-gray-800 rounded-lg p-6 border border-gray-700/50">
                                    <div className="prose prose-invert max-w-none">
                                        <p className="whitespace-pre-line">{discussion.content}</p>
                                    </div>
                                </div>
                            )}

                            {/* 토론 주제 섹션 */}
                            {activeSection === "topics" && discussion.topics && discussion.topics.length > 0 && (
                                <div className="mb-6 bg-gray-800 rounded-lg p-6 border border-gray-700/50">
                                    <div className="grid grid-cols-1 gap-4">
                                        {discussion.topics.map((topic, index) => (
                                    <div
                                        key={index}
                                                className="p-4 bg-gray-800/80 rounded-lg border border-indigo-500/30 hover:border-indigo-500/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                                                        {index + 1}
                                                    </div>
                                                    <h3 className="font-medium text-lg">토론 주제</h3>
                                                </div>
                                                <p className="ml-11 text-gray-200">{topic}</p>
                                    </div>
                                ))}
                                    </div>
                            </div>
                        )}

                            {/* 태그 목록 */}
                            {discussion.tags && discussion.tags.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="text-md font-medium mb-3 text-gray-300">태그</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {discussion.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1.5 bg-gray-800 text-sm rounded-full border border-gray-700 hover:border-indigo-500/50 transition-colors"
                                            >
                                                #{tag}
                                            </span>
                                            ))}
                                        </div>
                            </div>
                        )}

                            {/* 액션 버튼 */}
                            <div className="flex items-center gap-4 pt-4 border-t border-gray-700">
                                <button
                                    onClick={toggleLike}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors ${
                                        isLiked
                                            ? "bg-pink-600 text-white"
                                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                        }`}
                                >
                                    <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                                    좋아요
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <Share2 className="w-5 h-5" />
                                    공유하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
} 