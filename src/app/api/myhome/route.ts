import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // 1. 팔로우한 사용자 목록 가져오기
    const following = await prisma.userFollow.findMany({
      where: {
        followerId: userId
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            image: true,
            stories: {
              take: 1,
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // 팔로우한 사용자 정보 매핑
    const followedUsers = following.map(f => ({
      id: f.following.id,
      name: f.following.name,
      image: f.following.image,
      lastActive: f.following.stories[0]?.createdAt || f.createdAt,
      isOnline: Math.random() > 0.3 // 실제 온라인 상태는 추후 구현
    }));
    
    // 2. 자신이 팔로우한 유저들의 최근 스토리들 가져오기
    const followedIds = following.map(f => f.followingId);
    const recentStories = await prisma.story.findMany({
      where: {
        authorId: {
          in: followedIds
        }
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    // 3. 참여 중인 토론 목록 가져오기
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
    
    // 4. 내가 생성한 토론의 참여 신청자 목록 가져오기
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
    
    // 5. 자신이 작성한 최근 스토리 가져오기
    const myStories = await prisma.story.findMany({
      where: {
        authorId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    // 6. 자신이 좋아요 표시한 스토리 가져오기
    const likedStories = await prisma.userLike.findMany({
      where: {
        userId: userId
      },
      include: {
        story: {
          include: {
            author: {
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
      take: 5
    });
    
    // 데이터 포맷팅 및 반환
    return NextResponse.json({
      followedUsers,
      recentStories,
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
      })),
      myStories,
      likedStories: likedStories.map(like => like.story)
    });
    
  } catch (error) {
    console.error('마이홈 데이터 가져오기 오류:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 