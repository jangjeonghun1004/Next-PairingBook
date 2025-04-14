'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Keyboard } from 'lucide-react';

interface TopicModalProps {
    isOpen: boolean;
    onClose: () => void;
    topics: string[];
}

export default function TopicModal({ isOpen, onClose, topics }: TopicModalProps) {
    const [currentTopicIndex, setCurrentTopicIndex] = useState(0);

    // 키보드 이벤트 리스너 설정
    useEffect(() => {
        // useEffect 내부에서만 스크롤 위치 저장 변수 사용
        let savedScrollPosition = 0;
        
        if (isOpen) {
            // 현재 스크롤 위치 저장
            savedScrollPosition = window.scrollY;
            
            // 스크롤 방지를 위한 스타일 적용
            document.body.style.position = 'fixed';
            document.body.style.top = `-${savedScrollPosition}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
        }
        
        // 키보드 이벤트 핸들러
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isOpen) return;
            
            switch (event.key) {
                case 'ArrowLeft':
                    goToPreviousTopic();
                    break;
                case 'ArrowRight':
                    goToNextTopic();
                    break;
                case 'Escape':
                    onClose();
                    break;
                default:
                    break;
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        
        // 모달이 isOpen 변경 또는 컴포넌트 언마운트 시 정리
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            
            // 모달이 열려있던 상태에서 닫힐 때만 스크롤 위치 복원
            // 이 코드는 페이지가 언마운트될 때도 실행되지만 이미 닫혀있다면 아무 영향 없음
            if (isOpen) {
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                
                // 스크롤 위치 복원
                window.scrollTo(0, savedScrollPosition);
            }
        };
    }, [isOpen, onClose]);
    
    // 이전 토픽 이동
    const goToPreviousTopic = useCallback(() => {
        setCurrentTopicIndex((prevIndex) => 
            prevIndex === 0 ? topics.length - 1 : prevIndex - 1
        );
    }, [topics.length]);
    
    // 다음 토픽 이동
    const goToNextTopic = useCallback(() => {
        setCurrentTopicIndex((prevIndex) => 
            prevIndex === topics.length - 1 ? 0 : prevIndex + 1
        );
    }, [topics.length]);
    
    if (!isOpen) return null;
    
    const currentTopic = topics[currentTopicIndex];
    
    return (
        <div className="fixed inset-0 z-50 bg-gray-900/95 flex flex-col overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900 z-10">
                <button 
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-800/70 transition-all duration-200"
                    aria-label="닫기"
                >
                    <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">토론 주제</h3>
                    <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5">
                        {currentTopicIndex + 1} / {topics.length}
                    </span>
                </div>
                <div className="w-9"></div> {/* 좌우 균형을 맞추기 위한 더미 div */}
            </div>
            
            {/* 토픽 콘텐츠 */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                <div className="max-w-4xl mx-auto bg-gray-800/30 rounded-xl p-5 sm:p-8 border border-gray-700/50 shadow-xl">
                    <h2 className="text-lg sm:text-xl font-medium text-indigo-300 mb-4">주제 {currentTopicIndex + 1}</h2>
                    <div className="prose prose-invert max-w-none">
                        <p className="whitespace-pre-wrap text-lg leading-relaxed">{currentTopic}</p>
                    </div>
                </div>
            </div>
            
            {/* 탐색 푸터 */}
            <div className="border-t border-gray-800 bg-gray-900 p-4">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="hidden sm:flex items-center gap-2 text-gray-400 text-sm">
                        <Keyboard className="w-4 h-4" />
                        <span>← → 키로 이동 | ESC 키로 닫기</span>
                    </div>
                    <div className="flex items-center justify-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={goToPreviousTopic}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-200"
                            aria-label="이전 주제"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="font-medium">이전</span>
                        </button>
                        
                        <span className="text-sm text-gray-400 hidden sm:block">
                            {currentTopicIndex + 1} / {topics.length}
                        </span>
                        
                        <button
                            onClick={goToNextTopic}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-200"
                            aria-label="다음 주제"
                        >
                            <span className="font-medium">다음</span>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 