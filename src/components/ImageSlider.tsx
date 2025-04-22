'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageSliderProps {
  images: string[];
  imageLayout: 'portrait' | 'landscape' | 'square';
  title: string;
}

export default function ImageSlider({ images, imageLayout, title }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 이미지가 없으면 빈 컨테이너 반환
  if (!images || images.length === 0) {
    return (
      <div className={`bg-gray-800 ${getAspectRatioClass(imageLayout)}`}></div>
    );
  }

  // 한 장의 이미지만 있는 경우
  if (images.length === 1) {
    return (
      <div className={`relative ${getAspectRatioClass(imageLayout)} overflow-hidden`}>
        <img
          src={images[0]}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // 이전 이미지로 이동
  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prevIndex => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  // 다음 이미지로 이동
  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prevIndex => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  // 이미지 영역 클릭
  const handleImageClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;

    if (isLeftHalf) {
      goToPrevious(e);
    } else {
      goToNext(e);
    }
  };

  return (
    <div 
      className={`relative ${getAspectRatioClass(imageLayout)} overflow-hidden cursor-pointer group`}
      onClick={handleImageClick}
    >
      {/* 현재 이미지 */}
      <img
        src={images[currentIndex]}
        alt={`${title} - 이미지 ${currentIndex + 1}/${images.length}`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* 이미지 인디케이터 (점) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {images.map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              index === currentIndex
                ? "bg-white w-2.5"
                : "bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* 이전 버튼 */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* 다음 버튼 */}
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* 클릭 영역 가이드 (호버 시 표시) */}
      <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// 이미지 레이아웃에 따른 종횡비 클래스 반환 함수
function getAspectRatioClass(imageLayout: string): string {
  switch (imageLayout) {
    case 'portrait':
      return 'aspect-[3/4]';
    case 'landscape':
      return 'aspect-[4/3]';
    case 'square':
    default:
      return 'aspect-square';
  }
} 