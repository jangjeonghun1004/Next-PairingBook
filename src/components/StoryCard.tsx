'use client';

import { Heart, MessageCircle, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import StoryDetailModal from "./StoryDetailModal";

interface StoryCardProps {
  author: string;
  timeAgo: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  category: string;
  images: string[];
}

export default function StoryCard({
  author,
  timeAgo,
  title,
  content,
  likes,
  comments,
  category,
  images,
}: StoryCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // const [hasOverflow, setHasOverflow] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      // const element = contentRef.current;
      // setHasOverflow(element.scrollHeight > element.clientHeight);
    }
  }, [content]);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (images.length <= 1) {
      setIsDetailOpen(true);
      return;
    }

    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;

    if (isLeftHalf) {
      handlePrevImage(e);
    } else {
      handleNextImage(e);
    }
  };

  return (
    <>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-gray-800/70 transition-colors">
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
        <div 
          className="relative aspect-square cursor-pointer" 
          onClick={handleImageClick}
        >
          <img
            src={images[currentImageIndex]}
            alt={title}
            className="w-full h-full object-cover"
          />
          
          {/* 이미지 인디케이터 */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {images.map((_, index) => (
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
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* 클릭 영역 가이드 (선택사항) */}
          {images.length > 1 && (
            <>
              <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium line-clamp-1 flex-1">{title}</h3>
            <button
              onClick={() => setIsDetailOpen(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5 group shrink-0 ml-2"
            >
              <span>더보기</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
          <p className="text-sm text-gray-300 line-clamp-2 mb-4">
            {content}
          </p>
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
          images,
          currentImageIndex,
        }}
      />
    </>
  );
} 