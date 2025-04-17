import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface DiscussionWithMaxParticipants {
  maxParticipants?: number;
  // 기타 필요한 필드 추가
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id: discussionId } = await params;
    
    // Discussion 모델 수정 방법
    // 직접 타입 단언 사용
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion) {
      return NextResponse.json(
        { error: '토론을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Prisma 메서드명 수정 (케이스 수정)
    const existingParticipation = await prisma.discussionParticipant.findUnique({
      where: {
        userId_discussionId: {
          userId: session.user.id,
          discussionId,
        },
      },
    });

    if (existingParticipation) {
      return NextResponse.json(
        { error: '이미 참가 신청한 토론입니다.', status: existingParticipation.status },
        { status: 409 }
      );
    }

    // 타입 단언 사용
    if ((discussion as DiscussionWithMaxParticipants).maxParticipants) {
      const currentParticipantsCount = await prisma.discussionParticipant.count({
        where: {
          discussionId,
          status: 'approved',
        },
      });
  
      const maxParticipants = (discussion as DiscussionWithMaxParticipants).maxParticipants;
      if (currentParticipantsCount >= maxParticipants!) {
        return NextResponse.json(
          { error: '참가 인원이 이미 가득 찼습니다.' },
          { status: 400 }
        );
      }
    }

    // 토론 작성자인 경우 자동 승인
    const initialStatus = discussion.authorId === session.user.id ? 'approved' : 'pending';

    // 참가 신청 생성
    const participant = await prisma.discussionParticipant.create({
      data: {
        status: initialStatus,
        userId: session.user.id,
        discussionId,
      },
    });

    return NextResponse.json({
      message: '토론 참가 신청이 완료되었습니다.',
      status: participant.status,
    });
  } catch (error) {
    console.error('토론 참가 신청 중 오류 발생:', error);
    return NextResponse.json(
      { error: '토론 참가 신청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 참가 상태 확인 API
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id: discussionId } = await params;
    
    // 참가 신청 정보 조회
    const participation = await prisma.discussionParticipant.findUnique({
      where: {
        userId_discussionId: {
          userId: session.user.id,
          discussionId,
        },
      },
    });

    // 토론의 현재 참가자 수 조회
    const participantsCount = await prisma.discussionParticipant.count({
      where: {
        discussionId,
        status: 'approved',
      },
    });

    return NextResponse.json({
      participation,
      participantsCount,
    });
  } catch (error) {
    console.error('참가 정보 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '참가 정보를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 