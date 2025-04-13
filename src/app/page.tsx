'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Logo from "@/components/Logo";
import { ArrowRight } from "lucide-react";
import Loading from "@/components/Loading";

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 이미 로그인되어 있으면 스토리 페이지로 리다이렉트
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/stories');
    }
  }, [session, status, router]);

  // 입력 값 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // 입력 시 해당 필드 에러 초기화
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "이메일을 입력해주세요";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다";
    }

    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 폼 제출 처리
    setIsSubmitting(true);

    try {
      // NextAuth 로그인
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // 로그인 성공 시 홈으로 이동
      router.push('/stories');
    } catch (error) {
      // 에러 처리
      setErrors({ form: error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다. 다시 시도해주세요." });
      setIsSubmitting(false);
    }
  };

  // 로그인 중이거나 이미 로그인된 상태라면 로딩 화면 표시
  if (status === 'loading' || status === 'authenticated') {
    return (<Loading />);
  }

  return (
    <div className="min-h-screen text-white relative">
      {/* 상단 헤더 */}
      <header className="fixed top-0 left-0 right-0 h-16 md:h-20 flex items-center justify-between px-4 md:px-6 z-50">
        <div className="flex items-center gap-2 md:gap-4">
          <Logo size="lg" />
          <div className="flex items-baseline gap-1 md:gap-2">
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              페어링
            </span>
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              BOOK
            </span>
          </div>
        </div>
        <a
          href="/stories"
          className="flex items-center gap-1 md:gap-2 text-gray-300 hover:text-white text-sm font-medium transition-all duration-300 group"
        >
          <span>둘러 보기</span>
          <ArrowRight className="w-3 h-3 md:w-4 md:h-4 transition-transform duration-300 group-hover:translate-x-1" />
          <span className="absolute w-0 h-px bg-gradient-to-r from-indigo-400 to-purple-500 bottom-0 left-0 group-hover:w-full transition-all duration-300"></span>
        </a>
      </header>

      <div className="min-h-screen flex items-center justify-center">
        <div className="flex w-full max-w-6xl gap-8 px-4">
          {/* 좌측 섹션 - 모바일에서는 숨김 */}
          <div className="hidden md:block w-1/2 flex items-center justify-center">
            <div className="text-center max-w-2xl px-7">
              <div className="mb-8 md:mb-12">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  당신의 독서 경험을<br />
                  공유하고 연결하세요
                </h1>
                <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
                  좋아하는 책을 발견하고,<br />
                  리뷰를 공유하고,<br />
                  다른 독자들과 소통하세요.
                </p>
              </div>
              <div className="flex justify-center gap-4 md:gap-6 mt-8 md:mt-12">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-8 md:mt-12 text-center">
                <a
                  href="/stories"
                  className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-indigo-500/25"
                >
                  <span>둘러 보기</span>
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>

          {/* 우측 로그인 섹션 - 모바일에서는 전체 너비 사용 */}
          <div className="w-full md:w-1/2 flex items-center justify-center">
            <div className="w-full max-w-md bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 md:p-8 shadow-xl border border-gray-800">
              <div className="text-center mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  환영합니다
                </h2>
                <p className="text-gray-400 mt-4">당신의 독서 여정을 시작하세요</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    이메일
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800/50 border ${errors.email ? "border-red-500" : "border-gray-700"
                        } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors`}
                      placeholder="이메일을 입력하세요"
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    비밀번호
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-10 py-3 rounded-lg bg-gray-800/50 border ${errors.password ? "border-red-500" : "border-gray-700"
                        } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors`}
                      placeholder="비밀번호를 입력하세요"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.password}
                    </p>
                  )}
                  <div className="mt-1 flex justify-end">
                    <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                      비밀번호 찾기
                    </Link>
                  </div>
                </div>

                {/* 폼 에러 */}
                {errors.form && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{errors.form}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
                    </div>
                  ) : (
                    "로그인"
                  )}
                </button>
              </form>
              <div className="mt-4 md:mt-6 text-center">
                <p className="text-sm text-gray-400">
                  계정이 없으신가요?{" "}
                  <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">
                    회원가입
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
