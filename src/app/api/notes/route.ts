import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';


// 쪽지 목록 조회 (GET: /api/notes?type=received|sent)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'received'; // 기본값은 받은 쪽지
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // 실제 DB 조회 전에 임시 데이터 반환 (개발 중 API로 사용)
    // 실제 코드는 아래와 같이 주석 처리된 코드를 사용
    
    /*
    // 임시 데이터 생성
    const mockNotes = [];
    for (let i = 1; i <= 15; i++) {
      mockNotes.push({
        id: `note-${i}`,
        senderId: type === 'received' ? 'user1' : userId,
        senderName: type === 'received' ? '홍길동' : '나',
        receiverId: type === 'received' ? userId : `user${i}`,
        receiverName: type === 'received' ? '나' : `수신자${i}`,
        title: `테스트 쪽지 ${i}`,
        content: `이것은 테스트 쪽지입니다. 내용은 길어질 수도 있고 짧을 수도 있습니다. 이 쪽지는 테스트 목적으로 작성되었습니다.`,
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        isRead: i > 3
      });
    }

    return NextResponse.json({
      notes: mockNotes,
      totalCount: mockNotes.length,
      page,
      limit,
      totalPages: Math.ceil(mockNotes.length / limit),
    });
    */

    // 쿼리 조건 설정
    const where = type === 'received' 
      ? { receiverId: userId, receiverDeleted: false } 
      : { senderId: userId, senderDeleted: false };

    // 쪽지 총 개수 조회
    const totalCount = await prisma.note.count({ where });

    // 쪽지 목록 조회
    const notes = await prisma.note.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // 받은 쪽지의 경우 읽음 상태 업데이트
    // if (type === 'received') {
    //   const unreadNoteIds = notes
    //     .filter((note) => !note.isRead)
    //     .map((note) => note.id);

    //   if (unreadNoteIds.length > 0) {
    //     await prisma.note.updateMany({
    //       where: {
    //         id: { in: unreadNoteIds },
    //       },
    //       data: {
    //         isRead: true,
    //       },
    //     });
    //   }
    // }

    // 클라이언트에 필요한 형태로 변환
    const formattedNotes = notes.map((note) => ({
      id: note.id,
      senderId: note.senderId,
      senderName: note.sender.name || '알 수 없음',
      receiverId: note.receiverId,
      receiverName: note.receiver.name || '알 수 없음',
      title: note.title,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      isRead: note.isRead,
    }));

    return NextResponse.json({
      notes: formattedNotes,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error('쪽지 목록 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '쪽지 목록을 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 쪽지 전송 (POST: /api/notes)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const senderId = session.user.id;
    const body = await request.json();
    
    const { receivers, title, content } = body;
    
    if (!receivers || !Array.isArray(receivers) || receivers.length === 0) {
      return NextResponse.json({ error: '수신자 정보가 없습니다.' }, { status: 400 });
    }
    
    if (!title || !title.trim()) {
      return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 });
    }
    
    if (!content || !content.trim()) {
      return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 });
    }

    /*
    // 임시 응답: 실제 데이터베이스 작업 대신 성공 응답만 반환
    return NextResponse.json({
      success: true,
      count: receivers.length,
      noteIds: receivers.map((_, index) => `mock-note-${index + 1}`),
    });
    */

    // 여러 수신자에게 쪽지 전송
    const notePromises = receivers.map(receiver => 
      prisma.note.create({
        data: {
          senderId,
          receiverId: receiver.id,
          title: title.trim(),
          content: content.trim(),
          isRead: false,
          senderDeleted: false,
          receiverDeleted: false,
        },
      })
    );

    const createdNotes = await Promise.all(notePromises);

    return NextResponse.json({
      success: true,
      count: createdNotes.length,
      noteIds: createdNotes.map((note) => note.id),
    });
  } catch (error) {
    console.error('쪽지 전송 중 오류 발생:', error);
    return NextResponse.json({ error: '쪽지 전송 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 