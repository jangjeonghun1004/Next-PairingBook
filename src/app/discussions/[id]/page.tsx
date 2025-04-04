'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    BookOpen,
    ArrowLeft,
    MessageSquare,
    Heart,
    MessageCircle,
    Share2,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    User,
    Flag,
    Shield,
    X
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import HamburgerMenu from "@/components/HamburgerMenu";
import SearchModal from "@/components/SearchModal";

// 이미지 파일 인터페이스
interface ImageFile {
    file: File;
    previewUrl: string;
    id: string;
}

// 토론 주제 인터페이스
interface Topic {
    id: number;
    value: string;
}

// 토론 발제문 인터페이스
interface Discussion {
    id: string;
    title: string;
    content: string;
    bookTitle: string;
    bookAuthor: string;
    topics: Topic[];
    tags: string[];
    images: ImageFile[];
    author: string;
    authorAvatar: string;
    createdAt: string;
    likes: number;
    comments: number;
}

// 페이지 컴포넌트 props 타입 정의
// interface DiscussionDetailPageProps {
//     params: {
//         id: string;
//     };
// }

export default function DiscussionDetailPage() {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [discussion, setDiscussion] = useState<Discussion | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    // 더미 데이터 생성 함수
    const generateDummyDiscussion = (id: string): Discussion => {
        // 실제 구현에서는 API 호출로 대체해야 합니다
        return {
            id,
            title: "인공지능이 문학에 미치는 영향에 대한 토론",
            content: "인공지능이 문학 창작에 미치는 영향에 대해 토론하고자 합니다. 인공지능이 글을 쓰는 시대에 인간 작가의 역할은 어떻게 변화할까요? 인공지능이 창작한 작품에 대한 저작권은 누구에게 있을까요? 이러한 질문들에 대한 다양한 의견을 나누고 싶습니다.",
            bookTitle: "인공지능 시대의 문학",
            bookAuthor: "김철수",
            topics: [
                { id: 1, value: "인공지능이 문학 창작에 미치는 영향" },
                { id: 2, value: "인공지능 작품의 저작권 문제" },
                { id: 3, value: "인공지능과 인간 작가의 공존 방안" }
            ],
            tags: ["인공지능", "문학", "저작권", "기술", "미래"],
            images: [
                {
                    id: "1",
                    file: new File([], "image1.jpg"),
                    previewUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1000"
                },
                {
                    id: "2",
                    file: new File([], "image2.jpg"),
                    previewUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1000"
                }
            ],
            author: "이지은",
            authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000",
            createdAt: "2023-06-15T14:30:00Z",
            likes: 42,
            comments: 18
        };
    };

    // 데이터 로드
    useEffect(() => {
        // 실제 구현에서는 API 호출로 대체해야 합니다
        const loadDiscussion = async () => {
            setIsLoading(true);
            try {
                // API 호출 시뮬레이션
                await new Promise(resolve => setTimeout(resolve, 1000));
                // const data = generateDummyDiscussion(params.id);
                const data = generateDummyDiscussion("0");
                setDiscussion(data);
            } catch (error) {
                console.error("토론 발제문을 불러오는 중 오류가 발생했습니다:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDiscussion();
        // }, [params.id]);
    }, ["id"]);

    // 이미지 네비게이션 함수
    const goToPreviousImage = () => {
        if (discussion && discussion.images.length > 0) {
            setCurrentImageIndex((prevIndex) =>
                prevIndex === 0 ? discussion.images.length - 1 : prevIndex - 1
            );
        }
    };

    const goToNextImage = () => {
        if (discussion && discussion.images.length > 0) {
            setCurrentImageIndex((prevIndex) =>
                prevIndex === discussion.images.length - 1 ? 0 : prevIndex + 1
            );
        }
    };

    // 좋아요 토글 함수
    const toggleLike = () => {
        if (discussion) {
            setIsLiked(!isLiked);
            setDiscussion({
                ...discussion,
                likes: isLiked ? discussion.likes - 1 : discussion.likes + 1
            });
        }
    };

    // 팔로우 토글 함수
    const toggleFollow = () => {
        setIsFollowing(!isFollowing);
        setToastMessage(isFollowing ? "팔로우가 취소되었습니다." : "팔로우되었습니다.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // 날짜 포맷 함수
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                    className="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors"
                >
                    토론 목록으로 돌아가기
                </button>
            </div>
        );
    }

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

            <div className="min-h-screen flex flex-col items-center px-4 md:pl-28 pb-8">
                <div className="w-full max-w-4xl pt-16 md:pt-8">
                    {/* 헤더 */}
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                토론
                            </span>
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                발제문
                            </span>
                        </div>
                    </div>

                    {/* 토론 발제문 내용 */}
                    <div className="flex flex-col gap-6">
                        {/* 작성자 정보 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <img
                                        src={discussion.authorAvatar}
                                        alt={discussion.author}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                                </div>
                                <div>
                                    <p className="font-medium">{discussion.author}</p>
                                    <p className="text-xs text-gray-400">{formatDate(discussion.createdAt)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleFollow}
                                    className={`px-3 py-1 rounded-full text-sm transition-colors ${isFollowing
                                        ? "bg-gray-700 hover:bg-gray-600"
                                        : "bg-indigo-500 hover:bg-indigo-600"
                                        }`}
                                >
                                    {isFollowing ? "팔로잉" : "팔로우"}
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                                    >
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>

                                    {/* 드롭다운 메뉴 */}
                                    {showDropdown && (
                                        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10">
                                            <button className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                <span>프로필 보기</span>
                                            </button>
                                            <button className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2">
                                                <Flag className="w-4 h-4" />
                                                <span>신고하기</span>
                                            </button>
                                            <button className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2">
                                                <Shield className="w-4 h-4" />
                                                <span>차단하기</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 제목 */}
                        <h1 className="text-2xl font-bold">{discussion.title}</h1>

                        {/* 책 정보 */}
                        <div className="p-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl backdrop-blur-sm border border-indigo-500/30">
                            <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="w-5 h-5 text-indigo-400" />
                                <h2 className="font-medium">책 정보</h2>
                            </div>
                            <div className="pl-7">
                                <p className="text-lg font-medium">{discussion.bookTitle}</p>
                                <p className="text-gray-300">{discussion.bookAuthor}</p>
                            </div>
                        </div>

                        {/* 토론 주제 */}
                        {discussion.topics.map((topic, index) => (
                            <div key={topic.id} className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl backdrop-blur-sm border border-purple-500/30">
                                <div className="flex items-center gap-2 mb-3">
                                    <MessageSquare className="w-5 h-5 text-purple-400" />
                                    <h2 className="font-medium">토론 주제</h2>
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-sm font-medium">
                                        {index + 1}
                                    </div>
                                </div>
                                <div className="pl-7 space-y-2">
                                    <div key={topic.id} className="p-3 bg-gray-800/50 rounded-lg flex items-start gap-3">
                                        <p>{topic.value}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* 내용 */}
                        <div className="prose prose-invert max-w-none">
                            <p className="whitespace-pre-line">{discussion.content}</p>
                        </div>

                        {/* 태그 */}
                        {discussion.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {discussion.tags.map((tag, index) => (
                                    <div
                                        key={index}
                                        className="px-3 py-1 bg-indigo-500/20 rounded-full text-sm"
                                    >
                                        #{tag}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 이미지 슬라이더 */}
                        {discussion.images.length > 0 && (
                            <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                                <img
                                    src={discussion.images[currentImageIndex].previewUrl}
                                    alt={`이미지 ${currentImageIndex + 1}`}
                                    className="w-full h-full object-cover"
                                />

                                {/* 이미지 네비게이션 버튼 */}
                                {discussion.images.length > 1 && (
                                    <>
                                        <button
                                            onClick={goToPreviousImage}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={goToNextImage}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </button>

                                        {/* 이미지 인디케이터 */}
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                            {discussion.images.map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setCurrentImageIndex(index)}
                                                    className={`w-2 h-2 rounded-full transition-colors ${index === currentImageIndex ? "bg-white" : "bg-white/50"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* 상호작용 버튼 */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={toggleLike}
                                    className={`flex items-center gap-1 transition-colors ${isLiked ? "text-pink-500" : "text-gray-400 hover:text-pink-500"
                                        }`}
                                >
                                    <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                                    <span>{discussion.likes}</span>
                                </button>
                                <button className="flex items-center gap-1 text-gray-400 hover:text-indigo-400 transition-colors">
                                    <MessageCircle className="w-5 h-5" />
                                    <span>{discussion.comments}</span>
                                </button>
                                <button className="flex items-center gap-1 text-gray-400 hover:text-indigo-400 transition-colors">
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </div>
                            <button
                                onClick={() => router.push(`/discussions/${discussion.id}/comments`)}
                                className="px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>댓글 작성하기</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 토스트 메시지 */}
            {showToast && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-lg z-50 animate-fade-in-up">
                    <div className="flex items-center gap-2">
                        <span>{toastMessage}</span>
                        <button onClick={() => setShowToast(false)}>
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
} 