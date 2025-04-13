import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    
    // 이미 좋아요를 눌렀는지 확인
    const existingLike = await prisma.userLike.findFirst({
      where: {
        userId,
        storyId
      }
    });
    
    let isLiked;
    
    if (existingLike) {
      // 좋아요가 이미 존재하면 취소
      await prisma.userLike.delete({
        where: {
          id: existingLike.id
        }
      });
      
      isLiked = false;
    } else {
      // 좋아요가 없으면 추가
      await prisma.userLike.create({
        data: {
          userId,
          storyId
        }
      });
      
      isLiked = true;
    }
    
    // 좋아요 수 계산
    const likes = await prisma.userLike.count({
      where: { storyId }
    });
    
    return NextResponse.json({ isLiked, likes });
    
  } catch (error) {
    console.error('좋아요 처리 중 오류 발생:', error);
    return NextResponse.json(
      { error: '좋아요 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 