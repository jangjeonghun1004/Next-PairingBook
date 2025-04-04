'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Tag, Image as ImageIcon, X, Plus, ArrowLeft, MessageSquare, Send, AlertCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import HamburgerMenu from "@/components/HamburgerMenu";
import SearchModal from "@/components/SearchModal";

// 이미지 파일 인터페이스 추가
interface ImageFile {
  file: File;
  previewUrl: string;
  id: string;
}

export default function NewDiscussionPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // 토론 주제 관련 상태 - 각 주제는 객체로 관리 (id와 value를 가짐)
  const [topics, setTopics] = useState<{id: number, value: string}[]>([
    { id: 1, value: "" } // 초기 입력 필드 하나 제공
  ]);
  const [nextTopicId, setNextTopicId] = useState(2); // 다음 주제 ID

  // 태그 추가 함수
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  // 태그 삭제 함수
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // 토론 주제 입력 필드 추가 함수
  const addTopicField = () => {
    setTopics([...topics, { id: nextTopicId, value: "" }]);
    setNextTopicId(nextTopicId + 1);
  };

  // 토론 주제 입력 필드 삭제 함수
  const removeTopicField = (idToRemove: number) => {
    // 최소 하나의 입력 필드는 유지
    if (topics.length > 1) {
      setTopics(topics.filter(topic => topic.id !== idToRemove));
    }
  };

  // 토론 주제 값 변경 함수
  const updateTopicValue = (id: number, value: string) => {
    setTopics(topics.map(topic => 
      topic.id === id ? { ...topic, value } : topic
    ));
  };

  // 이미지 변경 함수
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + images.length > 5) {
      setError("최대 5개의 이미지만 추가할 수 있습니다");
      return;
    }

    const newImages = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7)
    }));

    setImages(prev => [...prev, ...newImages]);
    if (error) {
      setError("");
    }
  };

  // 이미지 삭제 함수
  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      return filtered;
    });
  };

  // 폼 제출 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    
    if (!content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }
    
    if (!bookTitle.trim() || !bookAuthor.trim()) {
      setError("책 정보를 입력해주세요.");
      return;
    }
    
    // 토론 주제 유효성 검사 - 최소 하나 이상의 주제가 입력되어야 함
    const validTopics = topics.filter(topic => topic.value.trim() !== "");
    if (validTopics.length === 0) {
      setError("최소 하나 이상의 토론 주제를 입력해주세요.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      // 실제 구현에서는 API 호출이 필요합니다
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 성공 시 토론 목록 페이지로 이동
      router.push("/discussions");
    } catch (err) {
      setError("토론 발제문 작성 중 오류가 발생했습니다. 다시 시도해주세요." + err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 모바일 헤더 */}
      <MobileHeader isMenuOpen={isMenuOpen} onMenuToggle={setIsMenuOpen} />

      {/* 햄버거 메뉴 */}
      <HamburgerMenu isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} />

      {/* 좌측 사이드바 */}
      <Sidebar onSearchClick={() => setIsSearchOpen(true)} />

      {/* 검색 모달 */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <div className="min-h-screen flex flex-col items-center px-4 md:pl-28 pb-8">
        <div className="w-full max-w-4xl pt-16 md:pt-8">
          {/* 헤더 */}
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                토론
              </span>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                발제문
              </span>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                작성
              </span>
            </div>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* 제목 입력 */}
            <div className="flex flex-col gap-2">
              <label htmlFor="title" className="text-sm font-medium text-gray-300">
                제목
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="토론 제목을 입력하세요"
                className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 내용 입력 */}
            <div className="flex flex-col gap-2">
              <label htmlFor="content" className="text-sm font-medium text-gray-300">
                내용
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="토론 내용을 입력하세요"
                rows={8}
                className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* 토론 주제 입력 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  토론 주제
                </label>
                <button
                  type="button"
                  onClick={addTopicField}
                  className="text-xs px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>주제 추가</span>
                </button>
              </div>
              
              <div className="flex flex-col gap-3">
                {topics.map((topic) => (
                  <div key={topic.id} className="flex gap-2 items-start">
                    <textarea
                      value={topic.value}
                      onChange={(e) => updateTopicValue(topic.id, e.target.value)}
                      placeholder="토론 주제를 입력하세요"
                      rows={3}
                      className="flex-1 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeTopicField(topic.id)}
                      className="p-3 bg-gray-800/50 hover:bg-gray-800/70 rounded-lg transition-colors mt-1"
                      disabled={topics.length === 1}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-gray-400 mt-1">
                토론 주제를 여러 개 추가할 수 있습니다. &apos;주제 추가&apos; 버튼을 클릭하여 새로운 주제 입력 필드를 추가하세요.
              </p>
            </div>

            {/* 책 정보 입력 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                책 정보
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="책 제목"
                  className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  placeholder="저자"
                  className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* 태그 입력 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                태그
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-1 px-3 py-1 bg-indigo-500/20 rounded-full text-sm"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="p-0.5 hover:bg-indigo-500/30 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="태그를 입력하고 Enter를 누르세요"
                  className="flex-1 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="p-3 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 이미지 업로드 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                이미지
              </label>
              <div className="space-y-4">
                {/* 이미지 그리드 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {/* 이미지 추가 버튼 */}
                  <label className={`relative flex items-center justify-center w-full aspect-[4/3] rounded-xl bg-gray-800 cursor-pointer hover:bg-gray-700 transition-all duration-300 border-2 border-dashed ${error && error.includes("이미지") ? 'border-red-500' : 'border-gray-700 hover:border-indigo-500'}`}>
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

                {/* 이미지 가이드라인 */}
                <div className="text-sm text-gray-400 space-y-1">
                  <p>• 최대 5개의 이미지를 업로드할 수 있습니다.</p>
                  <p>• 각 이미지는 최대 5MB까지 허용됩니다.</p>
                  <p>• 권장 이미지 크기: 1200x800px</p>
                </div>
              </div>
            </div>

            {/* 오류 메시지 */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-pulse">작성 중...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>토론 발제문 작성하기</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 