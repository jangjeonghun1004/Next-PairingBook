import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { prisma } from '@/lib/prisma';

// 사용자 팔로우/언팔로우 토글 API
export async function POST(request: NextRequest) {
  try {
    // 세션 확인
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 요청 데이터 파싱
    const { followingId } = await request.json();
    const followerId = session.user.id;
    
    // 자기 자신을 팔로우하는지 확인
    if (followerId === followingId) {
      return NextResponse.json(
        { error: '자기 자신을 팔로우할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 팔로우할 사용자가 존재하는지 확인
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: '팔로우할 사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 팔로우한 관계 확인
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followingId
        }
      }
    });

    let result;
    if (existingFollow) {
      // 이미 팔로우한 관계가 있으면 언팔로우
      await prisma.userFollow.delete({
        where: {
          id: existingFollow.id
        }
      });
      result = { isFollowing: false };
    } else {
      // 팔로우 관계 생성
      await prisma.userFollow.create({
        data: {
          followerId: followerId,
          followingId: followingId
        }
      });
      result = { isFollowing: true };
    }

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('팔로우 상태 변경 중 오류 발생:', error);
    return NextResponse.json(
      { error: '팔로우 상태 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 팔로우 상태 확인 API
export async function GET(request: NextRequest) {
  try {
    // 인증된 세션 확인
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const followerId = session.user.id;
    const { searchParams } = new URL(request.url);
    const followingId = searchParams.get('followingId');

    if (!followingId) {
      return NextResponse.json(
        { error: '팔로우 대상 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 팔로우 관계 확인
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: followingId
        }
      }
    });

    return NextResponse.json({ 
      isFollowing: !!existingFollow
    });
    
  } catch (error) {
    console.error('팔로우 상태 확인 중 오류 발생:', error);
    return NextResponse.json(
      { error: '팔로우 상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 