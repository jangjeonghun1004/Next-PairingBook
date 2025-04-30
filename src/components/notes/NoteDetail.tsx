'use client';

import { memo, useCallback, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Trash, Reply } from 'lucide-react';
import { Note } from './NoteList';

interface NoteDetailProps {
  note: Note | null;
  onDeleteNote: (noteId: string) => void;
  onReplyNote: (note: Note) => void;
  isReceived?: boolean;
}

const NoteDetail = ({
  note,
  onDeleteNote,
  onReplyNote,
  isReceived = true,
}: NoteDetailProps) => {
  // 트랜지션 관리를 위한 ref
  const previousNoteIdRef = useRef<string | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 타임아웃 정리를 위한 effect - 항상 최상위 레벨에 위치
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // 시간 포맷팅
  const formatDateTime = useCallback((dateString: string): string => {
    try {
      return format(new Date(dateString), 'yyyy년 M월 d일 HH:mm', { locale: ko });
    } catch (error) {
      return '알 수 없는 시간' + error;
    }
  }, []);

  // 쪽지 삭제 이벤트 핸들러
  const handleDelete = useCallback(() => {
    if (!note) return;
    
    const confirmed = window.confirm('이 쪽지를 삭제하시겠습니까?');
    if (confirmed) {
      onDeleteNote(note.id);
    }
  }, [note, onDeleteNote]);

  // 쪽지 답장 이벤트 핸들러
  const handleReply = useCallback(() => {
    if (!note) return;
    onReplyNote(note);
  }, [note, onReplyNote]);

  // 쪽지가 없는 경우 플레이스홀더 표시
  if (!note) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 text-gray-400">
        <p>선택된 쪽지가 없습니다.</p>
        <p className="text-sm mt-2">왼쪽 목록에서 쪽지를 선택하세요.</p>
      </div>
    );
  }

  // 쪽지 ID를 기준으로 변경 여부 확인 - try 블록 외부로 이동
  const hasChanged = previousNoteIdRef.current !== note.id;
  if (hasChanged) {
    previousNoteIdRef.current = note.id;
  }

  try {
  const formattedTime = formatDateTime(note.createdAt);

  return (
      <div className="flex flex-col max-h-[calc(100vh-280px)]">
        {/* 쪽지 정보 헤더 - 고정 위치 */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0 bg-gray-800/50">
        {/* 쪽지 제목 및 액션 버튼 */}
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium break-words">{note.title}</h2>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {isReceived && (
              <button
                onClick={handleReply}
                  className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors flex items-center gap-1"
                title="답장"
                aria-label="이 쪽지에 답장하기"
              >
                <Reply className="w-5 h-5" />
                  <span className="text-sm hidden sm:inline">답장</span>
              </button>
            )}
            <button
              onClick={handleDelete}
                className="p-1.5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              title="삭제"
              aria-label="이 쪽지 삭제하기"
            >
              <Trash className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 발신자/수신자 정보 */}
        <div className="flex flex-col space-y-1 text-sm">
          <div className="flex">
            <span className="text-gray-400 w-16">{isReceived ? '보낸 사람' : '받는 사람'}:</span>
            <span className="text-gray-200">{isReceived ? note.senderName : note.receiverName}</span>
          </div>
          <div className="flex">
            <span className="text-gray-400 w-16">시간:</span>
            <span className="text-gray-400">{formattedTime}</span>
          </div>
        </div>
      </div>

        {/* 쪽지 내용 - 스크롤 가능 */}
        <div className="p-4 overflow-y-auto flex-grow bg-gray-800/30">
        <div className="whitespace-pre-wrap text-gray-200 leading-relaxed break-words">
          {note.content}
        </div>
      </div>
    </div>
  );
  } catch (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 text-red-400 bg-gray-800/30 rounded-xl border border-red-500/50">
        <p>쪽지 표시 중 오류가 발생했습니다.</p>
        <p className="text-sm mt-2">다시 시도해 주세요.</p>
        <p className="text-sm mt-2">{error instanceof Error ? error.message : '알 수 없는 오류'}</p>
      </div>
    );
  }
};

export default memo(NoteDetail); 