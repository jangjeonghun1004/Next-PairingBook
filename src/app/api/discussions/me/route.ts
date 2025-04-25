import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Discussion, DiscussionParticipant, User } from '@prisma/client';

type DiscussionWithParticipants = Discussion & {
  participants: (DiscussionParticipant & {
    user: Pick<User, 'id' | 'name' | 'image'>;
  })[];
  author: Pick<User, 'id' | 'name' | 'image'>;
};

type ParticipationStatus = {
  [discussionId: string]: string;
};

// 내 토론 정보 가져오기 API
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 내가 작성한 토론 목록
    const myCreatedDiscussions = await prisma.discussion.findMany({
      where: {
        authorId: session.user.id,
      },
      include: {
        participants: {
          where: {
            status: 'APPROVED',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 참여 중인 토론 목록
    const myDiscussions = await prisma.discussion.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id,
          },
        },
        authorId: {
          not: session.user.id,
        },
      },
      include: {
        participants: {
          where: {
            status: 'APPROVED',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 내 참여 상태 조회
    const myParticipations = await prisma.discussionParticipant.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        discussionId: true,
        status: true,
      },
    });

    console.log('내 참여 상태:', myParticipations);

    // 승인 대기 중인 토론 목록
    const pendingRequests = await prisma.discussion.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id,
            status: 'PENDING',
          },
        },
      },
      include: {
        participants: {
          where: {
            status: 'APPROVED',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 참여 상태 매핑 함수
    const mapDiscussionWithStatus = (discussion: DiscussionWithParticipants, statusMap: ParticipationStatus) => {
      // 기존 값이 없으면 'APPROVED'를 기본값으로 사용
      const status = statusMap[discussion.id] || 'APPROVED';
      console.log(`토론 ID ${discussion.id}의 상태:`, status);
      
      return {
        id: discussion.id,
        title: discussion.title,
        bookTitle: discussion.bookTitle,
        bookAuthor: discussion.bookAuthor,
        imageUrls: discussion.imageUrls,
        privacy: discussion.privacy,
        scheduledAt: discussion.scheduledAt,
        createdAt: discussion.createdAt,
        author: discussion.author,
        participants: discussion.participants.map(p => ({
          id: p.id,
          user: p.user
        })),
        participantCount: discussion.participants.length,
        status: status,
      };
    };

    // 참여 상태 맵 생성
    const statusMap: ParticipationStatus = {};
    myParticipations.forEach(p => {
      statusMap[p.discussionId] = p.status;
    });

    console.log('참여 상태 맵:', statusMap);

    const result = {
      myCreatedDiscussions: myCreatedDiscussions.map(discussion => 
        mapDiscussionWithStatus(discussion as DiscussionWithParticipants, statusMap)
      ),
      myDiscussions: myDiscussions.map(discussion => 
        mapDiscussionWithStatus(discussion as DiscussionWithParticipants, statusMap)
      ),
      pendingRequests: pendingRequests.map(discussion => 
        mapDiscussionWithStatus(discussion as DiscussionWithParticipants, statusMap)
      ),
    };

    console.log('응답 데이터 요약:', {
      생성한토론수: result.myCreatedDiscussions.length,
      참여중인토론수: result.myDiscussions.length,
      대기중인토론수: result.pendingRequests.length
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('토론 데이터 조회 중 오류:', error);
    return NextResponse.json(
      { error: '토론 데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 