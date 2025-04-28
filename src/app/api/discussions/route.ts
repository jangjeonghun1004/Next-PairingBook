import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { 
      title, 
      content, 
      bookTitle, 
      bookAuthor, 
      tags, 
      topics,
      imageUrls, 
      scheduledAt, 
      maxParticipants, 
      privacy 
    } = await request.json();

    // 필수 필드 검증
    if (!title || !content || !bookTitle || !bookAuthor) {
      return NextResponse.json(
        { error: '필수 정보를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    console.error(topics);

    // 토론 생성 시 데이터 준비
    interface DiscussionCreateData {
      title: string;
      content: string;
      bookTitle: string;
      bookAuthor: string;
      tags: string[];
      topics: string[];
      imageUrls: string[];
      authorId: string;
      privacy: string;
      scheduledAt?: Date | null;
      maxParticipants?: number;
    }

    const discussionData: DiscussionCreateData = {
      title,
      content,
      bookTitle,
      bookAuthor,
      tags: tags || [],
      topics: Array.isArray(topics) 
        ? topics 
        : (topics ? [topics] : []),
      imageUrls: imageUrls || [],
      authorId: session.user.id,
      privacy: privacy
    };

    // 새 필드가 존재하면 추가
    if (scheduledAt !== undefined) {
      discussionData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    }
    
    if (maxParticipants !== undefined) {
      discussionData.maxParticipants = maxParticipants || 10;
    }
    
    // 토론 생성
    const discussion = await prisma.discussion.create({
      data: discussionData,
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(discussion);
  } catch (error) {
    console.error('토론 생성 중 오류 발생:', error);
    return NextResponse.json(
      { error: '토론을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const limit = 6; // 한 페이지당 6개의 토론

    const discussions = await prisma.discussion.findMany({
      take: limit,
      skip: page * limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
        participants: {
          where: {
            status: 'approved'
          }
        }
      },
    });

    // 각 토론별 승인된 참가자 수 계산
    const discussionsWithParticipantCount = await Promise.all(
      discussions.map(async (discussion) => {
        // 현재 participants는 이미 포함되어 있으므로 그 길이를 사용
        const currentParticipants = discussion.participants.length;
        
        return {
          ...discussion,
          currentParticipants
        };
      })
    );

    const total = await prisma.discussion.count();

    return NextResponse.json({
      discussions: discussionsWithParticipantCount,
      hasMore: (page + 1) * limit < total,
    });
  } catch (error) {
    console.error('토론 목록 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '토론 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 