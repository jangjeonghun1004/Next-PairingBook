import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '../../../auth';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const limit = 6; // 한 페이지당 6개의 스토리
    const skip = Math.max(0, page) * limit; // 페이지가 0 이하인 경우도 처리
    
    const stories = await prisma.story.findMany({
      take: limit,
      skip: skip,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // 스토리 ID 배열 가져오기
    const storyIds = stories.map(story => story.id);
    
    // 좋아요 수 조회
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
    
    // 댓글 수 조회
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
    
    // 좋아요 및 댓글 수를 맵으로 변환
    const likesMap = new Map();
    likesCount.forEach(item => {
      likesMap.set(item.storyId, item._count.storyId);
    });
    
    const commentsMap = new Map();
    commentsCount.forEach(item => {
      commentsMap.set(item.storyId, item._count.storyId);
    });
    
    // 스토리에 좋아요 및 댓글 수 추가
    const storiesWithCounts = stories.map(story => ({
      ...story,
      likes: likesMap.get(story.id) || 0,
      commentCount: commentsMap.get(story.id) || 0
    }));

    const total = await prisma.story.count();
    console.log('Total stories count:', total);

    return NextResponse.json({
      stories: storiesWithCounts,
      hasMore: (page + 1) * limit < total,
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    // 더 자세한 오류 정보 로깅
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: '스토리를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { title, content, category, images } = await request.json();

    const story = await prisma.story.create({
      data: {
        title,
        content,
        authorId: session.user.id,
        category,
        image_urls: images.map((image: { url: string }) => image.url),
      },
      include: {
        author: true,
      },
    });

    return NextResponse.json(story);
  } catch (error) {
    console.error('Error creating story:', error);
    // 더 자세한 오류 정보 로깅
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: '스토리를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 