'use client';

import { Heart } from "lucide-react";
import { useState } from "react";

interface Comment {
  id: number;
  author: string;
  content: string;
  timeAgo: string;
  likes: number;
}

interface CommentListProps {
  comments: Comment[];
}

export default function CommentList({ comments }: CommentListProps) {
  const [likedComments, setLikedComments] = useState<number[]>([]);

  const toggleLike = (commentId: number) => {
    setLikedComments(prev => 
      prev.includes(commentId)
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium">{comment.author[0]}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{comment.author}</span>
              <span className="text-xs text-gray-400">{comment.timeAgo}</span>
            </div>
            <p className="text-gray-300 mt-1">{comment.content}</p>
            <button
              onClick={() => toggleLike(comment.id)}
              className={`flex items-center gap-1 mt-2 text-sm ${
                likedComments.includes(comment.id) ? "text-red-500" : "text-gray-400"
              } hover:text-red-500 transition-colors`}
            >
              <Heart
                className="w-4 h-4"
                fill={likedComments.includes(comment.id) ? "currentColor" : "none"}
              />
              <span>{comment.likes + (likedComments.includes(comment.id) ? 1 : 0)}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 