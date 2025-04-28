import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import UserSearchModal, { UserSearchResult } from './UserSearchModal';
import { toast } from 'react-hot-toast';
import { Search, User } from 'lucide-react';
import Image from 'next/image';

interface ComposeNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (receivers: UserSearchResult[], title: string, content: string) => Promise<boolean>;
  initialInfo?: {
    receivers: UserSearchResult[];
    title: string;
    content: string;
  } | null;
}

export default function ComposeNoteModal({ isOpen, onClose, onSend, initialInfo }: ComposeNoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [receivers, setReceivers] = useState<UserSearchResult[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const receiversRef = useRef<UserSearchResult[]>([]);

  // 리시버가 변경될 때마다 ref 업데이트
  useEffect(() => {
    receiversRef.current = receivers;
  }, [receivers]);

  useEffect(() => {
    if (initialInfo) {
      console.log('ComposeNoteModal: Setting initial info', initialInfo);
      setReceivers(initialInfo.receivers || []);
      setTitle(initialInfo.title || '');
      setContent(initialInfo.content || '');
    }
  }, [initialInfo]);

  useEffect(() => {
    if (isOpen) {
      console.log('ComposeNoteModal: Modal opened, receivers:', receivers);
    } else {
      console.log('ComposeNoteModal: Modal closed');
      if (!initialInfo) {
        setTitle('');
        setContent('');
        setReceivers([]);
      }
    }
  }, [isOpen, initialInfo, receivers.length]);

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      toast.error('내용을 입력해주세요.');
      return;
    }
    if (receivers.length === 0) {
      toast.error('받는 사람을 선택해주세요.');
      return;
    }

    setIsSending(true);
    try {
      const success = await onSend(receivers, title, content);
      if (success) {
        setTitle('');
        setContent('');
        setReceivers([]);
        onClose();
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleUserSelect = useCallback((user: UserSearchResult) => {
    try {
      console.log('ComposeNoteModal: User selected', user);
      
      // 필수 필드 검증
      if (!user.id) {
        console.error('ComposeNoteModal: 선택된 사용자 정보 오류 - ID 누락');
        toast.error('사용자 정보가 유효하지 않습니다.');
        return;
      }
      
      // 중복 체크 후 사용자 추가
      setReceivers(prevReceivers => {
        // 이미 선택된 사용자인지 확인
        if (prevReceivers.some(r => r.id === user.id)) {
          console.log('ComposeNoteModal: User already exists in receivers');
          return prevReceivers;
        }
        
        // 이미지가 null이면 빈 문자열로 대체 (네트워크 오류 방지)
        const safeUser = {
          ...user,
          name: user.name || '이름 없음',
          image: user.image || null,
          email: user.email || '이메일 없음'
        };
        
        console.log('ComposeNoteModal: User added to receivers', safeUser);
        // 새 배열을 반환하여 상태 업데이트
        return [...prevReceivers, safeUser];
      });
      
      // 사용자 선택 후 모달 닫기
      setIsUserSearchOpen(false);
    } catch (error) {
      console.error('ComposeNoteModal: 사용자 선택 중 오류 발생', error);
      toast.error('사용자를 선택하는 중 오류가 발생했습니다.');
    }
  }, []);

  // 디버깅용 렌더링 카운터
  const renderCount = useRef(0);
  renderCount.current++;

  console.log(`ComposeNoteModal rendering #${renderCount.current}, receivers:`, receivers);

  return (
    <>
      <Dialog 
        open={isOpen} 
        modal={true}
        onOpenChange={(open) => {
          // 닫기 버튼 클릭 시 닫기(onOpenChange가 false로 호출됨)
          if (!open) {
            onClose();
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-[600px]" 
          preventBackdropClickClose={true}
        >
          <DialogHeader>
            <DialogTitle>새 쪽지 작성</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">받는 사람</label>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUserSearchOpen(true)}
                  className="w-full flex justify-center"
                >
                  <Search className="w-4 h-4 mr-2" />
                  받는 사람 선택
                </Button>
                {receivers.length > 0 && (
                  <div className="flex-1 flex flex-wrap gap-2 p-2 border rounded-md bg-gray-900/50">
                    {receivers.map((receiver) => (
                      <span
                        key={receiver.id}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-950/50 border border-indigo-800 text-sm"
                      >
                        {receiver.image ? (
                          <span className="w-4 h-4 mr-1 rounded-full bg-indigo-800 flex items-center justify-center overflow-hidden">
                            <Image
                              src={receiver.image}
                              alt={receiver.name}
                              width={16}
                              height={16}
                              className="rounded-full"
                              onError={(e) => {
                                e.currentTarget.onerror = null; // 이벤트 핸들러 제거하여 무한 반복 방지
                                // 이미지 로드 실패 시 기본 아이콘으로 대체
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('flex');
                                e.currentTarget.parentElement?.classList.add('items-center');
                                e.currentTarget.parentElement?.classList.add('justify-center');
                              }}
                            />
                            <User className="w-3 h-3 text-gray-300 hidden" /> 
                          </span>
                        ) : (
                          <span className="w-4 h-4 mr-1 rounded-full bg-indigo-800 flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-300" />
                          </span>
                        )}
                        {receiver.name}
                        <button
                          type="button"
                          className="ml-2 text-gray-400 hover:text-gray-300"
                          onClick={() => setReceivers(receivers.filter(r => r.id !== receiver.id))}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">제목</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="쪽지 제목을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">내용</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="쪽지 내용을 입력하세요"
                rows={6}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button onClick={handleSend} disabled={isSending}>
                {isSending ? '전송 중...' : '보내기'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isUserSearchOpen && (
        <UserSearchModal
          isOpen={isUserSearchOpen}
          onClose={() => {
            console.log('ComposeNoteModal: Closing UserSearchModal');
            setIsUserSearchOpen(false);
          }}
          onSelect={handleUserSelect}
          selectedUsers={receiversRef.current}
        />
      )}
    </>
  );
} 