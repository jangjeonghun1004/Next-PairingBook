'use client';
import { 
  ArrowLeft, 
  X, 
  Plus,
  BookOpen,
  PenLine,
  BookText,
  ScrollText,
  UserRound,
  Clock,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ImageFile {
  file: File;
  previewUrl: string;
  id: string;
}

const categories = [
  { id: "novel", name: "소설", icon: BookOpen },
  { id: "essay", name: "에세이", icon: PenLine },
  { id: "nonfiction", name: "논픽션", icon: BookText },
  { id: "poetry", name: "시", icon: ScrollText },
  { id: "biography", name: "전기", icon: UserRound },
  { id: "history", name: "역사", icon: Clock },
];

export default function NewStoryPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [errors, setErrors] = useState<{
    category?: string;
    title?: string;
    content?: string;
    images?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!category) {
      newErrors.category = "카테고리를 선택해주세요";
    }
    if (!title.trim()) {
      newErrors.title = "제목을 입력해주세요";
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // TODO: API 연동
      console.log({ title, content, category, images });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/stories"
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">뒤로가기</span>
          </Link>
          <h1 className="text-xl font-bold">새 독서 이야기</h1>
          <div className="w-10" />
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 제목 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              제목
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) {
                  setErrors({ ...errors, title: undefined });
                }
              }}
              className={`w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                errors.title ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"
              }`}
              placeholder="독서 이야기의 제목을 입력하세요"
            />
            {errors.title && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.title}</span>
              </div>
            )}
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium mb-2">카테고리</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      if (errors.category) {
                        setErrors({ ...errors, category: undefined });
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      category === cat.id
                        ? "border-indigo-500 bg-indigo-500/10"
                        : errors.category
                        ? "border-red-500"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-1 text-gray-300" />
                    <span className="text-xs">{cat.name}</span>
                  </button>
                );
              })}
            </div>
            {errors.category && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.category}</span>
              </div>
            )}
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium mb-2">이미지</label>
            <div className="space-y-4">
              {/* 이미지 그리드 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {/* 이미지 추가 버튼 */}
                <label className={`relative flex items-center justify-center w-full aspect-[4/3] rounded-xl bg-gray-800 cursor-pointer hover:bg-gray-700 transition-all duration-300 border-2 border-dashed ${errors.images ? 'border-red-500' : 'border-gray-700 hover:border-indigo-500'}`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    multiple
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-indigo-500" />
                    </div>
                    <span className="text-sm text-gray-400">이미지 추가</span>
                    <span className="text-xs text-gray-500">{images.length}/5</span>
                  </div>
                </label>

                {/* 이미지 미리보기 */}
                {images.map((image) => (
                  <div key={image.id} className="relative group aspect-[4/3]">
                    <img
                      src={image.previewUrl}
                      alt="미리보기"
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="p-2 rounded-full bg-gray-900/80 hover:bg-gray-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 에러 메시지 */}
              {errors.images && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.images}</span>
                </div>
              )}

              {/* 이미지 가이드라인 */}
              <div className="text-sm text-gray-400 space-y-1">
                <p>• 최대 5개의 이미지를 업로드할 수 있습니다.</p>
                <p>• 각 이미지는 최대 5MB까지 허용됩니다.</p>
                <p>• 권장 이미지 크기: 1200x800px</p>
              </div>
            </div>
          </div>

          {/* 내용 */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
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
              className={`w-full h-64 p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 resize-none ${
                errors.content ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"
              }`}
              placeholder="독서 이야기의 내용을 입력하세요"
            />
            {errors.content && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.content}</span>
              </div>
            )}
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-600 hover:to-purple-700 transition-colors"
          >
            작성하기
          </button>
        </form>
      </div>
    </div>
  );
} 