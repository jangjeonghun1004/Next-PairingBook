'use client';

import { Heart, MessageCircle, ArrowRight, User, Flag, Shield, X, MoreHorizontal, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "./Logo";

interface DiscussionCardProps {
  id: number;
  title: string;
  content: string;
  author: string;
  bookTitle: string;
  bookAuthor: string;
  timeAgo: string;
  likes: number;
  comments: number;
  tags: string[];
  images?: string[];
}

export default function DiscussionCard({
  id,
  title,
  content,
  author,
  bookTitle,
  bookAuthor,
  timeAgo,
  likes,
  comments,
  tags,
  images = [],
}: DiscussionCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (contentRef.current) {
      // 내용이 넘칠 경우 처리
    }
  }, [content]);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handlePairing = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleCardClick = () => {
    router.push(`/discussions/${id}`);
  };

  return (
    <>
      <div 
        className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-gray-800/70 transition-colors"
        onClick={handleCardClick}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center">
              <span className="text-sm font-medium">{author[0]}</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="font-medium">{author}</div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePairing();
                  }}
                  className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                >
                  팔로우
                </button>
              </div>
            </div>
          </div>
          
          {/* 좌측 더보기 메뉴 */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1.5 hover:bg-gray-700/50 rounded-full transition-colors"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
            
            {isMenuOpen && (
              <div 
                ref={menuRef}
                className="absolute top-0 right-0 w-48 bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700 py-2 z-50"
              >
                <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                  {author}
                </div>
                <button className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>프로필 보기</span>
                </button>
                <button className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  <span>신고하기</span>
                </button>
                <button className="w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>차단하기</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 이미지 또는 책 정보 */}
        {images.length > 0 ? (
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

            {/* 책 정보 오버레이 */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex flex-col">
                <span className="font-medium text-white">{bookTitle}</span>
                <span className="text-sm text-gray-300">{bookAuthor}</span>
              </div>
            </div>
            
            {/* 태그 */}
            {tags.length > 0 && (
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span key={index} className="text-xs px-2 py-1 rounded-full bg-indigo-500/30 text-white backdrop-blur-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="relative aspect-square cursor-pointer">
            <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>
            
            {/* 책 정보 오버레이 */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex flex-col">
                <span className="font-medium text-white">{bookTitle}</span>
                <span className="text-sm text-gray-300">{bookAuthor}</span>
              </div>
            </div>
            
            {/* 태그 */}
            {tags.length > 0 && (
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span key={index} className="text-xs px-2 py-1 rounded-full bg-indigo-500/30 text-white backdrop-blur-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 푸터 */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium line-clamp-1 flex-1">{title}</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/discussions/${id}`);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5 group shrink-0 ml-2"
            >
              <span>더보기</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
          <p ref={contentRef} className="text-sm text-gray-300 line-clamp-2 mb-4">
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
            <div className="text-xs text-gray-400">{timeAgo}</div>
          </div>
        </div>
      </div>

      {/* 토스트 메시지 */}
      {showToast && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="relative">
            {/* 배경 그라데이션 애니메이션 */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg blur-xl opacity-50 animate-gradient-x"></div>
            
            {/* 메시지 컨테이너 */}
            <div className="relative bg-gray-800/90 backdrop-blur-sm text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-bounce-in">
              <div className="animate-spin-slow">
                <Logo size="sm" />
              </div>
              <span className="font-medium bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                팔로우 요청이 완료되었습니다.
              </span>
              <button 
                onClick={() => setShowToast(false)}
                className="p-1 hover:bg-gray-700/50 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
          background-size: 200% 200%;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </>
  );
} 