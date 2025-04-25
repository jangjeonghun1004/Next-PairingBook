'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Trash2, AlertTriangle, Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Loading from '@/components/Loading';
import MobileHeader from '@/components/MobileHeader';
import HamburgerMenu from '@/components/HamburgerMenu';

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

interface Pagination {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export default function CommentsManagePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchComments(pagination.currentPage, pagination.pageSize);
    }
  }, [status, router, pagination.currentPage, pagination.pageSize]);

  const fetchComments = async (page: number, pageSize: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/comments/me?page=${page}&pageSize=${pageSize}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '댓글을 불러오는 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      setComments(data.comments);
      setPagination(data.pagination);
      setIsLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '댓글을 불러오는 중 오류가 발생했습니다.';
      setError(errorMessage);
      setIsLoading(false);
      toast.error(errorMessage);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setSearchQuery(''); // 페이지 변경 시 검색어 초기화
    fetchComments(newPage, pagination.pageSize);
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
      setPagination(prev => ({
        ...prev,
        totalCount: prev.totalCount - 1,
        totalPages: Math.ceil((prev.totalCount - 1) / prev.pageSize)
      }));
      
      // 현재 페이지의 모든 댓글이 삭제되었다면 이전 페이지로 이동
      if (comments.length === 1 && pagination.currentPage > 1) {
        fetchComments(pagination.currentPage - 1, pagination.pageSize);
      } else if (comments.length === 1 && pagination.currentPage === 1) {
        // 마지막 댓글이 삭제되었다면 빈 배열 설정
        setComments([]);
      }
      
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
    <div className="min-h-screen">
      <Sidebar />
      {isLoading && (<Loading />)}
      {/* Mobile Header */}
      <MobileHeader isMenuOpen={isMenuOpen} onMenuToggle={setIsMenuOpen} />

      {/* Hamburger Menu */}
      <HamburgerMenu isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} />

      <div className="flex flex-col items-center px-4 md:pl-64 pb-8 w-full">
        <div className="w-full max-w-6xl pt-20 md:pt-8">
          {/* Header */}
          <div className="flex flex-col gap-1 mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                댓글
              </span>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                관리
              </span>
            </div>
            <div className="flex flex-col sm:flex-row">
              <p className="text-gray-400 text-sm">내가 작성한 댓글을 한 눈에 확인하고 관리할 수 있습니다.</p>
            </div>
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

          {/* 에러 */}
          {!isLoading && error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
              <p className="text-red-400">{error}</p>
              <button
                onClick={() => fetchComments(pagination.currentPage, pagination.pageSize)}
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
              {filteredComments.map(comment => (
                <div
                  key={comment.id}
                  className="bg-gray-800/70 rounded-lg overflow-hidden border border-gray-700"
                >
                  <div className="flex px-4 py-3 bg-gray-800/90 border-b border-gray-700">
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

              {/* 페이지네이션 (검색 중이 아닐 때만 표시) */}
              {searchQuery.trim() === '' && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className={`p-2 rounded-lg ${
                      pagination.currentPage === 1
                        ? 'text-gray-500 cursor-not-allowed'
                        : 'text-gray-200 hover:bg-gray-700'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum: number;
                      
                      if (pagination.totalPages <= 5) {
                        // 5페이지 이하면 모든 페이지 표시
                        pageNum = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        // 현재 페이지가 3 이하면 1~5 표시
                        pageNum = i + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        // 현재 페이지가 마지막에서 2페이지 이내면 마지막 5페이지 표시
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        // 그 외의 경우 현재 페이지 중심으로 2개씩 앞뒤로 표시
                        pageNum = pagination.currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                            pagination.currentPage === pageNum
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className={`p-2 rounded-lg ${
                      pagination.currentPage === pagination.totalPages
                        ? 'text-gray-500 cursor-not-allowed'
                        : 'text-gray-200 hover:bg-gray-700'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
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