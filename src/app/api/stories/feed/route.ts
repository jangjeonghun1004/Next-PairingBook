import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Session } from 'next-auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions) as Session;
    if (!session?.user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const limit = 5; // 한 페이지당 5개의 스토리
    const skip = Math.max(0, page) * limit;

    // 사용자가 팔로우한 유저 ID 목록 가져오기
    const following = await prisma.userFollow.findMany({
      where: {
        followerId: userId
      },
      select: {
        followingId: true
      }
    });

    const followedIds = following.map(f => f.followingId);

    // 팔로우한 유저가 없는 경우 빈 결과 반환
    if (followedIds.length === 0) {
      return NextResponse.json({
        stories: [],
        hasMore: false
      });
    }

    // 팔로우한 유저들의 스토리 가져오기
    const stories = await prisma.story.findMany({
      where: {
        authorId: {
          in: followedIds
        }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
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

    // 전체 스토리 수를 확인하여 더 불러올 데이터가 있는지 확인
    const totalCount = await prisma.story.count({
      where: {
        authorId: {
          in: followedIds
        }
      }
    });

    return NextResponse.json({
      stories: storiesWithCounts,
      hasMore: skip + limit < totalCount
    });
  } catch (error) {
    console.error('피드 스토리 가져오기 오류:', error);
    return NextResponse.json(
      { error: '스토리를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 