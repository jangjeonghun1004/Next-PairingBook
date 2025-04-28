import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // params 유효성 검사
    const { id: storyId } = await context.params;
    if (!storyId) {
      return NextResponse.json(
        { error: '유효하지 않은 이야기 ID입니다.' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // 사용자의 좋아요 상태 확인
    const userLike = await prisma.userLike.findFirst({
      where: {
        userId: userId,
        storyId: storyId
      }
    });

    return NextResponse.json({ 
      liked: !!userLike
    });
    
  } catch (error) {
    console.error('좋아요 상태 확인 중 오류 발생:', error);
    return NextResponse.json(
      { error: '좋아요 상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 