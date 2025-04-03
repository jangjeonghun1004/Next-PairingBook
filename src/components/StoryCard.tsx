'use client';

import { Heart, MessageCircle } from "lucide-react";
import { useState } from "react";
import StoryDetailModal from "./StoryDetailModal";

interface StoryCardProps {
  author: string;
  timeAgo: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  category: string;
  imageUrl: string;
}

export default function StoryCard({
  author,
  timeAgo,
  title,
  content,
  likes,
  comments,
  category,
  imageUrl,
}: StoryCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsDetailOpen(true)}
        className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer hover:bg-gray-800/70 transition-colors"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center">
              <span className="text-sm font-medium">{author[0]}</span>
            </div>
            <div>
              <div className="font-medium">{author}</div>
              <div className="text-xs text-gray-400">{timeAgo}</div>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-gray-800 text-sm text-gray-300">
            {category}
          </span>
        </div>

        {/* 이미지 */}
        <div className="aspect-square">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 푸터 */}
        <div className="p-4">
          <h3 className="font-medium mb-2">{title}</h3>
          <p className="text-sm text-gray-300 line-clamp-2 mb-4">{content}</p>
          <div className="flex items-center gap-4 text-gray-400">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span className="text-sm">{likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{comments}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 모달 */}
      <StoryDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        story={{
          author,
          timeAgo,
          title,
          content,
          likes,
          comments,
          category,
          imageUrl,
        }}
      />
    </>
  );
} 