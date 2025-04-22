'use client';

import { Heart, MessageCircle, ArrowRight, User, Flag, Shield, X, MoreHorizontal } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import StoryDetailModal from "./StoryDetailModal";
import Logo from "./Logo";
import Image from "next/image";

interface StoryCardProps {
  id: string;
  author: string;
  authorImage: string;
  authorId: string;
  timeAgo: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  category: string;
  images: string[];
  hideFollowButton?: boolean;
}

export default function StoryCard({
  id,
  author,
  authorImage,
  authorId,
  timeAgo,
  title,
  content,
  likes,
  comments,
  category,
  images,
  hideFollowButton = false,
}: StoryCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLParagraphElement>(null);

  // 초기 팔로우 상태 확인
  useEffect(() => {
    if (!hideFollowButton && authorId) {
      checkFollowStatus();
    }
  }, [hideFollowButton, authorId]);

  // 팔로우 상태 확인 함수
  const checkFollowStatus = async () => {
    try {
      const response = await fetch(`/api/users/follow?followingId=${authorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error('팔로우 상태 확인 중 오류 발생:', error);
    }
  };

  // 콘텐츠 오버플로우 확인
  useEffect(() => {
    if (contentRef.current) {
      const element = contentRef.current;
      // 텍스트가 2줄을 초과하는지 확인
      const lineHeight = parseInt(getComputedStyle(element).lineHeight);
      const maxHeight = lineHeight * 2; // 2줄
      setHasOverflow(element.scrollHeight > maxHeight);
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

  // 팔로우/언팔로우 토글 함수
  const handleFollowToggle = async () => {
    if (!authorId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/users/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ followingId: authorId })
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);

        // 팔로우/언팔로우 성공 메시지 표시
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 3000);
      }
    } catch (error) {
      console.error('팔로우 상태 변경 중 오류 발생:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleContentDisplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFullContent(!showFullContent);
  };

  return (
    <>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-gray-800/70 transition-colors">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center">
              {authorImage ? (
                <Image
                  src={authorImage}
                  alt={'작성자'}
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium">{author[0]}</span>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="font-medium">{author}</div>
                {!hideFollowButton && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={isLoading}
                    className={`text-xs px-2 py-0.5 rounded-full transition-colors ${isFollowing
                        ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
                      }`}
                  >
                    {isLoading ? '로딩 중...' : isFollowing ? '팔로잉' : '팔로우'}
                  </button>
                )}
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
                  className={`w-1.5 h-1.5 rounded-full transition-all ${index === currentImageIndex
                      ? "bg-white w-2.5"
                      : "bg-white/50"
                    }`}
                />
              ))}
            </div>
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
          <div className="text-sm text-gray-300 mb-4">
            <p 
              ref={contentRef} 
              className={showFullContent ? "" : "line-clamp-2"}
            >
              {content}
            </p>
            {hasOverflow && (
              <button
                onClick={toggleContentDisplay}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-1 flex items-center gap-0.5"
              >
                <span>{showFullContent ? "접기" : "더보기"}</span>
                {!showFullContent && <ArrowRight className="w-3 h-3" />}
              </button>
            )}
          </div>
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
                {isFollowing ? '팔로우 되었습니다.' : '팔로우가 취소되었습니다.'}
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

      {/* 상세 모달 */}
      <StoryDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        story={{
          id,
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