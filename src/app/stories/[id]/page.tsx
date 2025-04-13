'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, Edit, Heart, MessageSquare, Share2, Trash2, User, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import SearchModal from '@/components/SearchModal';
import Loading from '@/components/Loading';

interface Author {
  id: string;
  name: string;
  image: string | null;
}

interface Story {
  id: string;
  title: string;
  content: string;
  category: string;
  image_urls: string[];
  createdAt: string;
  author: Author;
  likesCount: number;
  commentsCount: number;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: Author;
}

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [story, setStory] = useState<Story | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeletingStory, setIsDeletingStory] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchStory();
    }
  }, [params.id]);

  const fetchStory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/stories/${params.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '이야기를 불러오는 중 오류가 발생했습니다.');
      }
      
      const data = await response.json();
      setStory(data);
      setComments(data.comments || []);
      setLikesCount(data.likesCount || 0);
      
      // 현재 사용자가 좋아요를 눌렀는지 확인
      if (status === 'authenticated' && session?.user?.id) {
        const userLiked = data.likes.some((like: any) => like.userId === session.user.id);
        setIsLiked(userLiked);
      }
      
      setIsLoading(false);
      setError(null);
    } catch (error: any) {
      console.error('이야기 불러오기 오류:', error);
      setIsLoading(false);
      setError(error.message || '이야기를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 이야기 삭제 처리
  const handleDeleteStory = async () => {
    try {
      setIsDeletingStory(true);
      
      const response = await fetch(`/api/stories/${params.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '이야기를 삭제하는 중 오류가 발생했습니다.');
      }
      
      toast.success('이야기가 삭제되었습니다.');
      router.push('/stories/manage');
    } catch (error: any) {
      console.error('이야기 삭제 오류:', error);
      toast.error(error.message || '이야기를 삭제하는 중 오류가 발생했습니다.');
      setIsDeletingStory(false);
      setDeleteConfirm(false);
    }
  };

  // 좋아요 처리
  const handleLike = async () => {
    if (status !== 'authenticated') {
      toast.error('로그인이 필요합니다.');
      return;
    }
    
    try {
      // 좋아요 상태 미리 변경 (낙관적 UI 업데이트)
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
      
      const response = await fetch(`/api/stories/${params.id}/like`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        // 요청 실패 시 원래 상태로 되돌림
        setIsLiked(isLiked);
        setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
        
        const errorData = await response.json();
        throw new Error(errorData.error || '좋아요 처리 중 오류가 발생했습니다.');
      }
    } catch (error: any) {
      console.error('좋아요 처리 오류:', error);
      toast.error(error.message || '좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  // 댓글 작성 처리
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      toast.error('댓글 내용을 입력해주세요.');
      return;
    }
    
    if (status !== 'authenticated') {
      toast.error('로그인이 필요합니다.');
      return;
    }
    
    try {
      setIsSubmittingComment(true);
      
      const response = await fetch(`/api/stories/${params.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: commentText })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '댓글 작성 중 오류가 발생했습니다.');
      }
      
      const newComment = await response.json();
      
      // 댓글 목록 업데이트
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      toast.success('댓글이 작성되었습니다.');
    } catch (error: any) {
      console.error('댓글 작성 오류:', error);
      toast.error(error.message || '댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 날짜 포맷팅
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

  if (isLoading) {
    return (<Loading/>);
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto py-10">
          <div className="text-red-400 text-center">
            <p>{error || '이야기를 불러오는 중 오류가 발생했습니다.'}</p>
            <button
              onClick={fetchStory}
              className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAuthor = status === 'authenticated' && session?.user?.id === story.author.id;

  return (
    <div className="min-h-screen">
      <Sidebar onSearchClick={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <div className="sm:pl-[80px] lg:pl-[240px]">
        <div className="max-w-4xl mx-auto px-3 py-6 sm:px-4 sm:py-8 md:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6 top-0 z-10 bg-gradient-to-r from-gray-900/95 to-gray-900/95 backdrop-blur-md py-3 sm:py-4 rounded-xl px-3 sm:px-4">
            <Link
              href="/stories"
              className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-800/70 transition-all duration-200 transform hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">뒤로가기</span>
            </Link>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">이야기</h1>
            <div className="w-[72px] sm:w-[89px]"></div>
          </div>

          {/* 작성자 정보 */}
          <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                {story.author.image ? (
                  <Image 
                    src={story.author.image} 
                    alt={story.author.name || '작성자'} 
                    width={40} 
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-800 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div>
                <div className="font-medium">{story.author.name || '익명'}</div>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {formatDate(story.createdAt)}
                </div>
              </div>
              {isAuthor && (
                <div className="ml-auto flex gap-2">
                  <Link 
                    href={`/stories/edit/${story.id}`}
                    className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600/30 transition-colors flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    <span>수정</span>
                  </Link>
                  <button 
                    onClick={() => setDeleteConfirm(true)}
                    className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>삭제</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 카테고리 */}
          <div className="mb-6">
            <span className="bg-indigo-600/30 text-indigo-400 px-3 py-1 rounded-full text-sm">
              {story.category}
            </span>
          </div>

          {/* 이미지 갤러리 */}
          {story.image_urls && story.image_urls.length > 0 && (
            <div className="mb-8">
              <div className={`grid ${
                story.image_urls.length === 1 ? 'grid-cols-1' 
                : story.image_urls.length === 2 ? 'grid-cols-2' 
                : story.image_urls.length === 3 ? 'grid-cols-2 md:grid-cols-3'
                : 'grid-cols-2 md:grid-cols-3'
              } gap-2 sm:gap-4`}>
                {story.image_urls.map((url, index) => (
                  <div 
                    key={index} 
                    className={`rounded-xl overflow-hidden shadow-lg ${
                      story.image_urls.length === 3 && index === 0 ? 'md:col-span-2 md:row-span-2' : ''
                    } ${
                      story.image_urls.length === 4 && index === 0 ? 'col-span-2 row-span-2' : ''
                    }`}
                  >
                    <Image 
                      src={url} 
                      alt={`이미지 ${index + 1}`}
                      width={600}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 이야기 내용 */}
          <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg mb-8">
            <div className="prose prose-invert max-w-none break-words">
              {story.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-3 text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-all">{paragraph}</p>
              ))}
            </div>
          </div>

          {/* 액션 바 */}
          <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button 
                  onClick={handleLike}
                  className={`flex items-center gap-1 ${isLiked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'} transition-colors`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-400' : ''}`} />
                  <span>{likesCount}</span>
                </button>
                <button 
                  onClick={() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-1 text-gray-400 hover:text-indigo-400 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>{comments.length}</span>
                </button>
              </div>
              <button className="flex items-center gap-1 text-gray-400 hover:text-indigo-400 transition-colors">
                <Share2 className="w-5 h-5" />
                <span>공유</span>
              </button>
            </div>
          </div>

          {/* 댓글 섹션 */}
          <div id="comments-section" className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">댓글</h3>
            
            {/* 댓글 작성 폼 */}
            <form onSubmit={handleSubmitComment} className="mb-6">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="댓글을 입력하세요"
                className="w-full p-3 bg-gray-800/70 rounded-lg border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none min-h-[100px] text-sm sm:text-base"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={isSubmittingComment}
                  className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 ${
                    isSubmittingComment ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmittingComment ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>작성 중...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>댓글 작성</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* 댓글 목록 */}
            {comments.length === 0 ? (
              <div className="text-gray-400 text-center py-6">
                아직 댓글이 없습니다. 첫 댓글을 작성해 보세요!
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        {comment.user.image ? (
                          <Image 
                            src={comment.user.image} 
                            alt={comment.user.name || '사용자'} 
                            width={32} 
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-indigo-800 flex items-center justify-center">
                            <span className="text-xs font-medium">{(comment.user.name || '?')[0]}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{comment.user.name || '익명'}</div>
                        <div className="text-xs text-gray-400">{formatDate(comment.createdAt)}</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 break-all whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">이야기 삭제 확인</h3>
            <p className="mb-6">정말 이 이야기를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteStory}
                disabled={isDeletingStory}
                className={`px-4 py-2 ${isDeletingStory ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} rounded-lg transition-colors`}
              >
                {isDeletingStory ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 