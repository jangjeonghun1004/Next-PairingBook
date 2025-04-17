import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * 서버 전용 Supabase 클라이언트
 * - SERVICE_ROLE_KEY를 사용하여 권한이 필요한 작업(파일 업로드 등)을 수행
 * - 절대 클라이언트에 노출되지 않도록 주의
 * - Supabase 클라이언트 생성 (타입 안전성 추가)
 */
export const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );