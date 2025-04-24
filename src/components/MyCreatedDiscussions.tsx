'use client';

import { BookOpen, BookText, Users, Calendar } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
}

const EmptyState = ({ message }: EmptyStateProps) => (
  <div className="text-gray-400 text-center py-8">
    <p>{message}</p>
  </div>
);

export default function MyCreatedDiscussions({ discussions }: MyCreatedDiscussionsProps) {
  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-semibold">내가 작성한 토론</h2>
        </div>
      </div>

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
                  <BookText className="w-4 h-4" />
                  <span className="line-clamp-1">{discussion.bookTitle}</span>
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

              <div className="mt-3 pt-3 border-t border-gray-700">
                <Link
                  href={`/discussions/${discussion.id}/manage`}
                  className="w-full px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>참여자 관리</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
} 