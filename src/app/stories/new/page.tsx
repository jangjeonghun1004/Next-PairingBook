'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  X,
  AlertCircle,
  Image as ImageIcon,
  Send
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { toast } from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import SearchModal from '@/components/SearchModal';

interface ImageFile {
  file: File;
  previewUrl: string;
  id: string;
}

interface UploadedImage {
  url: string;
}

export default function NewStoryPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("novel");
  const [errors, setErrors] = useState<{
    content?: string;
    images?: string;
    form?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    // 페이지 진입 시 스크롤을 맨 위로
    window.scrollTo(0, 0);
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!content.trim()) {
      newErrors.content = "내용을 입력해주세요";
    }
    if (images.length === 0) {
      newErrors.images = "최소 1개의 이미지를 추가해주세요";
    }
    if (images.length > 5) {
      newErrors.images = "최대 5개의 이미지만 추가할 수 있습니다";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length + images.length > 5) {
      setErrors({ ...errors, images: "최대 5개의 이미지만 추가할 수 있습니다" });
      return;
    }

    const newImages = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7)
    }));

    setImages(prev => [...prev, ...newImages]);
    if (errors.images) {
      setErrors({ ...errors, images: undefined });
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      // 이미지가 모두 삭제되면 에러 표시
      if (filtered.length === 0) {
        setErrors(prev => ({ ...prev, images: "최소 1개의 이미지를 추가해주세요" }));
      }
      return filtered;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error("로그인이 필요합니다.");
      router.push("/");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 이미지 업로드 처리
      const uploadedImages: UploadedImage[] = [];

      if (images.length > 0) {
        const imageUploads = images.map(async (image) => {
          try {
            // Supabase Storage에 이미지 업로드
            const fileName = `story-images/${Date.now()}_${image.file.name}`;
            const { data, error } = await supabase.storage
              .from('story-images')
              .upload(fileName, image.file, {
                cacheControl: '3600',
                upsert: false
              });

            if (error) {
              throw new Error(`이미지 업로드 오류: ${error.message}`);
            }

            // 이미지 URL 생성
            const { data: publicUrlData } = supabase.storage
              .from('story-images')
              .getPublicUrl(fileName);

            return { url: publicUrlData.publicUrl };
          } catch (err) {
            console.error("이미지 업로드 실패:", err);
            // 에러가 발생하면 로컬 임시 URL 사용
            return { url: URL.createObjectURL(image.file) };
          }
        });

        // 모든 이미지 업로드 완료 대기
        uploadedImages.push(...await Promise.all(imageUploads));
      }

      // API 라우트를 통해 스토리 데이터 저장
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: '',
          content,
          category: selectedCategory,
          images: uploadedImages
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '스토리 저장 중 오류가 발생했습니다.');
      }

      // 성공 시 스토리 목록 페이지로 이동
      toast.success("이야기가 성공적으로 등록되었습니다!");
      router.push("/stories");

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "이야기 작성 중 오류가 발생했습니다.";
      setErrors({ form: errorMessage });
      setIsSubmitting(false);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar onSearchClick={() => setIsSearchOpen(true)} />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <div className="sm:pl-[80px] lg:pl-[240px]"> {/* Sidebar 너비를 고려한 좌측 패딩 (모바일에서는 제거) */}
        <div className="max-w-4xl mx-auto px-3 py-6 sm:px-4 sm:py-8 md:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6 sticky top-0 z-10 bg-gradient-to-r from-gray-900/95 to-gray-900/95 backdrop-blur-md py-3 sm:py-4 rounded-xl px-3 sm:px-4">
            <Link
              href="/stories"
              className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-800/70 transition-all duration-200 transform hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">뒤로가기</span>
            </Link>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">이야기</h1>
            <div className="w-[72px] sm:w-[89px]"></div> {/* 좌우 균형을 맞추기 위한 더미 div */}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 mt-4 sm:mt-6">
            {/* 내용 */}
            <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
              <label htmlFor="content" className="block text-sm font-medium mb-2 sm:mb-3 text-gray-300">
                내용
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (errors.content) {
                    setErrors({ ...errors, content: undefined });
                  }
                }}
                className={`w-full h-48 sm:h-64 p-3 sm:p-4 rounded-xl bg-gray-800/80 text-white placeholder-gray-400 focus:outline-none focus:ring-2 resize-none border ${errors.content ? "border-red-500 focus:ring-red-500" : "border-gray-700 focus:ring-indigo-500"
                  } transition-all duration-200 shadow-inner text-sm sm:text-base`}
                placeholder="이야기의 내용을 입력하세요"
              />
              {errors.content && (
                <div className="flex items-center gap-1 mt-2 text-red-400 text-xs sm:text-sm">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{errors.content}</span>
                </div>
              )}
            </div>

            {/* 이미지 업로드 */}
            <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
              <label className="block text-sm font-medium mb-2 sm:mb-3 text-gray-300">이미지</label>
              <div className="space-y-3 sm:space-y-4">
                {/* 이미지 그리드 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                  {/* 이미지 추가 버튼 */}
                  <label className={`relative flex items-center justify-center w-full aspect-[4/3] rounded-xl cursor-pointer transition-all duration-300 border-2 border-dashed overflow-hidden group ${errors.images
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-gray-600 bg-gray-800/50 hover:bg-gray-800 hover:border-indigo-500 hover:shadow-lg'
                    }`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      multiple
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-1 sm:gap-2 transition-transform duration-200 group-hover:scale-110">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-400" />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-300 font-medium">이미지 추가</span>
                      <span className="text-xs text-gray-500">{images.length}/5</span>
                    </div>
                  </label>

                  {/* 이미지 미리보기 */}
                  {images.map((image) => (
                    <div key={image.id} className="relative group aspect-[4/3] rounded-xl overflow-hidden shadow-lg border border-gray-700 transition-all duration-300 hover:shadow-xl hover:border-gray-500">
                      <img
                        src={image.previewUrl}
                        alt="미리보기"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end">
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="p-1.5 sm:p-2 m-2 sm:m-3 rounded-full bg-red-500/80 hover:bg-red-600 transition-all duration-200 hover:scale-110 shadow-lg"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 에러 메시지 */}
                {errors.images && (
                  <div className="flex items-center gap-1 text-red-400 text-xs sm:text-sm mt-2">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{errors.images}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-center mt-6 sm:mt-10">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-500 hover:to-blue-500 transition-all duration-200 hover:shadow-lg shadow-indigo-700/20 flex-1 sm:flex-auto text-sm sm:text-base ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg
                        className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>처리 중...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>작성하기</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 