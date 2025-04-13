'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 이메일 유효성 검사
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('유효한 이메일 형식이 아닙니다.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // 비밀번호 재설정 이메일 전송 API 호출 (아직 구현되지 않았으므로 성공 시뮬레이션)
      // 실제 구현시 아래 주석 해제
      // const response = await fetch('/api/auth/forgot-password', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ email }),
      // });

      // if (!response.ok) {
      //   const data = await response.json();
      //   throw new Error(data.error || '비밀번호 재설정 이메일 전송에 실패했습니다.');
      // }

      // 성공 시뮬레이션 (API 구현 후 삭제)
      await new Promise(resolve => setTimeout(resolve, 1500));

      setEmailSent(true);
      toast.success('비밀번호 재설정 이메일이 전송되었습니다.');
    } catch (error: any) {
      setError(error.message || '비밀번호 재설정 메일 전송 중 오류가 발생했습니다.');
      toast.error('요청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-gray-700 w-full max-w-md shadow-xl">


        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            비밀번호 찾기
          </h1>
          <div className="w-5"></div> {/* 좌우 균형을 위한 빈 공간 */}
        </div>
        <p className="text-gray-400 text-sm mb-6">
          가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
        </p>

        {emailSent ? (
          <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4 text-sm">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-400 mb-1">이메일이 전송되었습니다</h3>
                <p className="text-gray-300">
                  <span className="font-medium">{email}</span>로 비밀번호 재설정 링크를 전송했습니다.
                  이메일을 확인하고 링크를 클릭하여 비밀번호를 재설정해주세요.
                </p>
                <p className="mt-2 text-gray-400 text-xs">
                  이메일이 도착하지 않았다면 스팸함을 확인해보세요.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                이메일
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800/50 border ${error ? "border-red-500" : "border-gray-700"
                    } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors`}
                  placeholder="가입하신 이메일을 입력하세요"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              {error && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              )}
            </div>

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
                "비밀번호 재설정 링크 발송"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 