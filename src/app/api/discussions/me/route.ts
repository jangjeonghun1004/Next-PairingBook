import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 내 토론 정보 가져오기 API
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
    
    // 1. 참여 중인 토론 목록 가져오기
    const discussions = await prisma.discussionParticipant.findMany({
      where: {
        userId: userId,
        status: {
          in: ["approved", "pending"] // 승인된 참여와 대기 중인 참여 모두 포함
        }
      },
      include: {
        discussion: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true
              }
            },
            participants: {
              where: {
                status: "approved"
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true
                  }
                }
              },
              take: 5 // 최대 5명의 참여자만 표시
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // 더 많은 토론을 가져옵니다
    });
    
    // 2. 내가 생성한 토론의 참여 신청자 목록 가져오기
    const myCreatedDiscussions = await prisma.discussion.findMany({
      where: {
        authorId: userId
      },
      include: {
        participants: {
          where: {
            status: "pending"
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    // 참여 신청자가 있는 토론만 필터링
    const discussionsWithPendingRequests = myCreatedDiscussions.filter(
      discussion => discussion.participants.length > 0
    );
    
    // 데이터 포맷팅 및 반환
    return NextResponse.json({
      myDiscussions: discussions.map(d => ({
        ...d.discussion,
        participantCount: d.discussion.participants.length,
        status: d.status
      })),
      pendingRequests: discussionsWithPendingRequests.map(d => ({
        id: d.id,
        title: d.title,
        bookTitle: d.bookTitle,
        bookAuthor: d.bookAuthor,
        createdAt: d.createdAt,
        imageUrls: d.imageUrls,
        pendingParticipants: d.participants.map(p => ({
          id: p.id,
          userId: p.user.id,
          name: p.user.name,
          image: p.user.image,
          requestDate: p.createdAt
        }))
      }))
    });
    
  } catch (error) {
    console.error('내 토론 정보 가져오기 오류:', error);
    return NextResponse.json(
      { error: '토론 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 