'use client';
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Filter, Search, Calendar, Users, Globe, Lock, BookOpen, SlidersHorizontal } from "lucide-react";
import Image from "next/image";

// Components
import HamburgerMenu from "@/components/HamburgerMenu";
import SearchModal from "@/components/SearchModal";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/Sidebar";
import NewPostButton from "@/components/NewPostButton";
import DiscussionCard from "@/components/DiscussionCard";
import Loading from "@/components/Loading";
import Logo from "@/components/Logo";

// Types
type PrivacyType = 'public' | 'private' | 'invitation' | 'all';

interface Author {
  name: string | null;
  image: string | null;
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  author: Author;
  bookTitle: string;
  bookAuthor: string;
  createdAt: string;
  likes: number;
  comments: number;
  tags: string[];
  imageUrls: string[];
  scheduledAt?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  privacy?: PrivacyType;
}

// Filter State Interface
interface FilterState {
  searchQuery: string;
  privacy: PrivacyType;
  dateFilter: string;
  participantRange: [number, number];
  sortBy: string;
}

// Initial filter state
const initialFilterState: FilterState = {
  searchQuery: "",
  privacy: "all",
  dateFilter: "",
  participantRange: [0, 50],
  sortBy: "최신순"
};

export default function DiscussionsPage() {
  // UI State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Data State
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Filter State (consolidated)
  const [filters, setFilters] = useState<FilterState>(initialFilterState);

  // Refs
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  // Fetch discussions - Memoized with useCallback
  const fetchDiscussions = useCallback(async (pageNum: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/discussions?page=${pageNum}`);

      if (!response.ok) {
        throw new Error('토론 목록을 불러오는 중 오류가 발생했습니다.');
      }

      const data = await response.json();

      // API 응답 타입 정의
      interface ApiDiscussion {
        id: string;
        title: string;
        content: string;
        author?: {
          name?: string | null;
          image?: string | null;
        };
        bookTitle: string;
        bookAuthor: string;
        createdAt: string;
        likes?: number;
        comments?: number;
        tags?: string[];
        imageUrls?: string[];
        scheduledAt?: string;
        maxParticipants?: number;
        currentParticipants?: number;
        privacy?: PrivacyType;
      }

      // Map API response to Discussion interface
      const formattedDiscussions = data.discussions.map((discussion: ApiDiscussion) => ({
        id: discussion.id,
        title: discussion.title,
        content: discussion.content,
        author: {
          name: discussion.author?.name || '익명',
          image: discussion.author?.image || null
        },
        bookTitle: discussion.bookTitle,
        bookAuthor: discussion.bookAuthor,
        createdAt: discussion.createdAt,
        likes: discussion.likes || 0,
        comments: discussion.comments || 0,
        tags: discussion.tags || [],
        imageUrls: discussion.imageUrls || [],
        scheduledAt: discussion.scheduledAt,
        maxParticipants: discussion.maxParticipants,
        currentParticipants: discussion.currentParticipants || 0,
        privacy: discussion.privacy
      }));

      // 중요 변경: 페이지가 0일 때는 이전 상태를 덮어쓰기(새로운 배열 설정)
      // 페이지가 0보다 크면 이전 상태에 추가
      if (pageNum === 0) {
        setDiscussions(formattedDiscussions);
      } else {
        setDiscussions(prev => [...prev, ...formattedDiscussions]);
      }

      setHasMore(data.hasMore);
    } catch (error) {
      console.error('토론 목록 로드 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load more discussions - Memoized with useCallback
  const loadMoreDiscussions = useCallback(() => {
    if (isLoading || !hasMore) return;

    const nextPage = page + 1;
    setPage(nextPage);
    fetchDiscussions(nextPage);
  }, [isLoading, hasMore, page, fetchDiscussions]);

  // Init effect - Only runs once on mount
  useEffect(() => {
    setIsClient(true);
    fetchDiscussions(0); // 초기 로드는 항상 페이지 0으로
  }, [fetchDiscussions]);

  // Observer effect - For infinite scrolling
  useEffect(() => {
    if (!isClient) return;

    const options = {
      root: null,
      rootMargin: '20px',
      threshold: 1.0
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [target] = entries;
      if (target.isIntersecting && !isLoading) {
        loadMoreDiscussions();
      }
    }, options);

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isLoading, isClient, loadMoreDiscussions]);

  // Filter handlers
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // 필터가 변경되면 페이지를 0으로 리셋하고 데이터를 다시 불러옴
    setPage(0);
    fetchDiscussions(0);
  };

  const resetFilters = () => {
    setFilters(initialFilterState);
    // 필터 초기화 시 페이지를 0으로 리셋하고 데이터를 다시 불러옴
    setPage(0);
    fetchDiscussions(0);
  };

  // Handle participant range change
  const handleParticipantRangeChange = (value: number, index: number) => {
    const newRange = [...filters.participantRange] as [number, number];
    newRange[index] = value;

    // Ensure min doesn't exceed max and vice versa
    if (index === 0 && value > newRange[1]) {
      newRange[1] = value;
    } else if (index === 1 && value < newRange[0]) {
      newRange[0] = value;
    }

    updateFilter('participantRange', newRange as [number, number]);
  };

  // Filter discussions
  const filteredDiscussions = discussions.filter(discussion => {
    // Search filter
    if (filters.searchQuery && !(
      discussion.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      discussion.content.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      discussion.bookTitle.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      discussion.bookAuthor.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      discussion.tags.some(tag => tag.toLowerCase().includes(filters.searchQuery.toLowerCase()))
    )) {
      return false;
    }

    // Privacy filter
    if (filters.privacy !== 'all' && discussion.privacy !== filters.privacy) {
      return false;
    }

    // Date filter
    if (filters.dateFilter && discussion.scheduledAt) {
      const filterDate = new Date(filters.dateFilter);
      const scheduledAt = new Date(discussion.scheduledAt);

      // Compare date only (not time)
      if (
        filterDate.getFullYear() !== scheduledAt.getFullYear() ||
        filterDate.getMonth() !== scheduledAt.getMonth() ||
        filterDate.getDate() !== scheduledAt.getDate()
      ) {
        return false;
      }
    }

    // Participant range filter
    if (
      discussion.maxParticipants &&
      (discussion.maxParticipants < filters.participantRange[0] ||
        discussion.maxParticipants > filters.participantRange[1])
    ) {
      return false;
    }

    return true;
  });

  // Sort discussions
  const sortedDiscussions = [...filteredDiscussions].sort((a, b) => {
    switch (filters.sortBy) {
      case "최신순":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "인기순":
        return b.likes - a.likes;
      case "댓글순":
        return b.comments - a.comments;
      case "참가자순":
        return (b.currentParticipants ?? 0) - (a.currentParticipants ?? 0);
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Check if any filters are active
  const isFilterActive =
    filters.searchQuery !== "" ||
    filters.privacy !== "all" ||
    filters.dateFilter !== "" ||
    filters.participantRange[0] !== 0 ||
    filters.participantRange[1] !== 50;


  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Mobile Header */}
      <MobileHeader isMenuOpen={isMenuOpen} onMenuToggle={setIsMenuOpen} />

      {/* Hamburger Menu */}
      <HamburgerMenu isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} />

      {/* Left Sidebar */}
      <Sidebar />

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* New Post Button */}
      <NewPostButton isMenuOpen={isMenuOpen} path="/discussions/new" />

      <div className="min-h-screen flex flex-col items-center px-4 md:pl-64 pb-8 w-full">
        <div className="w-full max-w-6xl pt-12 md:pt-8">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                독서
              </span>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                토론
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-gray-400">다양한 책에 대한 토론에 참여하고 의견을 나눠보세요.</p>
            </div>
          </div>

          {/* 필터 섹션 */}
          <div className="mb-6 space-y-4">
            {/* Basic Search and Sort */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="토론 검색..."
                  className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filters.searchQuery}
                  onChange={(e) => updateFilter('searchQuery', e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                    className="appearance-none bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg py-2 pl-10 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="최신순">최신순</option>
                    <option value="인기순">인기순</option>
                    <option value="댓글순">댓글순</option>
                    <option value="참가자순">참가자순</option>
                  </select>
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <button
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  className="flex items-center gap-2 text-sm px-3 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors self-start"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Extended Filter Options */}
            {isFilterExpanded && (
              <div className="p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg">
                <h3 className="font-medium mb-4">상세 필터</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Discussion Date Filter */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      토론 예정 날짜
                    </label>
                    <input
                      type="date"
                      value={filters.dateFilter}
                      onChange={(e) => updateFilter('dateFilter', e.target.value)}
                      className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {filters.dateFilter && (
                      <button
                        onClick={() => updateFilter('dateFilter', "")}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors self-start"
                      >
                        날짜 필터 초기화
                      </button>
                    )}
                  </div>

                  {/* Privacy Filter */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-400" />
                      공개 설정
                    </label>
                    <div className="flex gap-2">
                      {(['all', 'public', 'private', 'invitation'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => updateFilter('privacy', type)}
                          className={`flex-1 py-2 px-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-1 ${getPrivacyButtonStyle(type, filters.privacy)
                            }`}
                        >
                          {getPrivacyIcon(type)}
                          {getPrivacyLabel(type)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Participant Range Filter */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-400" />
                      최대 참가자 수 범위
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={filters.participantRange[0]}
                        onChange={(e) => handleParticipantRangeChange(parseInt(e.target.value), 0)}
                        className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-gray-400">~</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={filters.participantRange[1]}
                        onChange={(e) => handleParticipantRangeChange(parseInt(e.target.value), 1)}
                        className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full mt-1">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{
                          width: `${(filters.participantRange[1] - filters.participantRange[0]) / 100 * 100}%`,
                          marginLeft: `${filters.participantRange[0]}%`
                        }}
                      ></div>
                    </div>
                    <button
                      onClick={() => updateFilter('participantRange', [0, 50])}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors self-start"
                    >
                      참가자 범위 초기화
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filter Results Display */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-400">
              총 <span className="text-white font-medium">{sortedDiscussions.length}</span>개의 토론이 있습니다
            </div>
            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
              >
                필터 초기화
              </button>
            )}
          </div>

          {/* Discussion List */}
          {!isLoading && isFilterExpanded && sortedDiscussions.length === 0 ? (
            <EmptyDiscussionState onNewDiscussion={() => router.push('/discussions/new')} />
          ) : (
            <div className="flex flex-col gap-6">
              {sortedDiscussions.map((discussion) => (
                <DiscussionItem
                  key={discussion.id}
                  discussion={discussion}
                />
              ))}
            </div>
          )}

          {/* Loading Indicator */}
          <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-800/30 rounded-xl">
            {isLoading && <Loading />}
          </div>

          {/* End Message */}
          <div ref={loadingRef} className="w-full py-8 flex flex-col items-center justify-center">
            {!hasMore && !isLoading && sortedDiscussions.length > 0 && <EndMessage />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components
function EmptyDiscussionState({ onNewDiscussion }: { onNewDiscussion: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-800/30 rounded-xl">
      <BookOpen className="w-12 h-12 text-gray-600 mb-4" />
      <h3 className="text-xl font-medium text-gray-300 mb-2">조건에 맞는 토론이 없습니다</h3>
      <p className="text-gray-400 text-center mb-6">필터 조건을 변경하거나 새로운 토론을 시작해보세요.</p>
      <button
        onClick={onNewDiscussion}
        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-colors"
      >
        새 토론 시작하기
      </button>
    </div>
  );
}

function EndMessage() {
  return (
    <div className="text-gray-400 text-center">
      <p className="text-lg font-medium">모든 토론을 불러왔습니다</p>
      <p className="text-sm mt-1">새로운 토론을 기다려주세요</p>
    </div>
  );
}

function DiscussionItem({
  discussion,
}: {
  discussion: Discussion,
}) {
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  return (
    <div className="relative flex flex-col md:flex-row gap-4 overflow-hidden">
      {/* Main Card Area */}
      <div className="flex-grow md:flex-1 h-full flex order-2 md:order-2">
        <DiscussionCard
          id={discussion.id}
          title={discussion.title}
          author={discussion.author.name || '익명'}
          authorImage={discussion.author.image || ''}
          bookTitle={discussion.bookTitle}
          bookAuthor={discussion.bookAuthor}
          createdAt={discussion.createdAt}
          likes={discussion.likes}
          comments={discussion.comments}
          tags={discussion.tags}
          privacy={discussion.privacy !== 'all' ? discussion.privacy : undefined}
          scheduledAt={discussion.scheduledAt}
          currentParticipants={discussion.currentParticipants}
          maxParticipants={discussion.maxParticipants}
        />
      </div>

      {/* Left Metadata Area */}
      <div className="w-full md:w-36 md:flex-shrink-0 flex flex-row md:flex-col justify-between md:justify-between gap-2 self-stretch order-1 md:order-1 pb-2 md:pb-0">
        {/* 이미지 섹션 */}
        {discussion.imageUrls.length > 0 && !imageError ? (
          <div className="w-full h-full relative overflow-hidden rounded-lg mb-2">
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80">
                <div className="animate-pulse">
                  <Loading />
                </div>
              </div>
            )}
            <Image
              src={discussion.imageUrls[0]} 
              alt={discussion.title}
              width={144}
              height={144}
              className="w-full h-full object-cover"
              onLoad={() => setIsImageLoading(false)}
              onError={() => setImageError(true)}
            />
            {discussion.imageUrls.length > 1 && (
              <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-md">
                +{discussion.imageUrls.length - 1}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full relative rounded-lg mb-2 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
            {imageError ? (
              <div className="flex flex-col items-center">
                <Logo size="md" />
                <span className="text-xs text-gray-400 mt-1">이미지 오류</span>
              </div>
            ) : (
              <BookOpen className="w-8 h-8 text-indigo-400/50" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions for privacy filter buttons
function getPrivacyButtonStyle(type: PrivacyType, currentPrivacy: PrivacyType) {
  if (type === currentPrivacy) {
    switch (type) {
      case 'public':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'private':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'invitation':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'all':
        return 'bg-gray-700 text-white';
    }
  }
  return 'bg-gray-800 text-gray-400 hover:bg-gray-700';
}

function getPrivacyIcon(type: PrivacyType) {
  switch (type) {
    case 'public':
      return <Globe className="w-3 h-3" />;
    case 'private':
      return <Lock className="w-3 h-3" />;
    case 'invitation':
      return <Users className="w-3 h-3" />;
    default:
      return null;
  }
}

function getPrivacyLabel(type: PrivacyType) {
  switch (type) {
    case 'public':
      return '공개';
    case 'private':
      return '비공개';
    case 'invitation':
      return '초대';
    case 'all':
      return '전체';
    default:
      return '';
  }
}