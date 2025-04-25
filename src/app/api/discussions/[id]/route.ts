import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
      // 원본 데이터 로깅
      console.log('원본 참여자 데이터:', JSON.stringify(discussion.participants, null, 2));
      
      // 관리 페이지를 위한 포맷 - 모든 참여자 정보를 포함
      formattedDiscussion = {
        ...discussion,
        participants: discussion.participants.map(p => {
          const formatted = {
          id: p.id,
          userId: p.user.id,
          name: p.user.name,
          image: p.user.image,
            status: p.status ? p.status.toUpperCase() : 'APPROVED', // 상태를 대문자로 표준화
          createdAt: p.createdAt,
          };
          
          console.log(`참여자 ${p.id} 포맷팅:`, formatted);
          return formatted;
        }),
      };
    } else {
      // 일반 토론 페이지를 위한 포맷 - 승인된 참여자만 포함
      formattedDiscussion = {
        ...discussion,
        participants: discussion.participants.map(p => ({
          id: p.id,
          user: p.user,
          status: p.status ? p.status.toUpperCase() : 'APPROVED', // 상태를 대문자로 표준화
        })),
      };
    }

    console.log('참여자 개수:', formattedDiscussion.participants.length);

    return NextResponse.json(formattedDiscussion);
  } catch (error) {
    console.error('토론 정보 가져오기 오류:', error);
    return NextResponse.json(
      { error: '토론 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 토론 삭제 API
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: discussionId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 토론 정보 가져오기
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
      select: { authorId: true }
    });

    if (!discussion) {
      return NextResponse.json(
        { error: '토론을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 토론 생성자가 아니면 삭제 권한 없음
    if (discussion.authorId !== session.user.id) {
      return NextResponse.json(
        { error: '토론 삭제 권한이 없습니다. 토론 생성자만 삭제할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 토론 참여자 정보 먼저 삭제
    await prisma.discussionParticipant.deleteMany({
      where: { discussionId }
    });

    // 토론 삭제
    await prisma.discussion.delete({
      where: { id: discussionId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('토론 삭제 오류:', error);
    return NextResponse.json(
      { error: '토론을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 