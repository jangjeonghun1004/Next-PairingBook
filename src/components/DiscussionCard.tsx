'use client';

import { PenTool, Heart, MessageCircle, ArrowRight, User, Flag, Shield, X, MoreHorizontal, ChevronLeft, ChevronRight, BookOpen, Globe, Lock, Users, Calendar } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "./Logo";
import { timeAgo } from "@/lib/utils";

// 공개 설정 타입
type PrivacyType = 'public' | 'private' | 'invitation';

interface DiscussionCardProps {
  id: string;
  title: string;
  author: string;
  bookTitle: string;
  bookAuthor: string;
  createdAt: string;
  likes: number;
  comments: number;
  tags: string[];
  privacy?: PrivacyType;
  scheduledAt?: string;
  currentParticipants?: number;
  maxParticipants?: number;
}

export default function DiscussionCard({
  id,
  title,
  author,
  bookTitle,
  bookAuthor,
  createdAt,
  likes,
  comments,
  tags,
  privacy,
  scheduledAt,
  currentParticipants,
  maxParticipants,
}: DiscussionCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const handlePairing = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // 토론 참여하기 버튼 핸들러
  const handleJoinDiscussion = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/discussions/${id}`);
  };

  // 공개 설정에 따른 배지 렌더링
  const renderPrivacyBadge = () => {
    if (!privacy) return null;

    switch (privacy) {
      case 'public':
        return (
          <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-black/60 border border-green-400/50 text-green-300 backdrop-blur-sm shadow-md">
            <Globe className="w-3 h-3" />
            <span>공개</span>
          </div>
        );
      case 'private':
        return (
          <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-black/60 border border-yellow-400/50 text-yellow-300 backdrop-blur-sm shadow-md">
            <Lock className="w-3 h-3" />
            <span>비공개</span>
          </div>
        );
      case 'invitation':
        return (
          <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-black/60 border border-blue-400/50 text-blue-300 backdrop-blur-sm shadow-md">
            <Users className="w-3 h-3" />
            <span>초대</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div
        className="w-full h-full flex flex-col cursor-pointer hover:shadow-lg transition-shadow rounded-lg overflow-hidden"
      >
        <div className="flex flex-col md:flex-row h-full">
          {/* 좌측 메타데이터 영역 (토론 정보 섹션) */}
          <div className="w-full md:w-36 md:flex-shrink-0 flex flex-row md:flex-col justify-between gap-2 order-1 md:order-1 mb-2 md:mb-0">
            {/* 토론 정보 섹션 */}
            <div className="w-full h-auto md:h-full flex flex-row md:flex-col bg-gray-800/70 rounded-lg shadow-md overflow-hidden">
              {/* 토론 예정 날짜 */}
              {scheduledAt && (
                <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-3 md:h-1/2 md:border-b border-r md:border-r-0 border-gray-700/50">
                  <div className="flex items-center gap-1.5 mb-1 md:mb-2">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 text-indigo-400" />
                    <span className="text-xs font-medium text-gray-300">토론 예정</span>
                  </div>
                  <span className="text-[10px] md:text-xs text-center text-indigo-300 line-clamp-1 md:line-clamp-none">
                    {new Date(scheduledAt).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}

              {/* 참가자 정보 */}
              {currentParticipants !== undefined && maxParticipants !== undefined && (
                <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-3 md:h-1/2">
                  <div className="flex items-center gap-1.5 mb-1 md:mb-2">
                    <Users className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-300">참여 현황</span>
                  </div>
                  <div className="w-full flex flex-col items-center">
                    <span className="text-[10px] md:text-xs text-center text-gray-200 mb-1">{currentParticipants}/{maxParticipants} 참여중</span>
                    <div className="w-full h-1 bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{
                          width: `${(currentParticipants / maxParticipants) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 콘텐츠 섹션 */}
          <div className="flex-1 flex flex-col md:pl-8 md:h-full bg-gray-800/50 backdrop-blur-sm overflow-hidden hover:bg-gray-800/70 transition-colors order-2 md:order-2 rounded-lg">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-700/50">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center">
                  <span className="text-xs md:text-sm font-medium">{author[0]}</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 md:gap-2">
                    <div className="text-sm md:font-medium truncate max-w-[100px] md:max-w-none">{author}</div>
                    <span className="text-gray-400">·</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePairing();
                      }}
                      className="text-xs text-indigo-400 transition-colors"
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
                  <MoreHorizontal className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                </button>

                {isMenuOpen && (
                  <div
                    ref={menuRef}
                    className="absolute top-0 right-0 w-40 md:w-48 bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700 py-2 z-50"
                  >
                    <div className="px-4 py-2 text-xs md:text-sm text-gray-300 border-b border-gray-700 truncate">
                      {author}
                    </div>
                    <button className="w-full px-4 py-2 text-xs md:text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-2">
                      <User className="w-3 h-3 md:w-4 md:h-4" />
                      <span>프로필 보기</span>
                    </button>
                    <button className="w-full px-4 py-2 text-xs md:text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-2">
                      <Flag className="w-3 h-3 md:w-4 md:h-4" />
                      <span>신고하기</span>
                    </button>
                    <button className="w-full px-4 py-2 text-xs md:text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-2">
                      <Shield className="w-3 h-3 md:w-4 md:h-4" />
                      <span>차단하기</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 본문 */}
            <div className="p-3 md:p-4 flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base md:text-lg font-medium line-clamp-1 flex-1">{title}</h3>
              </div>

              {/* 태그와 공개 설정 */}
              <div className="flex flex-wrap gap-1.5 md:gap-2 items-center mb-3">
                {/* 공개 설정 배지 */}
                {privacy && renderPrivacyBadge()}

                {/* 책 정보 */}
                <div className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-indigo-500/50 text-white">
                  <BookOpen className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  <span className="truncate max-w-[80px] md:max-w-[150px]">{bookTitle}</span>
                </div>
                <div className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-indigo-500/50 text-white">
                  <PenTool className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  <span className="truncate max-w-[80px] md:max-w-[150px]">{bookAuthor}</span>
                </div>

                {/* 태그 */}
                {tags.length > 0 && tags.map((tag, index) => (
                  <span key={index} className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-indigo-500/30 text-white">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 푸터 */}
            <div className="p-3 md:p-4 border-t border-gray-700/50 flex flex-col gap-2 md:gap-3">
              <div className="flex items-center gap-3 md:gap-4 text-gray-400">
                <div className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm">{likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm">{comments}</span>
                </div>
                <div className="text-[10px] md:text-xs text-gray-400">{timeAgo(createdAt)}</div>
              </div>
              <button
                onClick={handleJoinDiscussion}
                className="w-full min-h-[36px] md:min-h-[40px] py-1.5 md:py-2 px-3 md:px-4 bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/40 active:bg-indigo-600/50 rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-manipulation relative overflow-hidden group"
                aria-label="토론 참여하기"
              >
                <span className="relative z-10 text-xs md:text-sm font-medium">토론 참여하기</span>
                <ArrowRight className="relative z-10 w-3.5 h-3.5 md:w-4 md:h-4 transition-transform group-hover:translate-x-0.5 group-active:translate-x-1" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity"></div>
              </button>
            </div>
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
    </>
  );
} 