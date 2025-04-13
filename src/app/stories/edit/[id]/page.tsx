'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Story {
  id: string;
  title: string;
  content: string;
  category: string;
  image_urls: string[];
  authorId: string;
}

export default function EditStoryPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  
  // 폼 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && params.id) {
      fetchStory();
    }
  }, [status, params.id, router]);

  const fetchStory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stories/${params.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '이야기를 불러오는 중 오류가 발생했습니다.');
      }
      
      const data = await response.json();
      
      // 작성자 확인
      if (data.author.id !== session?.user?.id) {
        router.push(`/stories/${params.id}`);
        toast.error('이 이야기를 수정할 권한이 없습니다.');
        return;
      }
      
      setStory(data);
      
      // 폼에 데이터 설정
      setTitle(data.title);
      setContent(data.content);
      setCategory(data.category);
      setImageUrls(data.image_urls || []);
      
      setLoading(false);
      setError(null);
    } catch (error: any) {
      console.error('이야기 불러오기 오류:', error);
      setLoading(false);
      setError(error.message || '이야기를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // 입력 검증
      if (!title.trim()) {
        toast.error('제목을 입력해주세요.');
        setSaving(false);
        return;
      }
      
      if (!content.trim()) {
        toast.error('내용을 입력해주세요.');
        setSaving(false);
        return;
      }
      
      if (!category.trim()) {
        toast.error('카테고리를 선택해주세요.');
        setSaving(false);
        return;
      }
      
      // 이야기 업데이트
      const response = await fetch(`/api/stories/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          category,
          image_urls: imageUrls
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '이야기를 수정하는 중 오류가 발생했습니다.');
      }
      
      toast.success('이야기가 성공적으로 수정되었습니다.');
      router.push(`/stories/${params.id}`);
    } catch (error: any) {
      console.error('이야기 수정 오류:', error);
      toast.error(error.message || '이야기를 수정하는 중 오류가 발생했습니다.');
      setSaving(false);
    }
  };

  if (loading) {
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link 
            href={`/stories/${params.id}`}
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> 이야기로 돌아가기
          </Link>
          
          <h1 className="text-2xl font-bold">이야기 수정</h1>
        </div>
        
        {/* 이야기 수정 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium">
              제목
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-gray-800/70 rounded-lg border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              placeholder="이야기 제목을 입력하세요"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="category" className="block text-sm font-medium">
              카테고리
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 bg-gray-800/70 rounded-lg border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="">카테고리 선택</option>
              <option value="소설">소설</option>
              <option value="시">시</option>
              <option value="에세이">에세이</option>
              <option value="리뷰">리뷰</option>
              <option value="기타">기타</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="content" className="block text-sm font-medium">
              내용
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 bg-gray-800/70 rounded-lg border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none min-h-[300px]"
              placeholder="이야기 내용을 입력하세요"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              이미지
            </label>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative shrink-0">
                  <div className="w-24 h-24 rounded-lg overflow-hidden">
                    <Image 
                      src={url} 
                      alt={`이미지 ${index + 1}`}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== index))}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => {
                  const url = prompt('이미지 URL을 입력하세요');
                  if (url && url.trim()) {
                    setImageUrls([...imageUrls, url.trim()]);
                  }
                }}
                className="w-24 h-24 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
              >
                +
              </button>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Link
              href={`/stories/${params.id}`}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={saving}
              className={`px-4 py-2 ${saving ? 'bg-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} rounded-lg transition-colors flex items-center gap-2`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>저장 중...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>저장하기</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 