'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  Tag, 
  Image as ImageIcon, 
  X, 
  Plus, 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  AlertCircle,
  Calendar,
  Users,
  Globe,
  Lock
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import HamburgerMenu from "@/components/HamburgerMenu";
import SearchModal from "@/components/SearchModal";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

// 이미지 파일 인터페이스 추가
interface ImageFile {
  file: File;
  previewUrl: string;
  id: string;
}

// 공개 설정 타입
type PrivacyType = 'public' | 'private' | 'invitation';

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
  
  // 새로 추가된 상태
  const [scheduledDate, setScheduledDate] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<number>(20);
  const [privacy, setPrivacy] = useState<PrivacyType>("public");

  // 토론 주제 관련 상태 - 각 주제는 객체로 관리 (id와 value를 가짐)
  const [topics, setTopics] = useState<{ id: number, value: string }[]>([
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
    
    // 필수 필드 검증
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    
    if (!content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }
    
    if (!bookTitle.trim()) {
      setError("책 제목을 입력해주세요.");
      return;
    }
    
    if (!bookAuthor.trim()) {
      setError("책 저자를 입력해주세요.");
      return;
    }
    
    if (topics.length === 0 || topics.every(topic => !topic.value.trim())) {
      setError("최소 하나의 토론 주제를 입력해주세요.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // 이미지 업로드 처리
      const imageUrls: string[] = [];
      
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
            
            return publicUrlData.publicUrl;
          } catch (err) {
            console.error("이미지 업로드 실패:", err);
            // 에러가 발생하면 로컬 임시 URL 사용
            return URL.createObjectURL(image.file);
          }
        });
        
        // 모든 이미지 업로드 완료 대기
        imageUrls.push(...await Promise.all(imageUploads));
      }

      // 새로 추가된 필드 처리
      // 날짜를 정확하게 변환
      const scheduledDateTime = scheduledDate ? new Date(scheduledDate).toISOString() : null;
      // 최대 참가자 수 변환
      const parsedMaxParticipants = maxParticipants ? Number(maxParticipants) : 10;
      // 토론 주제 값만 추출하여 배열로 변환
      const topicValues = topics.filter(topic => topic.value.trim()).map(topic => topic.value.trim());

      // 토론 생성 API 호출
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          bookTitle,
          bookAuthor,
          tags,
          topics: topicValues, // 토론 주제 값들만 전송
          imageUrls,
          scheduledAt: scheduledDateTime,
          maxParticipants: parsedMaxParticipants,
          privacy: privacy
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '토론을 생성하는 중 오류가 발생했습니다.');
      }
      
      const data = await response.json();
      
      // 성공 메시지 표시
      toast.success('토론이 성공적으로 생성되었습니다.');
      
      // 토론 목록 페이지로 이동
      router.push('/discussions');
      
    } catch (error) {
      console.error('토론 생성 중 오류:', error);
      toast.error(error instanceof Error ? error.message : '토론을 생성하는 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 미래 날짜만 선택 가능하도록 최소 날짜 설정
  const getMinDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16); // 'YYYY-MM-DDThh:mm' 형식
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

            {/* 제목 입력 */}
            <div className="flex flex-col gap-2">
              <label htmlFor="title" className="text-sm font-medium text-gray-300">
                토론 제목
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
                토론 내용
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="토론 내용을 입력하세요"
                rows={5}
                className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* 토론 설정 섹션 (새로 추가) */}
            <div className="p-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl backdrop-blur-sm border border-blue-500/30">
              <h3 className="text-md font-medium mb-4">토론 설정</h3>
              
              {/* 토론 예정 일시 */}
              <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  토론 예정 일시
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={getMinDateTime()}
                  className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  토론이 진행될 일시를 선택하세요. 현재 시간 이후로만 설정할 수 있습니다.
                </p>
              </div>
              
              {/* 최대 참가자 수 */}
              <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  최대 참가자 수
                </label>
                <input
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  min="2"
                  max="100"
                  className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  토론에 참여할 수 있는 최대 인원을 설정하세요. 최소 2명 이상이어야 합니다.
                </p>
              </div>
              
              {/* 공개 설정 */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">
                  공개 설정
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 공개 토론 */}
                  <button
                    type="button"
                    onClick={() => setPrivacy("public")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      privacy === "public" 
                        ? "border-green-500 bg-green-500/10" 
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <Globe className={`w-6 h-6 ${privacy === "public" ? "text-green-400" : "text-gray-400"}`} />
                    <span className="text-sm font-medium">공개 토론</span>
                    <p className="text-xs text-gray-400 text-center">누구나 참여 가능</p>
                  </button>
                  
                  {/* 비공개 토론 */}
                  <button
                    type="button"
                    onClick={() => setPrivacy("private")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      privacy === "private" 
                        ? "border-yellow-500 bg-yellow-500/10" 
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <Lock className={`w-6 h-6 ${privacy === "private" ? "text-yellow-400" : "text-gray-400"}`} />
                    <span className="text-sm font-medium">비공개 토론</span>
                    <p className="text-xs text-gray-400 text-center">초대된 사용자만</p>
                  </button>
                  
                  {/* 초대 토론 */}
                  <button
                    type="button"
                    onClick={() => setPrivacy("invitation")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      privacy === "invitation" 
                        ? "border-blue-500 bg-blue-500/10" 
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <Users className={`w-6 h-6 ${privacy === "invitation" ? "text-blue-400" : "text-gray-400"}`} />
                    <span className="text-sm font-medium">초대 토론</span>
                    <p className="text-xs text-gray-400 text-center">승인 후 참여 가능</p>
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  토론의 공개 설정을 선택하세요. 참여자 제한을 통해 더 집중된 토론을 진행할 수 있습니다.
                </p>
              </div>
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
                  <p>• 각 이미지는 최대 5MB까지 허용됩니다.</p>
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