import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'tqidvnukkfvqyvjyyccb.supabase.co', // Supabase 스토리지 호스트
      'lh3.googleusercontent.com',  // Google 사용자 이미지
      'avatars.githubusercontent.com'  // GitHub 사용자 이미지
    ],
  },
};

export default nextConfig;
