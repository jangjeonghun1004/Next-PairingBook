import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 인증 체크
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // 사용자가 작성한 모든 이야기 조회
    const stories = await prisma.story.findMany({
      where: {
        authorId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // 좋아요 수와 댓글 수를 별도로 조회
    const storyIds = stories.map(story => story.id);
    const likesCount = await prisma.userLike.groupBy({
      by: ['storyId'],
      where: {
        storyId: {
          in: storyIds
        }
      },
      _count: {
        storyId: true
      }
    });
    
    const commentsCount = await prisma.comment.groupBy({
      by: ['storyId'],
      where: {
        storyId: {
          in: storyIds
        }
      },
      _count: {
        storyId: true
      }
    });
    
    // 좋아요 및 댓글 카운트를 맵으로 변환
    const likesMap = new Map();
    likesCount.forEach(item => {
      likesMap.set(item.storyId, item._count.storyId);
    });
    
    const commentsMap = new Map();
    commentsCount.forEach(item => {
      commentsMap.set(item.storyId, item._count.storyId);
    });
    
    // 작성자 정보 가져오기
    const authors = await prisma.user.findMany({
      where: {
        id: userId
      },
      select: {
        id: true,
        name: true,
        image: true
      }
    });
    
    const authorMap = new Map();
    authors.forEach(author => {
      authorMap.set(author.id, author);
    });
    
    // 최종 응답 포맷팅
    const formattedStories = stories.map(story => ({
      id: story.id,
      title: story.title,
      content: story.content,
      category: story.category,
      image_urls: story.image_urls,
      likes: likesMap.get(story.id) || 0,
      commentCount: commentsMap.get(story.id) || 0,
      createdAt: story.createdAt,
      author: {
        id: userId,
        name: authorMap.get(userId)?.name || null,
        image: authorMap.get(userId)?.image || null
      }
    }));
    
    return NextResponse.json(formattedStories);
    
  } catch (error) {
    console.error('내 이야기 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '이야기를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 