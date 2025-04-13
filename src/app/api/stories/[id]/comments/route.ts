import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }
    
    // params 유효성 검사
    if (!params?.id) {
      return NextResponse.json(
        { error: '유효하지 않은 이야기 ID입니다.' },
        { status: 400 }
      );
    }
    
    const userId = session.user.id;
    const storyId = params.id;
    
    // 요청 데이터 파싱
    const { content } = await request.json();
    
    // 필수 데이터 검증
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: '댓글 내용을 입력해주세요.' },
        { status: 400 }
      );
    }
    
    // 이야기 존재 확인
    const story = await prisma.story.findUnique({
      where: { id: storyId }
    });
    
    if (!story) {
      return NextResponse.json(
        { error: '이야기를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 댓글 생성
    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        storyId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });
    
    return NextResponse.json(comment);
    
  } catch (error) {
    console.error('댓글 작성 중 오류 발생:', error);
    return NextResponse.json(
      { error: '댓글을 작성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // params 유효성 검사
    if (!params?.id) {
      return NextResponse.json(
        { error: '유효하지 않은 이야기 ID입니다.' },
        { status: 400 }
      );
    }
    
    const storyId = params.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const limit = 10; // 한 페이지당 10개의 댓글

    const comments = await prisma.comment.findMany({
      where: {
        storyId,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: page * limit,
    });

    const total = await prisma.comment.count({
      where: {
        storyId,
      },
    });

    return NextResponse.json({
      comments,
      hasMore: (page + 1) * limit < total,
    });
  } catch (error) {
    console.error('댓글 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '댓글을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 