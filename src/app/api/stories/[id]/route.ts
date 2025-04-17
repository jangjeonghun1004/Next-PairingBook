import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 이야기 조회 API
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getServerSession(authOptions);
    // 파라미터가 올바르게 전달되었는지 확인
    const { id: storyId } = await params;
    if (!storyId) {
      return NextResponse.json(
        { error: '유효하지 않은 이야기 ID입니다.' },
        { status: 400 }
      );
    }
    
    // 이야기 기본 정보 조회
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });
    
    if (!story) {
      return NextResponse.json(
        { error: '이야기를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 별도로 좋아요와 댓글 조회
    const likesCount = await prisma.userLike.count({
      where: { storyId }
    });
    
    const commentsCount = await prisma.comment.count({
      where: { storyId }
    });
    
    // 현재 사용자가 좋아요를 했는지 확인하기 위한 정보
    const likes = await prisma.userLike.findMany({
      where: { storyId },
      select: {
        id: true,
        userId: true
      }
    });
    
    // 댓글 조회
    const comments = await prisma.comment.findMany({
      where: { storyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    // 응답 포맷팅
    const formattedStory = {
      ...story,
      likes,
      comments,
      likesCount,
      commentsCount
    };
    
    return NextResponse.json(formattedStory);
    
  } catch (error) {
    console.error('이야기 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '이야기를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 이야기 삭제 API
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id: storyId } = await params;
    if (!storyId) {
      return NextResponse.json(
        { error: '유효하지 않은 이야기 ID입니다.' },
        { status: 400 }
      );
    }
    
    const userId = session.user.id;
    
    // 이야기 정보 조회
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: {
        id: true,
        authorId: true
      }
    });
    
    if (!story) {
      return NextResponse.json(
        { error: '이야기를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 작성자 확인
    if (story.authorId !== userId) {
      return NextResponse.json(
        { error: '이 이야기를 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }
    
    // 관련 데이터 삭제 (좋아요, 댓글)
    await prisma.$transaction([
      prisma.userLike.deleteMany({
        where: { storyId }
      }),
      prisma.comment.deleteMany({
        where: { storyId }
      }),
      prisma.story.delete({
        where: { id: storyId }
      })
    ]);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('이야기 삭제 중 오류 발생:', error);
    return NextResponse.json(
      { error: '이야기를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 이야기 수정 API
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id: storyId } = await params;
    if (!storyId) {
      return NextResponse.json(
        { error: '유효하지 않은 이야기 ID입니다.' },
        { status: 400 }
      );
    }
    
    const userId = session.user.id;
    
    // 요청 데이터 파싱
    const { title, content, category, image_urls } = await request.json();
    
    // 필수 데이터 검증
    if (!title || !content || !category) {
      return NextResponse.json(
        { error: '필수 입력 항목이 누락되었습니다.' },
        { status: 400 }
      );
    }
    
    // 이야기 정보 조회
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: {
        id: true,
        authorId: true
      }
    });
    
    if (!story) {
      return NextResponse.json(
        { error: '이야기를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 작성자 확인
    if (story.authorId !== userId) {
      return NextResponse.json(
        { error: '이 이야기를 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }
    
    // 이야기 업데이트
    const updatedStory = await prisma.story.update({
      where: { id: storyId },
      data: {
        title,
        content,
        category,
        image_urls: image_urls || []
      }
    });
    
    return NextResponse.json(updatedStory);
    
  } catch (error) {
    console.error('이야기 수정 중 오류 발생:', error);
    return NextResponse.json(
      { error: '이야기를 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 