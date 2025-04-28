'use client';

import { useState, useCallback, memo } from 'react';
import { Mail, Trash, RefreshCw, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

// 쪽지 타입 정의
export interface Note {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  title: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onNoteSelect: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onRefresh: () => void;
  isReceived?: boolean; // 받은 쪽지인지, 보낸 쪽지인지 구분
}

// 쪽지 목록 내의 개별 쪽지 항목 컴포넌트
const NoteItem = memo(({ 
  note, 
  isSelected, 
  isUnread, 
  isReceived, 
  selectMode, 
  isSelectedForAction,
  onSelect, 
  onToggleSelect, 
  formatTime 
}: { 
  note: Note, 
  isSelected: boolean, 
  isUnread: boolean, 
  isReceived: boolean, 
  selectMode: boolean, 
  isSelectedForAction: boolean,
  onSelect: (note: Note) => void, 
  onToggleSelect: (noteId: string, e: React.MouseEvent) => void,
  formatTime: (date: string) => string
}) => {
  return (
    <div
      className={`flex items-center p-4 cursor-pointer hover:bg-gray-700/50 transition-all duration-200 ${
        isSelected ? 'bg-indigo-500/20 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'
      } ${isUnread && isReceived ? 'bg-gray-700/30' : ''}`}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        // 체크박스 영역 클릭 시 목록 선택 대신 체크박스 토글
        if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
          return;
        }
        
        // 선택 모드일 때는 쪽지 선택 대신 체크박스 토글
        if (selectMode) {
          onToggleSelect(note.id, e);
          return;
        }
        
        // 쪽지 선택
        onSelect(note);
      }}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(note);
        }
      }}
    >
      {/* 선택 체크박스 (선택 모드일 때만 표시) */}
      {selectMode && (
        <div
          className="mr-3 flex-shrink-0"
          onClick={(e) => onToggleSelect(note.id, e)}
          role="checkbox"
          aria-checked={isSelectedForAction}
          tabIndex={0}
        >
          <div className={`w-5 h-5 border rounded-md flex items-center justify-center transition-colors ${
            isSelectedForAction ? 'bg-indigo-500 border-indigo-500' : 'border-gray-600'
          }`}>
            {isSelectedForAction && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium truncate ${!note.isRead && isReceived ? 'text-white' : 'text-gray-300'}`}>
            {isReceived ? note.senderName : note.receiverName}
          </span>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {formatTime(note.createdAt)}
          </span>
        </div>
        <p className={`text-sm truncate mt-1 ${!note.isRead && isReceived ? 'text-white font-medium' : 'text-gray-400'}`}>
          {note.title}
        </p>
      </div>
      
      {/* 읽지 않은 쪽지 표시 */}
      {!note.isRead && isReceived && (
        <div className="ml-2 w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" aria-label="읽지 않은 쪽지" />
      )}
    </div>
  );
});

NoteItem.displayName = 'NoteItem';

const NoteList = ({
  notes,
  selectedNoteId,
  onNoteSelect,
  onDeleteNote,
  onRefresh,
  isReceived = true,
}: NoteListProps) => {
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  // 쪽지 선택 토글
  const toggleNoteSelection = useCallback((noteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (selectMode) {
      setSelectedNotes(prev => {
        const newSelectedNotes = new Set(prev);
        if (newSelectedNotes.has(noteId)) {
          newSelectedNotes.delete(noteId);
        } else {
          newSelectedNotes.add(noteId);
        }
        return newSelectedNotes;
      });
    }
  }, [selectMode]);

  // 모든 쪽지 선택/해제
  const toggleSelectAll = useCallback(() => {
    setSelectedNotes(prev => {
      if (prev.size === notes.length) {
        // 모두 선택되어 있으면 모두 해제
        return new Set();
      } else {
        // 일부만 선택되어 있거나 아무것도 선택되지 않았으면 모두 선택
        return new Set(notes.map(note => note.id));
      }
    });
  }, [notes]);

  // 선택 모드 토글
  const toggleSelectMode = useCallback(() => {
    setSelectMode(prev => {
      // 선택 모드 종료 시 선택된 항목 초기화
      if (prev) {
        setSelectedNotes(new Set());
      }
      return !prev;
    });
  }, []);

  // 선택된 쪽지 삭제
  const deleteSelectedNotes = useCallback(() => {
    if (selectedNotes.size === 0) return;

    const confirm = window.confirm(
      `선택한 ${selectedNotes.size}개의 쪽지를 삭제하시겠습니까?`
    );

    if (confirm) {
      // 선택된 모든 쪽지 삭제
      selectedNotes.forEach(noteId => {
        onDeleteNote(noteId);
      });
      
      // 선택 항목 초기화
      setSelectedNotes(new Set());
    }
  }, [selectedNotes, onDeleteNote]);

  // 시간 포맷팅 함수
  const formatTime = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale: ko 
      });
    } catch (error) {
      return '알 수 없는 시간' + error;
    }
  }, []);

  // 쪽지가 없는 경우 표시할 컴포넌트
  if (notes.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <span className="text-gray-400">쪽지 없음</span>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-md hover:bg-gray-700"
            title="새로고침"
            aria-label="쪽지 목록 새로고침"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex flex-col items-center justify-center text-gray-400">
          <Mail className="w-12 h-12 mb-3 opacity-40" />
          <p>쪽지가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* 도구 모음 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSelectMode}
            className={`p-1.5 rounded-md ${
              selectMode ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-gray-700'
            }`}
            title={selectMode ? '선택 모드 종료' : '선택 모드 시작'}
            aria-label={selectMode ? '선택 모드 종료' : '선택 모드 시작'}
          >
            <CheckCircle className="w-5 h-5" />
          </button>
          
          {selectMode && (
            <>
              <button
                onClick={toggleSelectAll}
                className="p-1.5 rounded-md hover:bg-gray-700"
                title="모두 선택/해제"
                aria-label={selectedNotes.size === notes.length ? '모두 해제' : '모두 선택'}
              >
                <span className="text-sm font-medium">
                  {selectedNotes.size === notes.length ? '모두 해제' : '모두 선택'}
                </span>
              </button>
              
              <button
                onClick={deleteSelectedNotes}
                className={`p-1.5 rounded-md hover:bg-gray-700 ${
                  selectedNotes.size === 0 ? 'text-gray-500 cursor-not-allowed' : 'text-red-400'
                }`}
                title="선택 항목 삭제"
                aria-label="선택한 쪽지 삭제"
                disabled={selectedNotes.size === 0}
              >
                <Trash className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
        
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-md hover:bg-gray-700"
          title="새로고침"
          aria-label="쪽지 목록 새로고침"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
      
      {/* 쪽지 목록 */}
      <div className="divide-y divide-gray-700 max-h-[calc(100vh-240px)] md:max-h-none overflow-y-auto">
        {notes.map((note) => (
          <NoteItem
            key={note.id}
            note={note}
            isSelected={selectedNoteId === note.id}
            isUnread={!note.isRead}
            isReceived={isReceived}
            selectMode={selectMode}
            isSelectedForAction={selectedNotes.has(note.id)}
            onSelect={onNoteSelect}
            onToggleSelect={toggleNoteSelection}
            formatTime={formatTime}
          />
        ))}
      </div>
    </div>
  );
};

// memo로 감싸서 불필요한 리렌더링 방지
export default memo(NoteList); 