import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { prisma } from '@/lib/prisma';

// 댓글 삭제 API
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    
    // 인증 세션 확인
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // 댓글 존재 여부 및 작성자 확인
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });
    
    if (!comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 댓글 작성자만 삭제 가능
    if (comment.userId !== userId) {
      return NextResponse.json(
        { error: '이 댓글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }
    
    // 댓글 삭제
    await prisma.comment.delete({
      where: { id: commentId }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('댓글 삭제 중 오류 발생:', error);
    return NextResponse.json(
      { error: '댓글을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 