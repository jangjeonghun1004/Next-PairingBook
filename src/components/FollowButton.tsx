'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { UserPlus, UserCheck } from "lucide-react";

interface FollowButtonProps {
  followingId: string;
  followingName?: string;
  className?: string;
  variant?: 'text' | 'compact' | 'full';
  onFollowChange?: (isFollowing: boolean) => void;
  showIcon?: boolean;
}

export default function FollowButton({
  followingId,
  followingName = '익명',
  className = '',
  variant = 'text',
  onFollowChange,
  showIcon = false
}: FollowButtonProps) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // followingId가 빈 문자열이거나 'unknown-'으로 시작하는 ID인 경우 처리
  const isValidFollowingId = followingId && !followingId.startsWith('unknown-');

  // 세션 디버깅
  useEffect(() => {
    console.log('Session in FollowButton:', session);
    console.log('User ID in FollowButton:', session?.user?.id);
    console.log('Following ID in FollowButton:', followingId);
    console.log('Is valid following ID:', isValidFollowingId);
  }, [session, followingId, isValidFollowingId]);

  // 팔로우 상태 확인
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!session?.user || !isValidFollowingId) return;

      // 자신을 팔로우할 수 없음
      if (session.user.id === followingId) return;

      try {
        setIsFollowLoading(true);
        const response = await fetch(`/api/users/follow?followingId=${followingId}`);

        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
          onFollowChange?.(data.isFollowing);
        }
      } catch (error) {
        console.error("팔로우 상태 확인 중 오류:", error);
      } finally {
        setIsFollowLoading(false);
      }
    };

    checkFollowStatus();
  }, [session?.user, followingId, onFollowChange, isValidFollowingId]);

  // 팔로우 토글 핸들러
  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // 링크 이동 방지
    e.stopPropagation(); // 부모 컴포넌트로의 이벤트 전파 방지

    if (!session?.user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    if (!isValidFollowingId) {
      toast.error("사용자 정보를 찾을 수 없습니다.");
      return;
    }

    // 자신을 팔로우할 수 없음
    if (session.user.id === followingId) {
      toast.error("자신을 팔로우할 수 없습니다.");
      return;
    }

    setIsFollowLoading(true);

    try {
      const response = await fetch('/api/users/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ followingId }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsFollowing(data.isFollowing);
        onFollowChange?.(data.isFollowing);
        toast.success(data.isFollowing
          ? `${followingName}님을 팔로우합니다.`
          : `${followingName}님 팔로우를 취소했습니다.`
        );
      } else {
        toast.error(data.error || "팔로우 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("팔로우 처리 중 오류:", error);
      toast.error("팔로우 처리 중 오류가 발생했습니다.");
    } finally {
      setIsFollowLoading(false);
    }
  };

  // 현재 사용자가 팔로우하려는 대상과 같은 경우 또는 유효하지 않은 ID인 경우 버튼 숨김
  if (session?.user?.id === followingId || !isValidFollowingId) {
    return null;
  }

  // 버튼 스타일 및 내용 결정
  const getButtonStyles = () => {
    const baseStyles = `transition-all cursor-pointer pl-2 ${
      isFollowLoading ? "opacity-50 cursor-not-allowed" : ""
    } ${className}`;
    
    switch (variant) {
      case 'compact':
        return `${baseStyles} text-xs px-2 py-1 rounded-full flex items-center gap-1.5 ${
          isFollowing 
            ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/10" 
            : "bg-gray-700/50 text-gray-300 hover:bg-indigo-500/20 hover:text-indigo-300 border border-gray-600/30"
        }`;
      case 'full':
        return `${baseStyles} flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg ${
          isFollowing 
            ? "bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/20" 
            : "bg-gray-700/70 text-white hover:bg-indigo-600/30 hover:text-indigo-300"
        }`;
      case 'text':
      default:
        return `${baseStyles} text-xs flex items-center gap-1 ${
        //   isFollowing ? "text-gray-300 hover:text-indigo-300" : "text-indigo-400 hover:text-indigo-300"
        "text-indigo-400 hover:text-indigo-300"
        }`;
    }
  };

  return (
    <button
      onClick={handleFollowToggle}
      disabled={isFollowLoading}
      className={getButtonStyles()}
      aria-label={isFollowing ? `${followingName} 팔로우 취소` : `${followingName} 팔로우`}
    >
      {isFollowLoading ? (
        <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      ) : (
        <>
          {showIcon && (
            isFollowing ? 
              <UserCheck className="w-4 h-4" /> : 
              <UserPlus className="w-4 h-4" />
          )}
          <span>{isFollowing ? "팔로잉" : "팔로우"}</span>
        </>
      )}
    </button>
  );
} 