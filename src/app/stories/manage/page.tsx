'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, Edit, Trash2, MoreHorizontal, Eye, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchMyStories();
    }
  }, [status, router]);

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
      setIsLoading(false);
      setError(null);
    } catch (error: any) {
      console.error('이야기 불러오기 오류:', error);
      setIsLoading(false);
      setError(error.message || '이야기를 불러오는 중 오류가 발생했습니다.');
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
      setStories(prevStories => prevStories.filter(story => story.id !== storyId));
      toast.success('이야기가 삭제되었습니다.');
      setDeleteConfirm(null);
    } catch (error: any) {
      console.error('이야기 삭제 오류:', error);
      toast.error(error.message || '이야기를 삭제하는 중 오류가 발생했습니다.');
    } finally {
      setSelectedStory(null);
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto py-10 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
          </div>
        </div>
      </div>
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
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link 
            href="/myhome"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> 마이홈으로 돌아가기
          </Link>
          
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">내 이야기 관리</h1>
            <Link
              href="/stories/new"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>새 이야기 작성</span>
            </Link>
          </div>
        </div>
        
        {/* 이야기 목록 */}
        {stories.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 text-center">
            <p className="text-gray-400 mb-4">아직 작성한 이야기가 없습니다.</p>
            <Link
              href="/stories/new"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-block"
            >
              첫 이야기 작성하기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map((story) => (
              <div key={story.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0">
                    <Image 
                      src={story.image_urls[0] || '/images/default-story.jpg'} 
                      alt={story.title}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h2 className="font-medium text-lg line-clamp-1">{story.title}</h2>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>{story.category}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{timeAgo(story.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex gap-2 text-sm">
                      <div className="bg-gray-700/50 px-2 py-1 rounded flex items-center gap-1">
                        <span>👍</span> {story.likes}
                      </div>
                      <div className="bg-gray-700/50 px-2 py-1 rounded flex items-center gap-1">
                        <span>💬</span> {story.commentCount}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-between items-end">
                    <div className="relative">
                      <button 
                        onClick={() => setMenuOpen(menuOpen === story.id ? null : story.id)}
                        className="p-1.5 rounded-full hover:bg-gray-700 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      
                      {menuOpen === story.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-gray-800 rounded-lg shadow-lg py-1 z-10">
                          <Link 
                            href={`/stories/${story.id}`}
                            className="px-4 py-2 hover:bg-gray-700 flex items-center gap-2 w-full text-left text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            <span>보기</span>
                          </Link>
                          <Link 
                            href={`/stories/edit/${story.id}`}
                            className="px-4 py-2 hover:bg-gray-700 flex items-center gap-2 w-full text-left text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            <span>수정하기</span>
                          </Link>
                          <button 
                            onClick={() => {
                              setMenuOpen(null);
                              setDeleteConfirm(story.id);
                            }}
                            className="px-4 py-2 hover:bg-gray-700 flex items-center gap-2 w-full text-left text-sm text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>삭제하기</span>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Link 
                        href={`/stories/${story.id}`}
                        className="px-3 py-1 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                      >
                        보기
                      </Link>
                      <Link 
                        href={`/stories/edit/${story.id}`}
                        className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg transition-colors text-sm"
                      >
                        수정
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* 삭제 확인 모달 */}
                {deleteConfirm === story.id && (
                  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
                      <h3 className="text-xl font-semibold mb-4">이야기 삭제 확인</h3>
                      <p className="mb-6">'{story.title}'을(를) 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
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
                          className={`px-4 py-2 ${selectedStory === story.id ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} rounded-lg transition-colors`}
                        >
                          {selectedStory === story.id ? '삭제 중...' : '삭제'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 