import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// 읽지 않은 쪽지 수 조회 API (GET: /api/notes/unread)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // 읽지 않은 쪽지 수 조회
    const unreadCount = await prisma.note.count({
      where: {
        receiverId: userId,
        isRead: false,
        receiverDeleted: false
      }
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error('읽지 않은 쪽지 수 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '읽지 않은 쪽지 수를 가져오는 중 오류가 발생했습니다.', unreadCount: 0 }, { status: 500 });
  }
} 