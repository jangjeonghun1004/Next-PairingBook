'use client';

import { X, Heart, MessageCircle, Bookmark, Share2, Send } from "lucide-react";
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
    imageUrl: string;
  };
}

export default function StoryDetailModal({ isOpen, onClose, story }: StoryDetailModalProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comment, setComment] = useState("");
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
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
        <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-gray-900/80 backdrop-blur-sm">
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
          <div className="max-w-2xl mx-auto">
            {/* 이미지 */}
            <div className="aspect-square rounded-xl overflow-hidden mb-4 relative">
              <img
                src={story.imageUrl}
                alt={story.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1 rounded-full bg-gray-900/80 backdrop-blur-sm text-sm text-gray-300">
                  {story.category}
                </span>
              </div>
            </div>

            {/* 제목과 내용 */}
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

            {/* 댓글 목록 */}
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
  );
} 