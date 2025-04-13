'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Trash2, ExternalLink, AlertTriangle, Search, FileText } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import SearchModal from '@/components/SearchModal';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  story: {
    id: string;
    title: string;
    image_urls: string[];
  };
}

export default function CommentsManagePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchComments();
    }
  }, [status, router]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/comments/me');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '댓글을 불러오는 중 오류가 발생했습니다.');
      }
      
      const data = await response.json();
      setComments(data);
      setIsLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '댓글을 불러오는 중 오류가 발생했습니다.';
      setError(errorMessage);
      setIsLoading(false);
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      setIsDeleting(commentId);
      
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '댓글 삭제 중 오류가 발생했습니다.');
      }
      
      // UI에서 삭제된 댓글 제거
      setComments(comments.filter(comment => comment.id !== commentId));
      toast.success('댓글이 삭제되었습니다.');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '댓글 삭제 중 오류가 발생했습니다.';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(null);
      setShowDeleteModal(null);
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 검색 필터링 함수
  const filteredComments = searchQuery.trim() === ''
    ? comments
    : comments.filter(comment => 
        comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comment.story.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Sidebar onSearchClick={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <div className="md:pl-64 p-6">
        <div className="max-w-5xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/myhome"
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>마이홈으로 돌아가기</span>
              </Link>
            </div>
            <h1 className="text-2xl font-bold mb-2">내 댓글 관리</h1>
            <p className="text-gray-400">내가 작성한 댓글을 한 눈에 확인하고 관리할 수 있습니다.</p>
          </div>

          {/* 검색 바 */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="댓글 내용이나 이야기 제목으로 검색"
              className="w-full bg-gray-800/70 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* 로딩 중 */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
              </div>
            </div>
          )}

          {/* 에러 */}
          {!isLoading && error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchComments}
                className="mt-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 댓글이 없을 때 */}
          {!isLoading && !error && filteredComments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-gray-600 mb-4" />
              {searchQuery.trim() === '' ? (
                <>
                  <h3 className="text-lg font-medium mb-2">작성한 댓글이 없습니다</h3>
                  <p className="text-gray-400 mb-4">이야기에 댓글을 작성하면 여기에 표시됩니다.</p>
                  <Link
                    href="/stories"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    이야기 둘러보기
                  </Link>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium mb-2">검색 결과가 없습니다</h3>
                  <p className="text-gray-400">다른 검색어로 시도해 보세요.</p>
                </>
              )}
            </div>
          )}

          {/* 댓글 목록 */}
          {!isLoading && !error && filteredComments.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">총 {filteredComments.length}개의 댓글</p>
              
              {filteredComments.map(comment => (
                <div
                  key={comment.id}
                  className="bg-gray-800/70 rounded-lg overflow-hidden border border-gray-700"
                >
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-800/90 border-b border-gray-700">
                    <Link
                      href={`/stories/${comment.story.id}`}
                      className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <span className="font-medium line-clamp-1">{comment.story.title}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <div className="text-xs text-gray-400">{formatDate(comment.createdAt)}</div>
                  </div>
                  
                  <div className="p-4 flex">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-200 whitespace-pre-line">{comment.content}</p>
                    </div>
                    
                    <div className="ml-3 flex-shrink-0">
                      <button
                        onClick={() => setShowDeleteModal(comment.id)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-xl font-bold">댓글 삭제</h3>
            </div>
            
            <p className="mb-6 text-gray-300">
              정말로 이 댓글을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                disabled={isDeleting !== null}
              >
                취소
              </button>
              <button
                onClick={() => showDeleteModal && handleDelete(showDeleteModal)}
                disabled={isDeleting !== null}
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
                    <span>삭제하기</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 