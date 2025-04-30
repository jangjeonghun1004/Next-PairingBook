import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// 헤더 정보를 위한 인터페이스 정의
interface RequestHeaders {
  [key: string]: string;
}

// 사용자 검색 (GET: /api/users/search?query=검색어)
export async function GET(request: Request) {
  console.log('API 실행: 사용자 검색 요청 시작');
  
  try {
    // 요청 디버깅 정보 로깅 
    const url = new URL(request.url);
    const isDebug = url.searchParams.get('debug') === 'true';
    const clientId = url.searchParams.get('client');
    
    if (isDebug) {
      // 요청 헤더 로깅
      console.log('API 디버깅 - 요청 정보:', {
        url: request.url,
        clientId,
        method: request.method
      });
      
      // 헤더 정보 로깅 (쿠키 포함)
      const headers: RequestHeaders = {};
      request.headers.forEach((value, key) => {
        headers[key] = value;
      });
      console.log('API 디버깅 - 요청 헤더:', headers);
    }
    
    // 세션 확인
    const session = await auth();
    
    if (isDebug) {
      console.log('API 디버깅 - 세션 정보:', {
        authenticated: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id || 'null'
      });
    }
    
    if (!session || !session.user) {
      console.error('API 인증 오류: 세션 정보가 없음');
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다. 로그인 후 다시 시도해주세요.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    console.log('API 검색 요청 받음:', { query, userId: session.user.id });

    if (!query || query.trim() === '') {
      console.error('API 검색 오류: 검색어 누락');
      return NextResponse.json(
        { error: '검색어가 필요합니다.' },
        { status: 400 }
      );
    }

    // Prisma 데이터베이스 연결 확인
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('API 검색: 데이터베이스 연결 확인됨');
    } catch (dbError) {
      console.error('API 검색: 데이터베이스 연결 오류', dbError);
      return NextResponse.json(
        { error: '데이터베이스 연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 503 }
      );
    }

    // 실제 구현 시 데이터베이스에서 사용자 검색
    const users = await prisma.user.findMany({
      where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
        ],
        NOT: { id: session.user.id }, // 자기 자신 제외
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      take: 10,
    });

    const count = users.length;
    console.log(`API 검색 결과: ${count}명의 사용자 찾음`);
    
    // 성공 응답에 디버그 정보 추가
    const response: {
      users: typeof users;
      count: number;
      query: string;
      debug?: {
        timestamp: string;
        sessionActive: boolean;
        userId: string;
      };
    } = {
      users,
      count,
      query
    };
    
    if (isDebug) {
      response.debug = {
        timestamp: new Date().toISOString(),
        sessionActive: true,
        userId: session.user.id
      };
    }
    
    // 빈 결과일 경우 빈 배열 반환
    return NextResponse.json(response);
  } catch (error) {
    console.error('사용자 검색 오류 상세정보:', error);
    
    // 오류 유형에 따른 처리
    if (error instanceof Error) {
      // Prisma 오류 처리
      if (error.name === 'PrismaClientKnownRequestError' || 
          error.name === 'PrismaClientUnknownRequestError' ||
          error.name === 'PrismaClientRustPanicError' ||
          error.name === 'PrismaClientInitializationError') {
        console.error('Prisma 데이터베이스 오류:', error.message);
        return NextResponse.json(
          { error: '데이터베이스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
          { status: 503 }
        );
      }
      
      // 기타 알려진 오류
      return NextResponse.json(
        { error: `사용자 검색 중 오류가 발생했습니다: ${error.message}` },
        { status: 500 }
      );
    }
    
    // 알 수 없는 오류
    return NextResponse.json(
      { error: '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
} 