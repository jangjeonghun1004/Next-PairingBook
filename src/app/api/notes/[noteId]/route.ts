import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// 특정 쪽지 조회 (GET: /api/notes/:noteId)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ noteId: string }> }
  // { params }:  { params: Promise<{ noteId: string }> }
): Promise<NextResponse> {
  try {
    //const noteId = params.noteId;
    const { noteId: noteId } = await context.params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const userId = session.user.id;
    
    console.log('쪽지 상세 조회:', { noteId, userId });

    // Prisma를 사용하여 실제 데이터베이스에서 쪽지 조회
    const note = await prisma.note.findUnique({
      where: {
        id: noteId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // 쪽지가 존재하지 않는 경우
    if (!note) {
      return NextResponse.json({ error: '쪽지를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 확인: 해당 사용자가 쪽지의 발신자 또는 수신자인지 확인
    if (note.senderId !== userId && note.receiverId !== userId) {
      return NextResponse.json({ error: '이 쪽지에 접근할 권한이 없습니다.' }, { status: 403 });
    }

    // 읽음 상태 업데이트 (수신자가 쪽지를 보는 경우)
    if (note.receiverId === userId && !note.isRead) {
      await prisma.note.update({
        where: { id: noteId },
        data: { isRead: true }
      });
    }

    // 클라이언트에 반환할 쪽지 데이터 구성
    const noteData = {
      id: note.id,
      senderId: note.senderId,
      senderName: note.sender.name,
      receiverId: note.receiverId,
      receiverName: note.receiver.name,
      title: note.title,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      isRead: note.isRead,
    };

    console.log('API 응답 데이터:', JSON.stringify(noteData, null, 2));
    return NextResponse.json(noteData);
  } catch (error) {
    console.error('쪽지 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '쪽지를 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 쪽지 삭제 (DELETE: /api/notes/:noteId)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ noteId: string }> }
  // { params }: { params: { noteId: string } }
): Promise<NextResponse> {
  try {
    // const noteId = params.noteId;
    const { noteId: noteId } = await context.params;
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const userId = session.user.id;
    
    console.log('쪽지 삭제 요청:', { noteId, userId });

    // 쪽지가 존재하는지 확인하고 권한 체크
    const note = await prisma.note.findUnique({
      where: { id: noteId }
    });

    if (!note) {
      return NextResponse.json({ error: '쪽지를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 확인: 본인이 보낸 쪽지나 받은 쪽지만 삭제할 수 있음
    if (note.senderId !== userId && note.receiverId !== userId) {
      return NextResponse.json({ error: '이 쪽지를 삭제할 권한이 없습니다.' }, { status: 403 });
    }

    // 쪽지 삭제
    await prisma.note.delete({
      where: { id: noteId }
    });

    return NextResponse.json({ success: true, message: '쪽지가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('쪽지 삭제 중 오류 발생:', error);
    return NextResponse.json({ error: '쪽지를 삭제하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}