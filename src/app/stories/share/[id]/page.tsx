'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StoryDetailModal from '@/components/StoryDetailModal';
import Loading from '@/components/Loading';

interface Story {
  id: string;
  title: string;
  content: string;
  category: string;
  image_urls: string[];
  createdAt: string;
  author: {
    id: string;
    name: string;
    image: string | null;
  };
  likesCount: number;
  commentsCount: number;
}

export default function StorySharePage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  // const [isModalOpen, setIsModalOpen] = useState(true);

  const fetchStory = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/stories/${params.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '이야기를 불러오는 중 오류가 발생했습니다.');
      }
      
      const data = await response.json();
      setStory(data);
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
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchStory();
    }
  }, [params.id, fetchStory]);

  const handleClose = () => {
    router.push('/stories');
  };

  if (isLoading) {
    return <Loading />;
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

  return (
    <StoryDetailModal
      isOpen={true}
      onClose={handleClose}
      story={{
        id: story.id,
        author: story.author.name || '익명',
        authorImage: story.author.image || '',
        timeAgo: story.createdAt,
        title: story.title,
        content: story.content,
        likes: story.likesCount,
        comments: story.commentsCount,
        category: story.category,
        images: story.image_urls,
        currentImageIndex: 0
      }}
    />
  );
}