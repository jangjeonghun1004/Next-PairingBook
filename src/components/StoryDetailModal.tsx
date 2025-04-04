'use client';

import { X, Heart, MessageCircle, Bookmark, Share2, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import CommentList from "./CommentList";

interface StoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: {
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
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comment, setComment] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comments, setComments] = useState([
    {
      id: 1,
      author: "독서왕",
      content: "정말 공감되는 내용이네요. 저도 같은 생각을 했었습니다.",
      timeAgo: "1시간 전",
      likes: 5,
    },
    {
      id: 2,
      author: "책사랑",
      content: "이 책의 메시지가 정말 인상적이었어요. 추천합니다!",
      timeAgo: "2시간 전",
      likes: 3,
    },
    {
      id: 3,
      author: "책벌레",
      content: "다음에 어떤 책을 읽을지 추천해주세요!",
      timeAgo: "3시간 전",
      likes: 1,
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentImageIndex(story.currentImageIndex);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, story.currentImageIndex]);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? story.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === story.images.length - 1 ? 0 : prev + 1));
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const newComment = {
      id: comments.length + 1,
      author: "나",
      content: comment.trim(),
      timeAgo: "방금 전",
      likes: 0,
    };

    setComments([newComment, ...comments]);
    setComment("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-gray-900/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center">
              <span className="text-sm font-medium">{story.author[0]}</span>
            </div>
            <div>
              <div className="font-medium">{story.author}</div>
              <div className="text-xs text-gray-400">{story.timeAgo}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6">
              {/* 이미지 섹션 */}
              <div className="md:w-1/2 md:sticky md:top-[88px] md:self-start">
                <div className="relative aspect-square rounded-xl overflow-hidden">
                  <img
                    src={story.images[currentImageIndex]}
                    alt={story.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* 이미지 인디케이터 */}
                  {story.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                      {story.images.map((_, index) => (
                        <div
                          key={index}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            index === currentImageIndex
                              ? "bg-white w-2.5"
                              : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* 이미지 네비게이션 버튼 */}
                  {story.images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-gray-900/80 backdrop-blur-sm text-sm text-gray-300">
                      {story.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* 컨텐츠 섹션 */}
              <div className="md:w-1/2 flex flex-col min-h-[50vh]">
                {/* 제목과 내용 */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{story.title}</h2>
                  <div className="text-gray-300 mb-6 whitespace-pre-line">{story.content}</div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-4 border-t border-gray-800 pt-4 mb-6">
                    <button
                      onClick={() => setIsLiked(!isLiked)}
                      className={`flex items-center gap-2 ${isLiked ? "text-red-500" : "text-gray-300"} hover:text-red-500 transition-colors`}
                    >
                      <Heart className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
                      <span>{story.likes + (isLiked ? 1 : 0)}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span>{story.comments}</span>
                    </button>
                    <button
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className={`ml-auto ${isBookmarked ? "text-yellow-500" : "text-gray-300"} hover:text-yellow-500 transition-colors`}
                    >
                      <Bookmark className="w-5 h-5" fill={isBookmarked ? "currentColor" : "none"} />
                    </button>
                    <button className="text-gray-300 hover:text-white transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 댓글 섹션 */}
                <div className="border-t border-gray-800 pt-6">
                  <h3 className="text-lg font-medium mb-4">댓글 {comments.length}</h3>
                  <CommentList comments={comments} />
                </div>

                {/* 댓글 입력 */}
                <form onSubmit={handleSubmitComment} className="sticky bottom-0 mt-6 p-4 bg-gray-900/80 backdrop-blur-sm border-t border-gray-800">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="댓글을 입력하세요..."
                      className="flex-1 bg-gray-800 rounded-full px-4 py-2 text-white placeholder-gray-400 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!comment.trim()}
                      className="p-2 rounded-full bg-indigo-500 text-white disabled:bg-gray-700 disabled:text-gray-400 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 