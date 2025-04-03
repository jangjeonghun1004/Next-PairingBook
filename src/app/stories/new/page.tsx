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
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    category?: string;
    title?: string;
    content?: string;
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // TODO: API 연동
      console.log({ title, content, category, image });
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative group">
                <label className="flex items-center justify-center w-40 h-40 rounded-xl bg-gray-800 cursor-pointer hover:bg-gray-700 transition-all duration-300 border-2 border-dashed border-gray-700 hover:border-indigo-500">
                  {previewUrl ? (
                    <div className="relative w-full h-full">
                      <img
                        src={previewUrl}
                        alt="미리보기"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setImage(null);
                            setPreviewUrl(null);
                          }}
                          className="p-2 rounded-full bg-gray-900/80 hover:bg-gray-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-indigo-500" />
                      </div>
                      <span className="text-sm text-gray-400">이미지 추가</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-2">
                  • 최대 5MB의 이미지를 업로드할 수 있습니다.
                </p>
                <p className="text-sm text-gray-400">
                  • 권장 이미지 크기: 1200x800px
                </p>
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