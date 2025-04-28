import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// 읽지 않은 쪽지 수를 확인하는 훅
const useUnreadNotes = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      // 읽지 않은 쪽지 수를 가져오는 함수
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch('/api/notes/unread');
          if (response.ok) {
            const data = await response.json();
            setUnreadCount(data.unreadCount || 0);
          }
        } catch (error) {
          console.error('읽지 않은 쪽지 수 가져오기 오류:', error);
          setUnreadCount(0);
        }
      };

      fetchUnreadCount();
      
      // 주기적으로 업데이트 (1분마다 새로고침)
      const interval = setInterval(fetchUnreadCount, 60000);
      
      // 쪽지 읽음 이벤트 처리를 위한 이벤트 리스너
      const handleNotesRead = () => {
        fetchUnreadCount();
      };
      
      // 이벤트 리스너 등록
      window.addEventListener('notesRead', handleNotesRead);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('notesRead', handleNotesRead);
      };
    } else {
      // 로그아웃 상태에서는 0으로 초기화
      setUnreadCount(0);
    }
  }, [status]);

  return unreadCount;
};

export default useUnreadNotes; 