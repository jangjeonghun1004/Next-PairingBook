import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 내가 작성한 댓글 목록 가져오기
export async function GET() {
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
    
    // 사용자가 작성한 댓글 가져오기
    const comments = await prisma.comment.findMany({
      where: {
        userId
      },
      include: {
        story: {
          select: {
            id: true,
            title: true,
            image_urls: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(comments);
    
  } catch (error) {
    console.error('댓글 목록 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '댓글 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 