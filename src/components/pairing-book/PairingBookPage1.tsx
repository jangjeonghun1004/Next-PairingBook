import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Edit, Save } from 'lucide-react';

interface PairingBookPage1Props {
  question?: string;
  answer?: string;
  sparklesImage?: string;
  onAnswerChange?: (newAnswer: string) => void;
}

const PairingBookPage1: React.FC<PairingBookPage1Props> = ({
  question = '1. 이성을 설레게 하는 나의 매력',
  answer = '',
  sparklesImage = '/images/sparkles.png',
  onAnswerChange
}) => {
  // 편집 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  // 편집중인 답변 저장
  const [editingAnswer, setEditingAnswer] = useState(answer);
  // 애니메이션 상태
  const [isVisible, setIsVisible] = useState(false);

  // 컴포넌트 마운트 시 애니메이션 트리거
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 답변이 변경되면 편집 상태도 업데이트
  useEffect(() => {
    setEditingAnswer(answer);
  }, [answer]);

  // 줄바꿈을 <br> 태그로 변환하는 함수
  const renderWithLineBreaks = (text: string) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // 편집 완료 처리
  const handleEditComplete = () => {
    if (onAnswerChange) {
      onAnswerChange(editingAnswer);
    }
    setIsEditing(false);
  };

  // 편집 모드 토글
  const toggleEditMode = () => {
    if (isEditing) {
      handleEditComplete();
    } else {
      setIsEditing(true);
    }
  };

  return (
    <div className={`w-full bg-gradient-to-b from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900 min-h-[700px] rounded-lg p-6 sm:p-10 flex flex-col items-center justify-start shadow-lg transition-all duration-700 ease-in-out ${
      isVisible ? 'opacity-100' : 'opacity-0 translate-y-4'
    }`}>
      {/* 질문 제목 - 다크/라이트 모드에 적합한 색상으로 변경 */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-10 sm:mb-16 text-center font-serif relative">
        <span className="relative inline-block">
          {question}
          <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-300 to-purple-300 dark:from-indigo-500 dark:to-purple-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
        </span>
      </h2>

      {/* 반짝이는 별 이미지 */}
      <div className="w-[200px] h-[200px] md:w-[240px] md:h-[240px] mb-10 sm:mb-16 relative flex items-center justify-center animate-pulse-slow">
        <Image
          src={sparklesImage}
          alt="반짝이는 별"
          width={240}
          height={240}
          className="object-contain"
        />
      </div>

      {/* 답변 영역 */}
      <div className="w-full max-w-xl relative">
        {/* 편집 버튼 */}
        <button 
          onClick={toggleEditMode}
          className="absolute -top-10 right-0 p-2 rounded-full bg-indigo-100 hover:bg-indigo-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-indigo-700 dark:text-indigo-300 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          title={isEditing ? "저장" : "편집"}
        >
          {isEditing ? (
            <Save className="w-5 h-5" />
          ) : (
            <Edit className="w-5 h-5" />
          )}
        </button>

        {/* 편집 모드 */}
        {isEditing ? (
          <textarea
            value={editingAnswer}
            onChange={(e) => setEditingAnswer(e.target.value)}
            className="w-full min-h-[200px] p-4 border border-indigo-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-lg leading-loose resize-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500 focus:outline-none shadow-inner transition-colors duration-200"
            placeholder="답변을 입력해주세요..."
          />
        ) : (
          /* 표시 모드 - 답변이 있는 경우 */
          answer ? (
            <div className="text-center text-gray-700 dark:text-gray-200 text-lg md:text-xl leading-loose p-4 rounded-lg bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm">
              {renderWithLineBreaks(answer)}
            </div>
          ) : (
            /* 표시 모드 - 답변이 없는 경우 */
            <div className="text-center text-gray-400 dark:text-gray-500 italic text-lg p-4 rounded-lg bg-white/50 dark:bg-gray-800/30">
              아직 작성된 답변이 없습니다. 편집 버튼을 클릭하여 답변을 작성해보세요.
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default PairingBookPage1; 