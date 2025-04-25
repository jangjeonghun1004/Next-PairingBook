import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 내가 작성한 댓글 목록 가져오기
export async function GET(request: Request) {
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
    
    // URL에서 페이지네이션 파라미터 추출
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    
    // 유효성 검사
    if (page < 1 || pageSize < 1 || pageSize > 50) {
      return NextResponse.json(
        { error: '잘못된 페이지네이션 매개변수입니다.' },
        { status: 400 }
      );
    }
    
    // 전체 댓글 수 조회
    const totalCount = await prisma.comment.count({
      where: { userId }
    });
    
    // 페이징된 댓글 조회
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
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    });
    
    return NextResponse.json({
      comments,
      pagination: {
        totalCount,
        currentPage: page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });
    
  } catch (error) {
    console.error('댓글 목록 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '댓글 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 