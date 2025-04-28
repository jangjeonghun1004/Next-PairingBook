import { NextResponse } from 'next/server';
import { auth } from '@/auth';


// Next-Auth v5 방식으로 미들웨어 구현
export default auth((req) => {
  const { auth, nextUrl } = req;
  const isLoggedIn = !!auth?.user;
  
  // 인증이 필요한 경로 패턴 확인
  const protectedPaths = ['/myhome', '/profile'];
  const isProtectedPath = protectedPaths.some(path => nextUrl.pathname.startsWith(path));
  
  // 인증이 필요한 페이지 접근 시 인증 확인
  if (isProtectedPath) {
    console.log(`인증 확인: ${nextUrl.pathname} 경로 접근`, isLoggedIn ? '인증됨' : '미인증');
    
    if (!isLoggedIn) {
      // 로그인 후 원래 페이지로 돌아올 수 있도록 현재 URL을 callbackUrl로 설정
      const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
      return NextResponse.redirect(new URL(`/?callbackUrl=${callbackUrl}`, nextUrl.origin));
    }
  }
  
  return NextResponse.next();
});

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: ['/myhome/:path*', '/profile/:path*']
}; 