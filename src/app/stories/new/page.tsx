'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  X,
  AlertCircle,
  Image as ImageIcon,
  Send,
  BookOpen
} from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from 'react-hot-toast';
import SubmittingLoading from "@/components/loading/SubmittingLoading";
import { useUploadImage } from "@/app/hooks/useUploadImage";

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
  const [content, setContent] = useState("");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [errors, setErrors] = useState<{
    content?: string;
    images?: string;
    form?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { uploadImage } = useUploadImage("story-images");

  const validateForm = (): boolean => {
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
      // 1) Parallel batch upload via Promise.all
      const urls = await Promise.all(
        images.map((img) => uploadImage(img.file))
      );
      const uploadedImages: UploadedImage[] = urls.map((u) => ({ url: u }));

      // 2) API 라우트를 통해 스토리 데이터 저장
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: '',
          content,
          category: 'story',
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
    <div className="min-h-screen flex flex-col items-center px-4 pb-8 w-full">
      <div className="w-full max-w-4xl pt-12 md:pt-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6 sticky top-0 z-10 bg-gradient-to-r from-gray-900/95 to-gray-900/95 backdrop-blur-md py-3 sm:py-4 rounded-xl px-3 sm:px-4">
          <Link
            href="/stories"
            className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-800/70 transition-all duration-200 transform hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500 absolute left-1/2 transform -translate-x-1/2">새 이야기</h1>
          <div className="w-[36px] h-[36px] sm:w-[72px]"></div> {/* 좌우 균형을 맞추기 위한 더미 div */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 mt-4 sm:mt-6">
          {/* 내용 */}
          <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <h2 className="text-lg font-medium">내용</h2>
            </div>

            <textarea
              id="content"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content) {
                  setErrors({ ...errors, content: undefined });
                }
              }}
              className={`w-full h-48 p-3 rounded-xl bg-gray-800/80 text-white placeholder-gray-400 focus:outline-none focus:ring-2 resize-none border ${errors.content ? "border-red-500 focus:ring-red-500" : "border-gray-700 focus:ring-indigo-500"
                } transition-all duration-200 shadow-inner text-base`}
              placeholder="이야기의 내용을 입력하세요"
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />

            {/* 내용 에러 메세지 */}
            {errors.content && (
              <div className="flex items-center gap-1 mt-2 text-red-400 text-xs sm:text-sm">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{errors.content}</span>
              </div>
            )}
          </div>

          {/* 이미지 업로드 */}
          <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <h2 className="text-lg font-medium">이미지</h2>
            </div>

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
                  <div key={image.id} className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                    <img
                      src={image.previewUrl}
                      alt="미리보기"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-red-500/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 이미지 에러 메세지 */}
              {errors.images && (
                <div className="flex items-center gap-1 text-red-400 text-xs sm:text-sm mt-2">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{errors.images}</span>
                </div>
              )}
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white font-medium hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <SubmittingLoading />
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
  );
} 