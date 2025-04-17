import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 토론 참여자 상태 업데이트 API
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    // 인증 세션 확인
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: discussionId, participantId } = await params;
    
    const { status } = await request.json();
    
    // 요청 검증
    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태 값입니다.' },
        { status: 400 }
      );
    }

    // 토론 확인
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId }
    });
    
    if (!discussion) {
      return NextResponse.json(
        { error: '토론을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 권한 확인 (토론 생성자만 참여자 상태 변경 가능)
    if (discussion.authorId !== userId) {
      return NextResponse.json(
        { error: '이 작업을 수행할 권한이 없습니다.' },
        { status: 403 }
      );
    }
    
    // 참여자 상태 업데이트
    const updatedParticipant = await prisma.discussionParticipant.update({
      where: {
        id: participantId,
        discussionId: discussionId
      },
      data: {
        status
      }
    });
    
    return NextResponse.json({
      success: true,
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