'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Users,
  Globe,
  Lock,
  Calendar
} from "lucide-react";
import { toast } from "react-hot-toast";
import DateTimePicker from "@/components/DateTimePicker";
import { useUploadImage } from "@/hooks/useUploadImage";

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
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [place, setPlace] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { uploadImage } = useUploadImage("story-images");

  // 날짜 시간 관련 상태
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(null);

  // 참가자 수와 공개 설정
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

    if (!place.trim()) {
      toast.error("토론 장소를 입력해주세요.");
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
      // 1) Parallel batch upload via Promise.all
      const imageUrls = await Promise.all(
        images.map((img) => uploadImage(img.file))
      );

      // 새로 추가된 필드 처리
      // 날짜를 정확하게 변환
      const scheduledDateTimeIso = scheduledDateTime ? scheduledDateTime.toISOString() : null;
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
          place,
          bookTitle,
          bookAuthor,
          tags,
          topics: topicValues, // 토론 주제 값들만 전송
          imageUrls,
          scheduledAt: scheduledDateTimeIso,
          maxParticipants: parsedMaxParticipants,
          privacy: privacy
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '토론을 생성하는 중 오류가 발생했습니다.');
      }

      // const data = await response.json();

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
  const minDate = new Date();

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-8 w-full">
      <div className="w-full max-w-4xl pt-12 md:pt-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6 sticky top-0 z-10 bg-gradient-to-r from-gray-900/95 to-gray-900/95 backdrop-blur-md py-3 sm:py-4 rounded-xl px-3 sm:px-4">
          <Link
            href="/discussions"
            className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-800/70 transition-all duration-200 transform hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500 absolute left-1/2 transform -translate-x-1/2">새 토론</h1>
          <div className="w-[36px] h-[36px] sm:w-[72px]"></div> {/* 좌우 균형을 맞추기 위한 더미 div */}
        </div>

        {/* 폼 컨테이너 */}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 mt-4 sm:mt-6">
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* 책 정보 */}
          <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <h2 className="text-lg font-medium">책 정보</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="bookTitle" className="block text-sm font-medium mb-2 text-gray-300">
                  책 제목
                </label>
                <input
                  id="bookTitle"
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-800/80 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-700 transition-all duration-200 shadow-inner"
                  placeholder="책 제목을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="bookAuthor" className="block text-sm font-medium mb-2 text-gray-300">
                  저자
                </label>
                <input
                  id="bookAuthor"
                  type="text"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-800/80 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-700 transition-all duration-200 shadow-inner"
                  placeholder="저자 이름을 입력하세요"
                />
              </div>
            </div>
          </div>

          {/* 토론 정보 */}
          <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h2 className="text-lg font-medium">토론 정보</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2 text-gray-300">
                  토론 제목
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-800/80 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-700 transition-all duration-200 shadow-inner"
                  placeholder="토론 제목을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium mb-2 text-gray-300">
                  토론 소개
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-32 p-3 rounded-xl bg-gray-800/80 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-700 transition-all duration-200 shadow-inner resize-none"
                  placeholder="토론에 대한 설명을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="place" className="block text-sm font-medium mb-2 text-gray-300">
                  토론 장소
                </label>
                <input
                  id="place"
                  type="text"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className="w-full p-3 rounded-xl bg-gray-800/80 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-700 transition-all duration-200 shadow-inner"
                  placeholder="도로명 주소를 입력하세요. (예: 서울 종로구 혜화로6길 17)"
                />
              </div>

              {/* 토론 주제 */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  토론 주제
                </label>
                <div className="space-y-3">
                  {topics.map((topic, index) => (
                    <div key={topic.id} className="flex items-center gap-2">
                      <textarea
                        rows={5}
                        value={topic.value}
                        onChange={(e) => updateTopicValue(topic.id, e.target.value)}
                        className="flex-1 p-3 rounded-xl bg-gray-800/80 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-700 transition-all duration-200 shadow-inner resize-none"
                        placeholder={`토론 주제 ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeTopicField(topic.id)}
                        className="p-2 rounded-lg bg-gray-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"
                        disabled={topics.length <= 1}
                        title="주제 삭제"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTopicField}
                    className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium p-2"
                  >
                    <Plus className="w-4 h-4" />
                    주제 추가하기
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 토론 설정 */}
          <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <h2 className="text-lg font-medium">토론 설정</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label htmlFor="scheduledDate" className="block text-sm font-medium mb-2 text-gray-300">
                  예정 날짜 및 시간
                </label>
                <DateTimePicker
                  value={scheduledDateTime}
                  onChange={setScheduledDateTime}
                  minDate={minDate}
                  placeholder="날짜와 시간을 선택하세요"
                />
              </div>

              <div>
                <label htmlFor="maxParticipants" className="block text-sm font-medium mb-2 text-gray-300">
                  최대 참가자 수
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="maxParticipants"
                    type="number"
                    min="2"
                    max="100"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 20)}
                    className="w-full p-3 rounded-xl bg-gray-800/80 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-700 transition-all duration-200 shadow-inner"
                  />
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  공개 설정
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 공개 토론 */}
                  <button
                    type="button"
                    onClick={() => setPrivacy("public")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${privacy === "public"
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
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${privacy === "private"
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
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${privacy === "invitation"
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
          </div>

          {/* 태그 */}
          <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-indigo-400" />
              <h2 className="text-lg font-medium">태그</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 p-3 rounded-xl bg-gray-800/80 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-700 transition-all duration-200 shadow-inner"
                  placeholder="태그 입력 후 엔터 또는 추가 버튼"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-1 bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-indigo-300 hover:text-indigo-100 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 이미지 업로드 */}
          <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <h2 className="text-lg font-medium">이미지</h2>
            </div>

            <div className="space-y-4">
              {/* 이미지 그리드 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                {/* 이미지 추가 버튼 */}
                <label className="relative flex items-center justify-center w-full aspect-[4/3] rounded-xl cursor-pointer transition-all duration-300 border-2 border-dashed border-gray-600 bg-gray-800/50 hover:bg-gray-800 hover:border-indigo-500 hover:shadow-lg overflow-hidden group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    multiple
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2 transition-transform duration-200 group-hover:scale-110">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="text-sm text-gray-300 font-medium">이미지 추가</span>
                    <span className="text-xs text-gray-500">{images.length}/5</span>
                  </div>
                </label>

                {/* 이미지 미리보기 */}
                {images.map((image) => (
                  <div key={image.id} className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                    <img
                      src={image.previewUrl}
                      alt="미리보기"
                      className="w-full h-full object-cover"
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
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    처리 중...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    토론 생성하기
                  </>
                )}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
} 