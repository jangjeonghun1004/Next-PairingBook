'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, CheckCircle, User } from 'lucide-react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

// 검색 결과 유저 정보 타입
export interface UserSearchResult {
  id: string;
  name: string;
  image: string | null;
  email: string;
}

// API 응답 유저 데이터 타입
interface UserApiData {
  id: string;
  name?: string;
  email?: string;
  image?: string | null;
}

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: UserSearchResult) => void;
  selectedUsers: UserSearchResult[];
}

export default function UserSearchModal({
  isOpen,
  onClose,
  onSelect,
  selectedUsers,
}: UserSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // 렌더링 추적용
  const renderCount = useRef(0);
  renderCount.current++;
  console.log(`UserSearchModal rendering #${renderCount.current}`, { isOpen, selectedUsersCount: selectedUsers?.length });

  // 컴포넌트 마운트 시 상태 설정
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // 모달이 열리거나 닫힐 때 로그
  useEffect(() => {
    if (isOpen) {
      console.log('UserSearchModal: Opened with selectedUsers:', selectedUsers);
      // 모달이 열릴 때 검색어와 에러 초기화
      setSearchQuery('');
      setError(null);
    } else {
      console.log('UserSearchModal: Closed');
      // 모달이 닫힐 때 검색 결과 초기화
      setUsers([]);
      setError(null);
    }
  }, [isOpen, selectedUsers]);

  // 모달이 열릴 때 입력란에 포커스
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // 사용자 검색 기능
  useEffect(() => {
    if (searchQuery.trim()) {
      const delayDebounceFn = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 디버깅 정보 추가
      const debugInfo = '&debug=true&client=search_modal_' + Date.now();
      
      console.log('UserSearchModal: 사용자 검색 시작', { query });
      console.log('요청 URL:', `/api/users/search?query=${encodeURIComponent(query)}${debugInfo}`);
      
      // 세션 쿠키 확인 (디버깅용)
      const cookies = document.cookie;
      console.log('현재 쿠키:', cookies);
      
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}${debugInfo}`, {
        // 세션 쿠키가 포함되도록 credentials 설정
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        },
        cache: 'no-store'
      });
      
      console.log('API 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API 오류 응답:', errorData);
        console.error('응답 헤더:', [...response.headers.entries()]);
        
        // 401 인증 오류 특별 처리
        if (response.status === 401) {
          console.error('인증 오류 발생: 세션이 만료되었거나 인증되지 않음');
          throw new Error(errorData.error || '인증되지 않았습니다. 새로고침 후 다시 시도해주세요.');
        }
        
        throw new Error(errorData.error || `API 요청 실패: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('검색 결과:', data);
      
      // 결과가 없으면 별도 처리
      if (!data.users || data.users.length === 0) {
        console.log('검색 결과 없음');
        setUsers([]);
        return;
      }
      
      // 사용자 데이터 가공하여 상태에 저장
      const formattedUsers = data.users.map((user: UserApiData) => ({
        id: user.id,
        name: user.name || '이름 없음',
        email: user.email || '이메일 없음',
        image: user.image || null
      }));
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('사용자 검색 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '사용자 검색 중 오류가 발생했습니다.';
      setError(errorMessage);
      toast.error(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUserSelect = useCallback((user: UserSearchResult) => {
    console.log('UserSearchModal: User selected:', user);
    
    // 이미 선택된 사용자인지 확인
    const isAlreadySelected = selectedUsers?.some(selected => selected.id === user.id);
    if (isAlreadySelected) {
      console.log('UserSearchModal: User already selected');
      return;
    }
    
    try {
      // 부모 컴포넌트에 선택 이벤트 전달
      onSelect(user);
      console.log('UserSearchModal: onSelect called successfully');
    } catch (err) {
      console.error('UserSearchModal: Error in onSelect:', err);
    }
  }, [onSelect, selectedUsers]);

  if (!isMounted) return null;

  // 이미 선택된 사용자 ID 목록
  const selectedUserIds = new Set(selectedUsers?.map(user => user.id) || []);
  console.log('Selected user IDs:', selectedUserIds);

  // Dialog를 직접 사용하며 createPortal은 Dialog의 내부 기능에 의해 처리됨
  return (
    <Dialog 
      open={isOpen}
      modal={true}
      onOpenChange={(value) => {
        // Dialog가 닫히려고 할 때(value=false) 오직 닫기 버튼을 통해서만 닫히도록 함
        // 외부 클릭 등으로 인한 닫힘은 preventDefault로 차단되므로, 이 함수는 닫기 버튼 클릭 시에만 호출됨
        if (value === false) {
          onClose();
        }
      }}
    >
      <DialogContent 
        className="sm:max-w-[550px]"
        preventBackdropClickClose={true}
        onEscapeKeyDown={(e) => {
          // ESC 키 기본 동작 방지 (모달 닫힘 방지)
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          // 외부 클릭 기본 동작 방지 (모달 닫힘 방지)
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>받는 사람 선택</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름 또는 이메일로 검색"
              className="pl-10"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-4 text-red-400 space-y-2">
                <p>오류가 발생했습니다</p>
                <p className="text-sm">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setError(null);
                    if (searchQuery.trim()) {
                      searchUsers(searchQuery);
                    }
                  }}
                  className="mt-2"
                >
                  다시 시도
                </Button>
              </div>
            ) : users.length > 0 ? (
              <ul className="space-y-2">
                {users
                  .filter((user) => !selectedUserIds.has(user.id))
                  .map((user) => (
                    <li
                      key={user.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-700 rounded-md cursor-pointer transition-colors"
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="flex items-center gap-2">
                        {user.image ? (
                          <>
                            <Image
                              src={user.image}
                              alt={user.name}
                              width={32}
                              height={32}
                              className="rounded-full"
                              onError={(e) => {
                                console.log('Image load error:', user.image);
                                e.currentTarget.onerror = null;
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hidden">
                              <User className="w-4 h-4 text-gray-300" />
                            </div>
                          </>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserSelect(user);
                        }}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </Button>
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="text-center py-4 text-gray-400">
                {searchQuery ? '검색 결과가 없습니다.' : '검색어를 입력하세요.'}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 