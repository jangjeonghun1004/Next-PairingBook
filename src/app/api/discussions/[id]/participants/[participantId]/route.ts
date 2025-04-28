import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs"; // if you need node-only APIs

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; participantId: string }> }
): Promise<NextResponse> {
  try {
    // 인증 확인
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // await the async params
    const { id: discussionId, participantId } = await context.params;

    const { status } = await request.json();
    if (!["approved","rejected","pending"].includes(status.toLowerCase())) {
      return NextResponse.json({ error: "유효하지 않은 상태 값입니다." }, { status: 400 });
    }
    const normalized = status.toUpperCase();

    // 토론과 권한 확인…
    const discussion = await prisma.discussion.findUnique({ where: { id: discussionId } });
    if (!discussion) {
      return NextResponse.json({ error: "토론을 찾을 수 없습니다." }, { status: 404 });
    }
    if (discussion.authorId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 상태 업데이트
    const updated = await prisma.discussionParticipant.update({
      where: { id: participantId, discussionId },
      data: { status: normalized },
    });

    return NextResponse.json({ success: true, participant: updated });
  } catch (err) {
    console.error("참여자 상태 업데이트 오류:", err);
    return NextResponse.json(
      { error: "참여자 상태 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
