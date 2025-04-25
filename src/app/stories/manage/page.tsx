'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Trash2, Search, X, Check, AlertTriangle, ChevronLeft, ChevronRight, Heart, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Loading from '@/components/Loading';
import MobileHeader from '@/components/MobileHeader';
import HamburgerMenu from '@/components/HamburgerMenu';
import Sidebar from '@/components/Sidebar';

// 이야기 타입 정의
interface Story {
  id: string;
  title: string;
  content: string;
  category: string;
  image_urls: string[];
  likes: number;
  commentCount: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    image: string;
  };
}

export default function StoryManagePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchMyStories();
    }
  }, [status, router]);

  // 검색어에 따른 필터링 - content만 검색
  useEffect(() => {
    if (searchQuery.trim() === '') {
      applyPagination(stories);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = stories.filter(story =>
        story.content.toLowerCase().includes(query)
      );
      applyPagination(filtered);
    }
  }, [searchQuery, stories, currentPage]);

  // 페이지 변경시 효과
  useEffect(() => {
    if (searchQuery.trim() === '') {
      applyPagination(stories);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = stories.filter(story =>
        story.content.toLowerCase().includes(query)
      );
      applyPagination(filtered);
    }
  }, [currentPage]);

  // 전체 선택 토글
  useEffect(() => {
    if (selectAll) {
      const allIds = new Set(filteredStories.map(story => story.id));
      setSelectedStories(allIds);
    } else if (selectedStories.size === filteredStories.length && filteredStories.length > 0) {
      // 자동으로 전체 선택된 경우 체크박스 상태 업데이트
      setSelectAll(true);
    }
  }, [selectAll, filteredStories]);

  // 페이지네이션 적용
  const applyPagination = (storiesToPaginate: Story[]) => {
    // 전체 페이지 계산
    const totalItems = storiesToPaginate.length;
    const calculatedTotalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    setTotalPages(calculatedTotalPages || 1);

    // 현재 페이지가 유효한지 확인
    const validCurrentPage = Math.min(currentPage, calculatedTotalPages || 1);
    if (validCurrentPage !== currentPage) {
      setCurrentPage(validCurrentPage);
    }

    // 현재 페이지에 해당하는 스토리만 추출
    const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedStories = storiesToPaginate.slice(startIndex, endIndex);

    setFilteredStories(paginatedStories);
  };

  const fetchMyStories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stories/my');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '이야기를 불러오는 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      setStories(data);

      // 페이지네이션 적용
      applyPagination(data);

      setIsLoading(false);
      setError(null);
    } catch (error: unknown) {
      console.error('이야기 불러오기 오류:', error);
      setIsLoading(false);
      const errorMessage = error instanceof Error
        ? error.message
        : '이야기를 불러오는 중 오류가 발생했습니다.';
      setError(errorMessage);
    }
  };

  const deleteStory = async (storyId: string) => {
    try {
      setSelectedStory(storyId);

      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '이야기를 삭제하는 중 오류가 발생했습니다.');
      }

      // 성공적으로 삭제됨
      const updatedStories = stories.filter(story => story.id !== storyId);
      setStories(updatedStories);

      // 현재 페이지 재계산
      applyPagination(updatedStories);

      toast.success('이야기가 삭제되었습니다.');
      setDeleteConfirm(null);

      // 선택된 이야기 목록에서도 제거
      if (selectedStories.has(storyId)) {
        const newSelectedStories = new Set(selectedStories);
        newSelectedStories.delete(storyId);
        setSelectedStories(newSelectedStories);
      }
    } catch (error: unknown) {
      console.error('이야기 삭제 오류:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : '이야기를 삭제하는 중 오류가 발생했습니다.';
      toast.error(errorMessage);
    } finally {
      setSelectedStory(null);
    }
  };

  // 선택된 모든 이야기 삭제 - 최적화: 10개씩 나눠서 처리
  const deleteSelectedStories = async () => {
    if (selectedStories.size === 0) return;

    try {
      setIsLoading(true);

      const selectedIds = Array.from(selectedStories);
      const batchSize = 5; // 한 번에 처리할 삭제 요청 수
      let deletedCount = 0;
      let failedCount = 0;

      // 배치 단위로 처리
      for (let i = 0; i < selectedIds.length; i += batchSize) {
        const batch = selectedIds.slice(i, i + batchSize);

        const batchPromises = batch.map(storyId =>
          fetch(`/api/stories/${storyId}`, { method: 'DELETE' })
            .then(response => {
              if (!response.ok) throw new Error(`${storyId} 삭제 실패`);
              return storyId;
            })
            .catch(error => {
              console.error(`ID: ${storyId} 삭제 중 오류:`, error);
              return null;
            })
        );

        const batchResults = await Promise.all(batchPromises);

        // 성공적으로 삭제된 ID와 실패한 요청 집계
        const successfulIds = batchResults.filter(Boolean) as string[];
        deletedCount += successfulIds.length;
        failedCount += batchResults.filter(id => id === null).length;

        // 각 배치마다 UI 업데이트
        if (successfulIds.length > 0) {
          setStories(prev => prev.filter(story => !successfulIds.includes(story.id)));
        }
      }

      // 알림 표시
      if (deletedCount > 0) {
        toast.success(`${deletedCount}개의 이야기가 삭제되었습니다.`);
      }

      if (failedCount > 0) {
        toast.error(`${failedCount}개의 이야기 삭제에 실패했습니다.`);
      }

      // 현재 필터링된 스토리에 페이지네이션 다시 적용
      const updatedFilteredStories = searchQuery.trim() === ''
        ? stories
        : stories.filter(story => story.content.toLowerCase().includes(searchQuery.toLowerCase()));

      applyPagination(updatedFilteredStories);

      // 선택 목록 초기화
      setSelectedStories(new Set());
      setSelectAll(false);
      setBatchDeleteConfirm(false);

    } catch (error) {
      console.error('이야기 일괄 삭제 오류:', error);
      toast.error('이야기 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 선택 토글
  const toggleSelect = (storyId: string) => {
    const newSelectedStories = new Set(selectedStories);

    if (newSelectedStories.has(storyId)) {
      newSelectedStories.delete(storyId);
      setSelectAll(false);
    } else {
      newSelectedStories.add(storyId);

      // 모든 항목이 선택되었는지 확인
      if (newSelectedStories.size === filteredStories.length) {
        setSelectAll(true);
      }
    }

    setSelectedStories(newSelectedStories);
  };

  // 전체 선택 토글
  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    if (newSelectAll) {
      const allIds = new Set(filteredStories.map(story => story.id));
      setSelectedStories(allIds);
    } else {
      setSelectedStories(new Set());
    }
  };

  // 페이지 변경 함수
  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // 페이지 변경 시 전체 선택 초기화
      setSelectAll(false);
      setSelectedStories(new Set());
    }
  };

  // 검색어 지우기
  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1); // 검색어 초기화 시 첫 페이지로 돌아감
  };

  // 시간 경과 표시 함수
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval}년 전`;

    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}개월 전`;

    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}일 전`;

    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}시간 전`;

    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}분 전`;

    return `${Math.floor(seconds)}초 전`;
  };

  if (isLoading && stories.length === 0) {
    return (
      <Loading />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto py-10">
          <div className="text-red-400 text-center">
            <p>{error}</p>
            <button
              onClick={fetchMyStories}
              className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
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
                이야기
              </span>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                관리
              </span>
            </div>
            <div className="flex flex-col sm:flex-row">
              <p className="text-gray-400 text-sm">내가 작성한 이야기를 한 눈에 확인하고 관리할 수 있습니다.</p>
            </div>
          </div>

          {/* 검색 및 일괄 삭제 UI */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="내용으로 검색..."
                className="w-full pl-10 pr-10 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // 검색어 변경 시 첫 페이지로 돌아감
                }}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-white" />
                </button>
              )}
            </div>
            {selectedStories.size > 0 && (
              <button
                onClick={() => setBatchDeleteConfirm(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                <span>{selectedStories.size}개 삭제</span>
              </button>
            )}
          </div>

          {/* 페이지네이션 정보 */}
          {stories.length > 0 && (
            <div className="text-sm text-gray-400 mb-4">
              전체 {stories.length}개 중 {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
              {Math.min(currentPage * ITEMS_PER_PAGE, stories.length)}개 표시
            </div>
          )}

          {/* 이야기 목록 */}
          {filteredStories.length === 0 ? (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 text-center">
              {searchQuery ? (
                <p className="text-gray-400 mb-4">검색 결과가 없습니다.</p>
              ) : (
                <p className="text-gray-400 mb-4">아직 작성한 이야기가 없습니다.</p>
              )}
              {!searchQuery && (
                <Link
                  href="/stories/new"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-block"
                >
                  첫 이야기 작성하기
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* 전체 선택 헤더 */}
              <div className="flex items-center px-4 py-2 bg-gray-800/30 rounded-lg">
                <div className="flex items-center mr-4">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="select-all" className="ml-2 text-sm text-gray-300 cursor-pointer">
                    전체 선택
                  </label>
                </div>
                <div className="text-sm text-gray-400">
                  {selectedStories.size > 0 ? `${selectedStories.size}/${filteredStories.length}개 선택됨` : `현재 페이지 ${filteredStories.length}개의 이야기`}
                </div>
              </div>

              {filteredStories.map((story) => (
                <div key={story.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                  <div className="flex gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`select-${story.id}`}
                        checked={selectedStories.has(story.id)}
                        onChange={() => toggleSelect(story.id)}
                        className="w-4 h-4 accent-indigo-500 cursor-pointer"
                      />
                    </div>

                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={story.image_urls[0] || '/images/default-story.jpg'}
                        alt={story.title}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{timeAgo(story.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <div className="flex items-center gap-1">
                          <span>{story.content}</span>
                        </div>
                      </div>

                      <div className="mt-2 flex gap-2 text-sm">
                        <div className="bg-gray-700/50 px-2 py-1 rounded flex items-center gap-1">
                          <Heart className="w-3 h-3" /> {story.likes}
                        </div>
                        <div className="bg-gray-700/50 px-2 py-1 rounded flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> {story.commentCount}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center items-end">
                      <button
                        onClick={() => setDeleteConfirm(story.id)}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm flex items-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>삭제</span>
                      </button>
                    </div>
                  </div>

                  {/* 삭제 확인 모달 */}
                  {deleteConfirm === story.id && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-auto">
                        <div className="flex items-center gap-3 mb-4 text-amber-400">
                          <AlertTriangle className="w-6 h-6" />
                          <h3 className="text-xl font-semibold">이야기 삭제 확인</h3>
                        </div>
                        <p className="mb-6">&apos;{story.content}&lsquo;을(를) 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                          >
                            취소
                          </button>
                          <button
                            onClick={() => deleteStory(story.id)}
                            disabled={selectedStory === story.id}
                            className={`px-4 py-2 flex items-center gap-2 ${selectedStory === story.id ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} rounded-lg transition-colors`}
                          >
                            {selectedStory === story.id ? '삭제 중...' : '삭제'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* 페이지네이션 컨트롤 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 gap-2">
                  <button
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:bg-gray-700'
                      }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // 현재 페이지를 중심으로 최대 5개의 페이지 번호 표시
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => changePage(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded-md ${currentPage === pageNum
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
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:bg-gray-700'
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

      {/* 일괄 삭제 확인 모달 */}
      {batchDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-xl font-semibold">일괄 삭제 확인</h3>
            </div>
            <p className="mb-2">선택한 {selectedStories.size}개의 이야기를 정말 삭제하시겠습니까?</p>
            <p className="mb-6 text-amber-400">이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBatchDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                취소
              </button>
              <button
                onClick={deleteSelectedStories}
                disabled={isLoading}
                className={`px-4 py-2 flex items-center gap-2 ${isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} rounded-lg transition-colors`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    확인
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