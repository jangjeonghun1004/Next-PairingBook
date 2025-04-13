'use client';

import { X, Heart, MessageCircle, Bookmark, Share2, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { timeAgo } from "@/lib/utils";

interface StoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: {
    id: string;
    author: string;
    timeAgo: string;
    title: string;
    content: string;
    likes: number;
    comments: number;
    category: string;
    images: string[];
    currentImageIndex: number;
  };
}

export default function StoryDetailModal({ isOpen, onClose, story }: StoryDetailModalProps) {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comment, setComment] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [likesCount, setLikesCount] = useState(story.likes);
  const [isLoading, setIsLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [commentPage, setCommentPage] = useState(0);
  const [imageRatio, setImageRatio] = useState<'portrait' | 'landscape' | 'square'>('square');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [isImageTransitioning, setIsImageTransitioning] = useState(false);
  const [historyStateAdded, setHistoryStateAdded] = useState(false);

  // 댓글 타입 정의
  interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: {
      name: string | null;
      image: string | null;
    };
  }

  // 댓글 불러오기
  const fetchComments = async (page = 0) => {
    if (!isOpen) return;

    try {
      setIsLoadingComments(true);
      const response = await fetch(`/api/stories/${story.id}/comments?page=${page}`);

      if (!response.ok) {
        throw new Error('댓글을 불러오는 중 오류가 발생했습니다.');
      }

      const data = await response.json();

      if (page === 0) {
        setComments(data.comments);
      } else {
        setComments(prev => [...prev, ...data.comments]);
      }

      setHasMoreComments(data.hasMore);
      setCommentPage(page);
    } catch (error) {
      console.error('댓글 불러오기 오류:', error);
      toast.error('댓글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingComments(false);
    }
  };

  // 초기 댓글 로드
  useEffect(() => {
    if (isOpen) {
      fetchComments(0);
    }
  }, [isOpen, story.id]);

  // 초기 좋아요 상태 확인
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!session?.user || !isOpen) return;

      try {
        const response = await fetch(`/api/stories/${story.id}/like/status`);
        const data = await response.json();

        if (response.ok) {
          setIsLiked(data.isLiked);
        }
      } catch (error) {
        console.error("좋아요 상태 확인 중 오류:", error);
      }
    };

    checkLikeStatus();
  }, [session?.user, story.id, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentImageIndex(story.currentImageIndex);
      setLikesCount(story.likes);

      // 이미지 비율에 따라 모달 스타일 조정
      checkImageRatio();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, story.currentImageIndex, story.likes, story.images]);

  // 이미지 비율 확인
  const checkImageRatio = () => {
    if (!story.images || story.images.length === 0) return;

    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const ratio = width / height;

      if (ratio > 1.3) {
        setImageRatio('landscape');
      } else if (ratio < 0.85) {
        setImageRatio('portrait');
      } else {
        setImageRatio('square');
      }
    };

    img.src = story.images[currentImageIndex];
  };

  // 이미지 변경 시 비율 다시 확인
  useEffect(() => {
    if (isOpen) {
      checkImageRatio();
    }
  }, [currentImageIndex, isOpen]);

  // 이미지 스와이프 처리 함수
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;

    const difference = touchStartX - touchEndX;
    // 화면 너비에 따라 스와이프 감도 조절
    const viewportWidth = window.innerWidth;
    const minSwipeDistance = viewportWidth > 768 ? 80 : 50; // 데스크톱에서는 더 큰 스와이프 거리 필요

    if (difference > minSwipeDistance) {
      // 왼쪽으로 스와이프 (다음 이미지)
      handleNextImage();
    } else if (difference < -minSwipeDistance) {
      // 오른쪽으로 스와이프 (이전 이미지)
      handlePrevImage();
    }

    // 상태 초기화
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const handlePrevImage = () => {
    if (isImageTransitioning) return;
    setIsImageTransitioning(true);

    // 이미지 전환 애니메이션
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev === 0 ? story.images.length - 1 : prev - 1));
      setIsImageTransitioning(false);
    }, 200);
  };

  const handleNextImage = () => {
    if (isImageTransitioning) return;
    setIsImageTransitioning(true);

    // 이미지 전환 애니메이션
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev === story.images.length - 1 ? 0 : prev + 1));
      setIsImageTransitioning(false);
    }, 200);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/stories/${story.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: comment }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '댓글을 저장하는 중 오류가 발생했습니다.');
      }

      const newComment = await response.json();
      setComments((prev) => [newComment, ...prev]);
      setComment('');

      // 댓글 카운트 증가
      story.comments += 1;

    } catch (error) {
      console.error('댓글 저장 중 오류:', error);
      toast.error('댓글을 저장하는 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 더 많은 댓글 로드
  const loadMoreComments = () => {
    if (!isLoadingComments && hasMoreComments) {
      fetchComments(commentPage + 1);
    }
  };

  const handleLikeToggle = async () => {
    if (!session?.user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/stories/${story.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        setIsLiked(data.isLiked);
        setLikesCount(data.likes);
        toast.success(data.isLiked ? "좋아요를 눌렀습니다." : "좋아요를 취소했습니다.");
      } else {
        toast.error(data.error || "좋아요 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("좋아요 처리 중 오류:", error);
      toast.error("좋아요 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 공유 함수
  const handleShare = () => {
    // 페이지 URL 대신 해당 스토리의 직접 URL 생성
    const baseUrl = window.location.origin;
    const storyUrl = `${baseUrl}/stories/share/${story.id}`;

    navigator.clipboard.writeText(storyUrl);
    toast.success("링크가 클립보드에 복사되었습니다.");
  };

  // 브라우저 뒤로가기 처리
  useEffect(() => {
    // popstate 이벤트 핸들러 정의
    const handlePopState = (event: PopStateEvent) => {
      console.log('StoryDetailModal popstate 이벤트 발생', event.state);
      if (isOpen) {
        console.log('StoryDetailModal 닫기 실행');
        onClose();
      }
    };

    // 모달이 열릴 때
    if (isOpen && !historyStateAdded) {
      console.log('StoryDetailModal 히스토리 상태 추가');
      // 현재 URL을 history에 추가 (모달이 열릴 때마다)
      window.history.pushState({ modal: true, storyId: story.id }, '', window.location.pathname);
      setHistoryStateAdded(true);

      // popstate 이벤트 리스너 등록
      window.addEventListener('popstate', handlePopState);
    }

    // 클린업 함수: 컴포넌트 언마운트 시, 또는 의존성 변경 시 실행
    return () => {
      console.log('StoryDetailModal 이벤트 리스너 제거');
      window.removeEventListener('popstate', handlePopState);

      // 모달이 닫힐 때 상태 초기화
      if (!isOpen) {
        setHistoryStateAdded(false);
      }
    };
  }, [isOpen, onClose, story.id, historyStateAdded]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900/98 to-black/98 backdrop-blur-md z-50 overflow-y-auto">
      <div className="min-h-screen flex flex-col max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800/50 sticky top-0 bg-gray-900/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-sm font-semibold text-white">{story.author[0]}</span>
            </div>
            <div>
              <div className="font-medium text-white truncate max-w-[180px]">{story.author}</div>
              <div className="text-xs text-gray-400">{timeAgo(story.timeAgo) || '방금 전'}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-800/70 hover:bg-gray-700 text-gray-300 hover:text-white transition-all duration-200 transform hover:scale-105"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 p-4 md:p-6">
          <div className="max-w-6xl mx-auto modal-content-scroll">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* 이미지 섹션 */}
              <div className="w-full lg:w-3/5 lg:sticky lg:top-[88px] lg:self-start px-0 sm:px-2 md:px-0">
                <div 
                  className={`relative rounded-xl overflow-hidden bg-gray-800/30 shadow-2xl mx-auto ${
                    imageRatio === 'portrait'
                      ? 'w-[85%] sm:w-[80%] md:w-auto md:max-w-sm'
                      : 'w-full'
                  } group transition-all duration-300`}
                >
                  <div className={`flex items-center justify-center ${
                    imageRatio === 'portrait' 
                      ? 'min-h-[40vh] max-h-[65vh] md:min-h-[50vh] md:max-h-[80vh]'
                      : imageRatio === 'landscape'
                        ? 'aspect-[16/9] md:aspect-video' 
                        : 'aspect-square'
                  }`}>
                    <img
                      src={story.images[currentImageIndex]}
                      alt={story.title}
                      className={`${
                        imageRatio === 'portrait'
                          ? 'h-auto w-full object-contain'
                          : imageRatio === 'landscape'
                            ? 'w-full h-auto object-contain' 
                            : 'w-full h-full object-cover'
                      } image-transition ${isImageTransitioning ? 'opacity-50' : 'opacity-100'}`}
                      style={{
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                      }}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      draggable="false"
                    />
                  </div>

                  {/* 다중 이미지 화살표 */}
                  {story.images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2.5 transition-all md:opacity-0 md:group-hover:opacity-100 opacity-70 ${currentImageIndex === 0 ? 'invisible' : ''} shadow-lg hover:scale-110`}
                        aria-label="이전 이미지"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2.5 transition-all md:opacity-0 md:group-hover:opacity-100 opacity-70 ${currentImageIndex === story.images.length - 1 ? 'invisible' : ''} shadow-lg hover:scale-110`}
                        aria-label="다음 이미지"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* 이미지 인디케이터 */}
                  {story.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      {story.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex
                              ? "bg-white w-3 h-3"
                              : "bg-white/50 hover:bg-white/80"
                            }`}
                          aria-label={`${index + 1}번 이미지로 이동`}
                        />
                      ))}
                    </div>
                  )}

                  {/* {story.category && (
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full bg-indigo-600/90 backdrop-blur-sm text-sm text-white font-medium shadow-lg">
                        {story.category}
                      </span>
                    </div>
                  )} */}
                </div>

                {/* 액션 버튼 - 모바일에서는 상단에 표시 */}
                <div className="flex items-center justify-between mt-4 p-3 bg-gray-800/30 backdrop-blur-sm rounded-xl lg:hidden border border-gray-700/30">
                  <div className="flex items-center gap-5">
                    <button
                      onClick={handleLikeToggle}
                      disabled={isLoading}
                      className={`flex items-center cursor-pointer gap-1.5 ${isLiked ? "text-red-500" : "text-gray-300"} hover:text-red-500 transition-colors ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Heart className={`w-5 h-5 transition-all ${isLiked ? "fill-red-500 scale-110" : ""}`} />
                      <span className="font-medium">{likesCount}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-gray-300 hover:text-blue-400 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">{story.comments}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className={`${isBookmarked ? "text-yellow-500" : "text-gray-300"} cursor-pointer hover:text-yellow-500 transition-colors`}
                    >
                      <Bookmark className={`w-5 h-5 transition-transform ${isBookmarked ? "fill-yellow-500 scale-110" : ""}`} />
                    </button>
                    <button onClick={handleShare} className="text-gray-300 cursor-pointer hover:text-purple-400 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 컨텐츠 섹션 */}
              <div className="lg:w-2/5 flex flex-col min-h-[30vh] mt-6 lg:mt-0">
                {/* 내용 */}
                <div className="flex-1">
                  <div className="text-gray-300 mb-6 break-words overflow-y-auto pr-2">
                    {story.content.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-3 last:mb-0 overflow-wrap-anywhere leading-relaxed">{paragraph}</p>
                    ))}
                  </div>

                  {/* 액션 버튼 - 데스크톱에서만 표시 */}
                  <div className="hidden lg:flex items-center gap-5 border-t border-gray-800/50 pt-5 mb-6">
                    <button
                      onClick={handleLikeToggle}
                      disabled={isLoading}
                      className={`flex items-center cursor-pointer gap-2 ${isLiked ? "text-red-500" : "text-gray-300"} hover:text-red-500 transition-colors ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Heart className={`w-5 h-5 transition-transform ${isLiked ? "fill-red-500 scale-110" : ""}`} />
                      <span className="font-medium">{likesCount}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">{story.comments}</span>
                    </button>
                    <div className="ml-auto flex items-center gap-5">
                      {/* <button
                        onClick={() => setIsBookmarked(!isBookmarked)}
                        className={`${isBookmarked ? "text-yellow-500" : "text-gray-300"} cursor-pointer hover:text-yellow-500 transition-colors`}
                      >
                        <Bookmark className={`w-5 h-5 transition-transform ${isBookmarked ? "fill-yellow-500 scale-110" : ""}`} />
                      </button> */}
                      <button onClick={handleShare} className="text-gray-300 cursor-pointer hover:text-purple-400 transition-colors">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 댓글 섹션 */}
                <div className="border-t border-gray-800/50 mt-4">
                  {/* 댓글 입력 */}
                  <form onSubmit={handleSubmitComment} className="sticky bottom-0 mt-5 p-4 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800/50 rounded-b-lg">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="댓글을 입력하세요..."
                        className="flex-1 bg-gray-800/70 border border-gray-700/50 focus:border-indigo-500/50 rounded-full px-4 py-2.5 text-white placeholder-gray-400 outline-none transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!comment.trim() || isSubmitting}
                        className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-gray-700 disabled:text-gray-400 transition-all transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/20"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </form>

                  <div className="space-y-4 mt-5">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 bg-gray-800/30 p-3 rounded-lg border border-gray-700/30 hover:border-gray-600/40 transition-all group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden shrink-0">
                          {comment.user.image ? (
                            <img
                              src={comment.user.image}
                              alt={comment.user.name || '사용자'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-white">
                              {comment.user.name ? comment.user.name[0] : '?'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white truncate max-w-[120px]">{comment.user.name || '익명'}</span>
                            <span className="text-xs text-gray-400">
                              {timeAgo(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-300 mt-1.5 break-words overflow-wrap-anywhere leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    ))}

                    {isLoadingComments && (
                      <div className="text-center py-6 bg-gray-800/20 rounded-lg">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-indigo-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">로딩 중...</span>
                        </div>
                      </div>
                    )}

                    {hasMoreComments && !isLoadingComments && (
                      <button
                        onClick={loadMoreComments}
                        className="w-full py-2.5 text-center text-sm text-indigo-400 hover:text-indigo-300 bg-gray-800/20 rounded-lg border border-gray-700/30 hover:border-indigo-500/30 transition-all"
                      >
                        더 많은 댓글 보기
                      </button>
                    )}

                    {comments.length === 0 && !isLoadingComments && (
                      <div className="text-center py-8 text-gray-400 bg-gray-800/20 rounded-lg border border-gray-700/30">
                        <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-40" />
                        <p>아직 댓글이 없습니다.</p>
                        <p className="text-sm mt-1 text-indigo-400">첫 댓글을 남겨보세요!</p>
                      </div>
                    )}
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 