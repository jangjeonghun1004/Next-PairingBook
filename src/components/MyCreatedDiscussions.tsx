'use client';

import { useState } from 'react';
import { BookOpen, Users, Calendar, Trash2, AlertTriangle, PenTool } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface Discussion {
  id: string;
  title: string;
  bookTitle: string;
  bookAuthor: string;
  imageUrls: string[];
  scheduledAt: string | null;
  privacy: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    image: string;
  };
  participants: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      image: string;
    };
  }>;
  participantCount: number;
  status?: string;
}

interface EmptyStateProps {
  message: string;
}

interface MyCreatedDiscussionsProps {
  discussions: Discussion[];
  onDiscussionDeleted?: (discussionId: string) => void;
}

const EmptyState = ({ message }: EmptyStateProps) => (
  <div className="text-gray-400 text-center py-8">
    <p>{message}</p>
  </div>
);

export default function MyCreatedDiscussions({ discussions, onDiscussionDeleted }: MyCreatedDiscussionsProps) {
  const [discussionToDelete, setDiscussionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTitle, setDeleteTitle] = useState('');

  // 토론 삭제 실행 함수
  const handleDeleteDiscussion = async () => {
    if (!discussionToDelete) return;
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/discussions/${discussionToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '토론 삭제 중 오류가 발생했습니다.');
      }
      
      // 성공적으로 삭제된 경우
      toast.success('토론이 삭제되었습니다.');
      
      // 부모 컴포넌트에 삭제 알림
      if (onDiscussionDeleted) {
        onDiscussionDeleted(discussionToDelete);
      }
    } catch (error: unknown) {
      console.error('토론 삭제 중 오류:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : '토론 삭제 중 오류가 발생했습니다.';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setDiscussionToDelete(null);
      setDeleteTitle('');
    }
  };

  // 삭제 확인 모달 표시 함수
  const confirmDelete = (discussion: Discussion) => {
    setDiscussionToDelete(discussion.id);
    setDeleteTitle(discussion.title);
  };

  return (
    <section className="space-y-4">
      {discussions.length === 0 ? (
        <EmptyState message="아직 작성한 토론이 없습니다." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {discussions.map((discussion) => (
            <div
              key={discussion.id}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 hover:bg-gray-800/70 transition-colors group border border-indigo-500/20"
            >
              <Link href={`/discussions/${discussion.id}`}>
                <div className="aspect-video mb-3 relative rounded-lg overflow-hidden">
                  <Image
                    src={discussion.imageUrls[0] || '/images/default-book.jpg'}
                    alt={discussion.title}
                    width={300}
                    height={169}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-2 left-2 flex gap-2">
                    <div className="text-sm font-medium bg-indigo-500/80 px-2 py-1 rounded-full">
                      {discussion.privacy === 'public' ? '공개' : '비공개'}
                    </div>
                  </div>
                </div>

                <h3 className="font-medium line-clamp-1 mb-1">{discussion.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="line-clamp-1">{discussion.bookTitle}</span>
                  <PenTool className="w-4 h-4" />
                  <span className="line-clamp-1">{discussion.bookAuthor}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{discussion.participantCount}명 참여 중</span>
                  </div>

                  {discussion.scheduledAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(discussion.scheduledAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </Link>

              <div className="mt-3 pt-3 border-t border-gray-700 flex gap-2">
                <Link
                  href={`/discussions/${discussion.id}/manage`}
                  className="flex-1 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>참여자 관리</span>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    confirmDelete(discussion);
                  }}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {discussionToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-xl font-bold">토론 삭제</h3>
            </div>
            
            <p className="mb-6 text-gray-300">
              <span className="font-bold">&quot;{deleteTitle}&quot;</span> 토론을 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며 모든 참여자 정보가 삭제됩니다.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDiscussionToDelete(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                취소
              </button>
              <button
                onClick={handleDeleteDiscussion}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>삭제 중...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>삭제</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
} 