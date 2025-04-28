import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// 참여자 상태 업데이트 API
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // 세션 확인
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id: participantId } = await context.params;
    const { action } = await request.json();

    // 요청 검증
    if (!participantId || !action) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 참여자 정보 조회
    const participant = await prisma.discussionParticipant.findUnique({
      where: { id: participantId },
      include: {
        discussion: true
      }
    });

    if (!participant) {
      return NextResponse.json(
        { error: '참여자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인 (토론 생성자만 참여자 상태 변경 가능)
    if (participant.discussion.authorId !== session.user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 참여자 상태 업데이트
    const updatedParticipant = await prisma.discussionParticipant.update({
      where: { id: participantId },
      data: {
        status: action === 'approved' ? 'approved' : 'rejected'
      }
    });

    return NextResponse.json({
      message: action === 'approved' ? '참여 요청이 승인되었습니다.' : '참여 요청이 거절되었습니다.',
      participant: updatedParticipant
    });

  } catch (error) {
    console.error('참여자 상태 업데이트 오류:', error);
    return NextResponse.json(
      { error: '참여자 상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 