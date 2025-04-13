import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 토론 참여 취소 API
export async function POST(req: NextRequest) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { discussionId } = await req.json();
    const userId = session.user.id;

    // 요청 검증
    if (!discussionId) {
      return NextResponse.json(
        { error: '토론 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 참여 정보 조회
    const participant = await prisma.discussionParticipant.findFirst({
      where: {
        discussionId,
        userId,
        status: 'approved' // 승인된 참여자만 취소 가능
      },
      include: {
        discussion: {
          select: {
            authorId: true
          }
        }
      }
    });

    if (!participant) {
      return NextResponse.json(
        { error: '참여 중인 토론을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 토론 생성자는 참여 취소 불가능
    if (participant.discussion.authorId === userId) {
      return NextResponse.json(
        { error: '토론 생성자는 참여를 취소할 수 없습니다.' },
        { status: 403 }
      );
    }

    // 참여 취소 (삭제)
    await prisma.discussionParticipant.delete({
      where: {
        id: participant.id
      }
    });

    return NextResponse.json({
      success: true,
      message: '토론 참여가 취소되었습니다.'
    });

  } catch (error) {
    console.error('토론 참여 취소 중 오류 발생:', error);
    return NextResponse.json(
      { error: '토론 참여 취소 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 