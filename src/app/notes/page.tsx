'use client';

import { useState, useEffect, useCallback, useReducer, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import Loading from '@/components/Loading';
import HamburgerMenu from '@/components/HamburgerMenu';
import NoteList, { Note } from '@/components/notes/NoteList';
import NoteDetail from '@/components/notes/NoteDetail';
import { UserSearchResult } from '@/components/notes/UserSearchModal';
import { Inbox, SendHorizontal} from 'lucide-react';
import ComposeNoteModal from '@/components/notes/ComposeNoteModal';

// 선택된 쪽지 상태 관리를 위한 reducer 타입 정의
type NoteSelectionState = {
  selectedNoteId: string | null;
  noteDetails: Note | null;
  isLoading: boolean;
  error: string | null;
};

type NoteSelectionAction = 
  | { type: 'SELECT_NOTE_REQUEST'; payload: { noteId: string; basicInfo: Note } }
  | { type: 'SELECT_NOTE_SUCCESS'; payload: Note }
  | { type: 'SELECT_NOTE_FAILURE'; payload: string }
  | { type: 'CLEAR_SELECTION' };

// 쪽지 선택 상태를 위한 초기값
const initialNoteSelectionState: NoteSelectionState = {
  selectedNoteId: null,
  noteDetails: null,
  isLoading: false,
  error: null
};

// 쪽지 선택 상태 관리를 위한 reducer 함수
function noteSelectionReducer(state: NoteSelectionState, action: NoteSelectionAction): NoteSelectionState {
  switch (action.type) {
    case 'SELECT_NOTE_REQUEST':
      return {
        ...state,
        selectedNoteId: action.payload.noteId,
        noteDetails: action.payload.basicInfo,
        isLoading: true,
        error: null
      };
    case 'SELECT_NOTE_SUCCESS':
      return {
        ...state,
        noteDetails: action.payload,
        isLoading: false,
        error: null
      };
    case 'SELECT_NOTE_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case 'CLEAR_SELECTION':
      return initialNoteSelectionState;
    default:
      return state;
  }
}

export default function NotesPage() {
  const { status } = useSession();
  const router = useRouter();
  
  // 기본 상태 관리
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // 초기 로드 완료 상태 추가
  const [initialLoadComplete, setInitialLoadComplete] = useState({
    received: false,
    sent: false
  });
  
  // 탭별 데이터와 로딩 상태 분리
  const [receivedNotes, setReceivedNotes] = useState<Note[]>([]);
  const [sentNotes, setSentNotes] = useState<Note[]>([]);
  const [receivedLoading, setReceivedLoading] = useState(false);
  const [sentLoading, setSentLoading] = useState(false);
  // const [receivedTotalPages, setReceivedTotalPages] = useState(1);
  // const [sentTotalPages, setSentTotalPages] = useState(1);
  const [receivedHasMore, setReceivedHasMore] = useState(true);
  const [sentHasMore, setSentHasMore] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [receivedPage, setReceivedPage] = useState(1);
  const [sentPage, setSentPage] = useState(1);
  
  // 현재 활성화된 탭에 따른 상태 선택
  const notes = activeTab === 'received' ? receivedNotes : sentNotes;
  const loading = activeTab === 'received' ? receivedLoading : sentLoading;
  const page = activeTab === 'received' ? receivedPage : sentPage;
  const hasMore = activeTab === 'received' ? receivedHasMore : sentHasMore;

  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [composeReplyInfo, setComposeReplyInfo] = useState<{ receivers: UserSearchResult[], title: string, content: string } | null>(null);
  // 모바일 환경에서 상세보기 화면 상태 관리
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  
  // 무한 스크롤을 위한 옵저버 ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // 쪽지 선택 상태 관리를 위한 useReducer 사용
  const [noteSelection, dispatchNoteSelection] = useReducer(noteSelectionReducer, initialNoteSelectionState);
  
  // 쪽지 목록 불러오기 - 탭별로 다른 상태 업데이트
  const fetchNotes = useCallback(async (tabType = activeTab, pageNum = page, showLoadingIndicator = true, append = false) => {
    // 현재 탭에 맞는 로딩 상태와 페이지 상태 설정
    const isReceived = tabType === 'received';
    const setTabLoading = isReceived ? setReceivedLoading : setSentLoading;
    const setTabNotes = isReceived ? setReceivedNotes : setSentNotes;
    // const setTabTotalPages = isReceived ? setReceivedTotalPages : setSentTotalPages;
    const setTabHasMore = isReceived ? setReceivedHasMore : setSentHasMore;
    const currentPage = isReceived ? receivedPage : sentPage;
    
    // 실제 사용할 페이지 번호
    const usePage = pageNum !== page ? pageNum : currentPage;
    
    // 이미 로딩 중이거나 더 이상 데이터가 없으면 요청하지 않음
    if ((isReceived && receivedLoading) || (!isReceived && sentLoading)) {
      return;
    }
    
    if (showLoadingIndicator) {
      setTabLoading(true);
    }
    
    try {
      console.log(`쪽지 목록 요청: ${tabType}, 페이지: ${usePage}`);
      const response = await fetch(`/api/notes?type=${tabType}&page=${usePage}&limit=20`);
      
      if (!response.ok) {
        throw new Error(`쪽지 목록을 가져오는 중 오류가 발생했습니다. (${response.status})`);
      }
      
      const data = await response.json();
      console.log(`쪽지 목록 응답: ${tabType}, 개수: ${data.notes?.length || 0}`);
      const newNotes = data.notes || [];
      
      // 첫 페이지이고 데이터가 없는 경우
      if (usePage === 1 && newNotes.length === 0) {
        setTabNotes([]);
        setTabHasMore(false);
        
        // 초기 로드 완료 표시 - API 응답이 비어있더라도 로드는 완료된 것
        setInitialLoadComplete(prev => ({
          ...prev,
          [tabType]: true
        }));
        
        return;
      }
      
      // 추가 데이터가 없으면 더 이상 로드하지 않음
      if (newNotes.length === 0) {
        setTabHasMore(false);
        return;
      }
      
      // 기존 데이터에 추가할지 새로 설정할지 결정
      if (append) {
        setTabNotes(prev => [...prev, ...newNotes]);
      } else {
        setTabNotes(newNotes);
      }
      
      // setTabTotalPages(data.totalPages || 1);
      
      // 마지막 페이지인지 확인
      if (data.totalPages && usePage >= data.totalPages) {
        setTabHasMore(false);
      } else {
        setTabHasMore(true);
      }
      
      // 초기 로드 완료 표시
      if (usePage === 1) {
        setInitialLoadComplete(prev => ({
          ...prev,
          [tabType]: true
        }));
      }
      
      // 선택된 쪽지가 목록에서 제거된 경우 선택 해제
      if (noteSelection.selectedNoteId && tabType === activeTab && !append) {
        const stillExists = newNotes.some((note: Note) => note.id === noteSelection.selectedNoteId);
        if (!stillExists) {
          dispatchNoteSelection({ type: 'CLEAR_SELECTION' });
        }
      }
    } catch (error) {
      console.error('쪽지 목록 로드 오류:', error);
      toast.error('쪽지 목록을 불러오는 데 실패했습니다.' + error);
      setTabHasMore(false);
      
      // 오류가 발생해도 초기 로드는 완료된 것으로 표시
      setInitialLoadComplete(prev => ({
        ...prev,
        [tabType]: true
      }));
    } finally {
      setTabLoading(false);
    }
  }, [activeTab, receivedPage, sentPage, noteSelection.selectedNoteId, receivedLoading, sentLoading]);

  // 다음 페이지 로드
  const loadMore = useCallback(() => {
    if (loading) {
      console.log('이미 로딩 중이므로 추가 로드 무시');
      return;
    }
    
    if (!hasMore) {
      console.log('더 이상 로드할 데이터가 없습니다');
      return;
    }
    
    console.log(`추가 데이터 로드 시도: ${activeTab} 탭, 현재 페이지 ${page}`);
    const nextPage = page + 1;
    
    if (activeTab === 'received') {
      setReceivedPage(nextPage);
      fetchNotes('received', nextPage, true, true);
    } else {
      setSentPage(nextPage);
      fetchNotes('sent', nextPage, true, true);
    }
  }, [loading, hasMore, page, activeTab, fetchNotes]);

  // Intersection Observer 설정
  useEffect(() => {
    // 이전 Observer 해제
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // 무한 스크롤 Observer 생성
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    // 로드 더 보기 요소 관찰 시작
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, loading]);

  // 두 탭의 초기 데이터 로드
  const initialLoadNotes = useCallback(async () => {
    // 초기 로드가 완료되지 않은 탭에 대해서만 로드 수행
    if (!initialLoadComplete.received) {
      await fetchNotes('received', 1, true, false);
    }
    
    // 보낸 쪽지함도 초기 로드가 완료되지 않은 경우에만 로드
    if (!initialLoadComplete.sent) {
      setTimeout(() => {
        fetchNotes('sent', 1, false, false);
      }, 500);
    }
  }, [fetchNotes, initialLoadComplete]);

  // 인증 확인 및 데이터 초기 로드
  useEffect(() => {
    if (status === 'unauthenticated') {
      const callbackUrl = encodeURIComponent(window.location.pathname);
      router.replace(`/?callbackUrl=${callbackUrl}`);
    } else if (status === 'authenticated') {
      // 인증되면 쪽지 목록 가져오기 (초기 로드)
      initialLoadNotes();
    }
  }, [status, router, initialLoadNotes]);
  
  // 페이지가 변경되었을 때 추가 데이터 로드는 이제 Intersection Observer가 처리

  // 탭 변경 처리 - 선택 상태를 즉시 초기화하지 않음
  const handleTabChange = useCallback((tab: 'received' | 'sent') => {
    // 이미 같은 탭이면 아무것도 하지 않음
    if (tab === activeTab) return;
    
    setActiveTab(tab);
    
    // 선택된 쪽지가 새 탭에 존재하지 않으면 선택 해제
    const currentNotes = tab === 'received' ? receivedNotes : sentNotes;
    if (noteSelection.selectedNoteId) {
      const noteExists = currentNotes.some(note => note.id === noteSelection.selectedNoteId);
      if (!noteExists) {
        dispatchNoteSelection({ type: 'CLEAR_SELECTION' });
      }
    }
    
    // 탭의 초기 로드가 아직 완료되지 않은 경우에만 데이터 로드
    const isTabLoadComplete = initialLoadComplete[tab];
    if (!isTabLoadComplete) {
      fetchNotes(tab, 1, true, false);
    }
  }, [activeTab, receivedNotes, sentNotes, noteSelection.selectedNoteId, fetchNotes, initialLoadComplete]);

  // 새로고침 처리
  const handleRefresh = useCallback(() => {
    if (activeTab === 'received') {
      setReceivedPage(1);
      setReceivedHasMore(true);
      // 새로고침 시 초기 로드 상태 초기화
      setInitialLoadComplete(prev => ({
        ...prev,
        received: false
      }));
    } else {
      setSentPage(1);
      setSentHasMore(true);
      // 새로고침 시 초기 로드 상태 초기화
      setInitialLoadComplete(prev => ({
        ...prev,
        sent: false
      }));
    }
    fetchNotes(activeTab, 1, true, false);
  }, [activeTab, fetchNotes]);

  // 쪽지 삭제 처리
  const handleDeleteNote = useCallback(async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('쪽지 삭제 중 오류가 발생했습니다.');
      }
      
      // 현재 활성화된 탭의 목록에서 삭제된 쪽지 제거
      if (activeTab === 'received') {
        setReceivedNotes(prev => prev.filter(note => note.id !== noteId));
      } else {
        setSentNotes(prev => prev.filter(note => note.id !== noteId));
      }
      
      // 현재 선택된 쪽지가 삭제된 쪽지인 경우 선택 해제
      if (noteSelection.selectedNoteId === noteId) {
        dispatchNoteSelection({ type: 'CLEAR_SELECTION' });
      }
      
      toast.success('쪽지가 삭제되었습니다.');
    } catch (error) {
      toast.error('쪽지 삭제 중 오류가 발생했습니다.' + error);
    }
  }, [activeTab, noteSelection.selectedNoteId]);

  // 쪽지 전송
  const handleSendNote = useCallback(async (
    receivers: UserSearchResult[], 
    title: string, 
    content: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receivers,
          title,
          content,
        }),
      });
      
      if (!response.ok) {
        throw new Error('쪽지 전송 중 오류가 발생했습니다.');
      }
      
      // 보낸 쪽지함이 활성화되어 있으면 목록 새로고침
      if (activeTab === 'sent') {
        fetchNotes('sent', 1, true);
      } else {
        // 아니더라도 백그라운드에서 보낸 쪽지함 데이터 업데이트
        setTimeout(() => {
          fetchNotes('sent', 1, false);
        }, 500);
      }
      
      toast.success('쪽지가 전송되었습니다.');
      return true;
    } catch (error) {
      toast.error('쪽지 전송 중 오류가 발생했습니다.' + error);
      return false;
    }
  }, [activeTab, fetchNotes]);

  // 쪽지 선택 로직
  const handleNoteSelect = useCallback(async (note: Note) => {
    console.log('쪽지 선택 - ID:', note.id, '보낸사람:', note.senderId, '이름:', note.senderName, '제목:', note.title);
    
    // 이미 선택된 쪽지인지 확인
    if (noteSelection.selectedNoteId === note.id && noteSelection.noteDetails) {
      console.log('이미 선택된 쪽지입니다:', note.id);
      return;
    }
    
    // 즉시 쪽지 정보를 표시하여 화면 깜박임 최소화
    dispatchNoteSelection({
      type: 'SELECT_NOTE_SUCCESS',
      payload: note
    });

    // 모바일 화면에서 상세보기 표시 (상태 변경은 한 번만 실행되도록)
    if (!showMobileDetail) {
      setShowMobileDetail(true);
    }

    // 받은 쪽지인 경우에만 API를 통해 읽음 상태를 업데이트
    if (activeTab === 'received' && !note.isRead) {
      try {
        // API를 통해 쪽지 상세 정보 가져오기 (읽음 상태 업데이트 목적)
        const response = await fetch(`/api/notes/${note.id}`);
        
        if (!response.ok) {
          console.error('쪽지 읽음 처리 실패:', response.status, await response.text());
          return;
        }
        
        const data = await response.json();
        console.log('쪽지 읽음 처리 완료:', data);
        
        // 목록에서 해당 쪽지의 읽음 상태 업데이트
        setReceivedNotes(prev => prev.map(n => 
          n.id === note.id ? { ...n, isRead: true } : n
        ));
        
        // 상세 보기의 읽음 상태도 업데이트
        if (noteSelection.noteDetails && noteSelection.noteDetails.id === note.id) {
          dispatchNoteSelection({
            type: 'SELECT_NOTE_SUCCESS',
            payload: { ...noteSelection.noteDetails, isRead: true }
          });
        }
        
        // 쪽지를 읽었음을 알리는 이벤트 발생
        window.dispatchEvent(new Event('notesRead'));
      } catch (error) {
        console.error('쪽지 읽음 처리 오류:', error);
        // 읽음 처리 실패는 사용자 경험에 크게 영향을 주지 않으므로 토스트 메시지 표시하지 않음
      }
    }
  }, [activeTab, showMobileDetail, noteSelection.selectedNoteId, noteSelection.noteDetails]);

  // 모달 및 기타 함수들은 변경하지 않음
  const handleReplyNote = useCallback((note: Note) => {
    // 답장 시 수신자 정보 설정
    const receiver: UserSearchResult = {
      id: activeTab === 'received' ? note.senderId : note.receiverId,
      name: activeTab === 'received' ? note.senderName : note.receiverName,
      email: '', // 이메일 정보가 없는 경우
      image: null
    };
    
    // ComposeNoteModal에 수신자 정보와 함께 열기
    setComposeReplyInfo({
      receivers: [receiver],
      title: `Re: ${note.title}`,
      content: ''
    });
    
    setIsComposeModalOpen(true);
  }, [activeTab]);

  const handleCloseComposeModal = useCallback(() => {
    setIsComposeModalOpen(false);
    setComposeReplyInfo(null);
  }, []);

  const handleOpenComposeModal = useCallback(() => {
    setComposeReplyInfo(null);
    setIsComposeModalOpen(true);
  }, []);

  const handleBackToList = useCallback(() => {
    setShowMobileDetail(false);
  }, []);

  // 선택된 쪽지가 있는지 확인
  const hasSelectedNote = !!noteSelection.noteDetails;
  
  // 컴포넌트 마운트 감지
  // useEffect(() => {
  //   setIsClient(true);
  // }, []);

  // 로딩 상태 표시를 전체 페이지 대신 섹션별로 처리
  if (status === 'loading') {
    return <Loading />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Loading Indicator */}
      {loading && <Loading />}
      
      {/* Mobile Header */}
      <MobileHeader isMenuOpen={isMenuOpen} onMenuToggle={setIsMenuOpen} />

      {/* Hamburger Menu */}
      <HamburgerMenu isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} />

      {/* Left Sidebar */}
      <Sidebar />

      <div className="min-h-screen flex flex-col items-center px-4 md:pl-64 pb-8 w-full">
        <div className="w-full max-w-6xl pt-20 md:pt-8">
          {/* Header */}
          <div className="flex flex-col gap-1 mb-8">
            <div className="flex items-baseline">
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                쪽지함
              </span>
            </div>
            <div className="flex flex-col sm:flex-row">
              <p className="text-gray-400 text-sm">다른 사용자들과 쪽지를 주고받으며 소통해보세요.</p>
            </div>
          </div>
          
          {/* 탭 메뉴 */}
          <div className="flex mb-6 border-b border-gray-700">
            <button
              onClick={() => handleTabChange('received')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 ${
                activeTab === 'received'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Inbox className="w-5 h-5" />
              <span>받은 쪽지함</span>
            </button>

            <button
              onClick={handleOpenComposeModal}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 cursor-pointer ${
                activeTab === 'sent'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <SendHorizontal className="w-5 h-5" />
              <span>쪽지 보내기</span>
            </button>
            
            {/* <button
              onClick={() => handleTabChange('sent')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 ${
                activeTab === 'sent'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <SendHorizontal className="w-5 h-5" />
              <span>보낸 쪽지함</span>
            </button> */}
          </div>
          
          {/* 모바일 화면: 쪽지 목록과 상세보기 전환 */}
          <div className="block md:hidden">
            <div className="relative">
              {/* 쪽지 목록 - 상세 내용이 표시될 때 숨기지 않고 투명도만 조절 */}
              <div 
                className={`transition-opacity duration-300 ease-in-out ${
                  showMobileDetail ? 'opacity-0 pointer-events-none absolute inset-0 z-0' : 'opacity-100 z-10'
                }`}
              >
                <div className={`transition-opacity duration-200 ${loading ? 'opacity-70' : 'opacity-100'}`}>
                  {loading && notes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900/30 rounded-xl">
                      <div className="loader w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 max-h-[calc(100vh-250px)] overflow-y-auto">
                    <NoteList
                      notes={notes}
                      selectedNoteId={noteSelection.selectedNoteId}
                      onNoteSelect={handleNoteSelect}
                      onDeleteNote={handleDeleteNote}
                      onRefresh={handleRefresh}
                      isReceived={activeTab === 'received'}
                    />
                    
                    {/* 무한 스크롤 로딩 인디케이터 - NoteList 내부로 이동 */}
                    {notes.length > 0 && (
                      <div ref={loadMoreRef} className="py-4 flex justify-center">
                        {loading && hasMore ? (
                          <div className="loader w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : hasMore ? (
                          <button 
                            onClick={loadMore}
                            className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-2 px-4 py-2 rounded-full hover:bg-indigo-500/10 transition-colors"
                          >
                            <span>더 불러오기</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 9l6 6 6-6"/>
                            </svg>
                          </button>
                        ) : (
                          <span className="text-sm text-gray-500">모든 쪽지를 불러왔습니다</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 쪽지 상세 내용 */}
              <div 
                className={`transition-opacity duration-300 ease-in-out absolute inset-0 ${
                  showMobileDetail && noteSelection.noteDetails ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
                }`}
              >
                {noteSelection.noteDetails && (
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                    <button 
                      onClick={handleBackToList}
                      className="flex items-center gap-1 text-indigo-400 mb-3"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                      </svg>
                      <span>목록으로 돌아가기</span>
                    </button>
                    <NoteDetail
                      note={noteSelection.noteDetails}
                      onDeleteNote={handleDeleteNote}
                      onReplyNote={handleReplyNote}
                      isReceived={activeTab === 'received'}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 데스크톱 화면: 그리드 레이아웃 유지 */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {/* 쪽지 목록 */}
            <div className="md:col-span-1 flex flex-col">
              <div className={`transition-opacity duration-200 ${loading && notes.length === 0 ? 'opacity-70' : 'opacity-100'}`}>
                {loading && notes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900/30 rounded-xl">
                    <div className="loader w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
                  <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                    <NoteList
                      notes={notes}
                      selectedNoteId={noteSelection.selectedNoteId}
                      onNoteSelect={handleNoteSelect}
                      onDeleteNote={handleDeleteNote}
                      onRefresh={handleRefresh}
                      isReceived={activeTab === 'received'}
                    />
                    
                    {/* 무한 스크롤 로딩 인디케이터 */}
                    {notes.length > 0 && (
                      <div ref={loadMoreRef} className="py-4 flex justify-center">
                        {loading && hasMore ? (
                          <div className="loader w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : hasMore ? (
                          <button 
                            onClick={loadMore}
                            className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-2 px-4 py-2 rounded-full hover:bg-indigo-500/10 transition-colors"
                          >
                            <span>더 불러오기</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 9l6 6 6-6"/>
                            </svg>
                          </button>
                        ) : (
                          <span className="text-sm text-gray-500">모든 쪽지를 불러왔습니다</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 쪽지 내용 */}
            <div className="md:col-span-2 transition-opacity duration-300" style={{ opacity: hasSelectedNote ? 1 : 0.5 }}>
              <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
                <NoteDetail
                  note={noteSelection.noteDetails}
                  onDeleteNote={handleDeleteNote}
                  onReplyNote={handleReplyNote}
                  isReceived={activeTab === 'received'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ComposeNoteModal
        isOpen={isComposeModalOpen}
        onClose={handleCloseComposeModal}
        onSend={handleSendNote}
        initialInfo={composeReplyInfo}
      />
    </div>
  );
} 