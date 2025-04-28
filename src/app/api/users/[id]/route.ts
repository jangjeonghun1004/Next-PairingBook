import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id: userId } = await context.params;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
            },
        });

        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('[USER_GET]', error);
        return new NextResponse('Internal error', { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 자신의 프로필만 수정 가능
        const { id: userId } = await params;
        if (session.user.id !== userId) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // JSON 형식의 요청 처리
        const requestData = await request.json();
        const { name, image } = requestData;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                ...(image && { image }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('[USER_PATCH]', error);
        return new NextResponse('Internal error', { status: 500 });
    }
}

export async function PUT(
    //request: NextRequest,
    //{ params }: { params: Promise<{ id: string }> }
) {
    try {
        //const { id: userId } = await params;
        // ... 중간 코드 생략 ...
    } catch (error) {
        console.error('[USER_PUT]', error);
        return new NextResponse('Internal error', { status: 500 });
    }
} 