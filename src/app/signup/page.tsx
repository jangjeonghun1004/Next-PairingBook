'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, User, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 입력 값 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // 입력 시 해당 필드 에러 초기화
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  
  // 비밀번호 유효성 검사
  const validatePassword = (password: string) => {
    // 최소 8자, 소문자, 숫자, 특수문자 포함
    const hasMinLength = password.length >= 8;
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
    
    return {
      isValid: hasMinLength && hasLowercase && hasNumber && hasSpecialChar,
      errors: {
        minLength: !hasMinLength,
        lowercase: !hasLowercase,
        number: !hasNumber,
        specialChar: !hasSpecialChar,
      },
    };
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
    } else {
      const { isValid } = validatePassword(formData.password);
      if (!isValid) {
        newErrors.password = "비밀번호 요구사항을 충족해야 합니다";
      }
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호 확인을 입력해주세요";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다";
    }
    
    if (!formData.name.trim()) {
      newErrors.name = "닉네임을 입력해주세요";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // 폼 제출 처리
    setIsSubmitting(true);
    
    try {
      // 회원가입 API 호출
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '회원가입 중 오류가 발생했습니다.');
      }
      
      // 회원가입 성공 후 자동 로그인
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      // 로그인 성공 시 홈으로 이동
      router.push('/');
    } catch (error) {
      // 에러 처리
      setErrors({ form: error instanceof Error ? error.message : "회원가입 중 오류가 발생했습니다. 다시 시도해주세요." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 비밀번호 요구사항 충족 여부 검사
  const passwordValidation = validatePassword(formData.password);
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 md:p-8 shadow-xl border border-gray-800">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              회원가입
            </h1>
            <div className="w-5"></div> {/* 좌우 균형을 위한 빈 공간 */}
          </div>
          
          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이메일 */}
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
                  className={`w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800/50 border ${
                    errors.email ? "border-red-500" : "border-gray-700"
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
            
            {/* 비밀번호 */}
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
                  className={`w-full pl-10 pr-10 py-3 rounded-lg bg-gray-800/50 border ${
                    errors.password ? "border-red-500" : "border-gray-700"
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
              
              {/* 비밀번호 요구사항 */}
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-400 mb-1">비밀번호 요구사항:</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div className={`text-xs flex items-center gap-1 ${
                    !formData.password || passwordValidation.errors.minLength ? "text-gray-500" : "text-green-500"
                  }`}>
                    {!formData.password || passwordValidation.errors.minLength ? (
                      <div className="w-3 h-3 rounded-full border border-gray-500" />
                    ) : (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    <span>8자 이상</span>
                  </div>
                  <div className={`text-xs flex items-center gap-1 ${
                    !formData.password || passwordValidation.errors.lowercase ? "text-gray-500" : "text-green-500"
                  }`}>
                    {!formData.password || passwordValidation.errors.lowercase ? (
                      <div className="w-3 h-3 rounded-full border border-gray-500" />
                    ) : (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    <span>소문자 포함</span>
                  </div>
                  <div className={`text-xs flex items-center gap-1 ${
                    !formData.password || passwordValidation.errors.number ? "text-gray-500" : "text-green-500"
                  }`}>
                    {!formData.password || passwordValidation.errors.number ? (
                      <div className="w-3 h-3 rounded-full border border-gray-500" />
                    ) : (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    <span>숫자 포함</span>
                  </div>
                  <div className={`text-xs flex items-center gap-1 ${
                    !formData.password || passwordValidation.errors.specialChar ? "text-gray-500" : "text-green-500"
                  }`}>
                    {!formData.password || passwordValidation.errors.specialChar ? (
                      <div className="w-3 h-3 rounded-full border border-gray-500" />
                    ) : (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    <span>특수문자 포함</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                비밀번호 확인
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-3 rounded-lg bg-gray-800/50 border ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-700"
                  } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors`}
                  placeholder="비밀번호를 다시 입력하세요"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            
            {/* 이름 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                닉네임
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800/50 border ${
                    errors.name ? "border-red-500" : "border-gray-700"
                  } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors`}
                  placeholder="닉네임을 입력하세요"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>
            
            {/* 폼 에러 */}
            {errors.form && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{errors.form}</p>
              </div>
            )}
            
            {/* 제출 버튼 */}
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
                "회원가입"
              )}
            </button>
          </form>
          
          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              이미 계정이 있으신가요?{" "}
              <Link href="/" className="text-indigo-400 hover:text-indigo-300 font-medium">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 