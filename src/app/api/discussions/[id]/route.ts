import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: discussionId } = await params;

    // URL에서 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const includeParticipants = searchParams.get('includeParticipants') === 'true';
    
    // 토론 정보 가져오기
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        participants: includeParticipants ? {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        } : {
          where: {
            status: 'approved',
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
          take: 5,
        },
      },
    });

    if (!discussion) {
      return NextResponse.json(
        { error: '토론을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 참여자 정보 처리
    let formattedDiscussion;
    
    if (includeParticipants) {
      // 관리 페이지를 위한 포맷 - 모든 참여자 정보를 포함
      formattedDiscussion = {
        ...discussion,
        participants: discussion.participants.map(p => ({
          id: p.id,
          userId: p.user.id,
          name: p.user.name,
          image: p.user.image,
          status: p.status,
          createdAt: p.createdAt,
        })),
      };
    } else {
      // 일반 토론 페이지를 위한 포맷 - 승인된 참여자만 포함
      formattedDiscussion = {
        ...discussion,
        participants: discussion.participants.map(p => ({
          id: p.id,
          user: p.user,
        })),
      };
    }

    return NextResponse.json(formattedDiscussion);
  } catch (error) {
    console.error('토론 정보 가져오기 오류:', error);
    return NextResponse.json(
      { error: '토론 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 