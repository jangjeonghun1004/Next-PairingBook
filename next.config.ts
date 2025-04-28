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
  webpack: (config, { isServer }) => {
    // 문제가 되는 모듈에 대한 처리 추가
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'aws-sdk': false,
      'mock-aws-s3': false,
      'nock': false,
      'fs': false
    };

    // 문제가 되는 html 파일을 처리하기 위한 로더 설정
    config.module.rules.push({
      test: /\.html$/,
      use: 'null-loader',
    });

    // bcrypt와 같은 네이티브 모듈을 미들웨어에서 제외
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        bcrypt: false,
        '@mapbox/node-pre-gyp': false,
        'node-gyp': false,
        'npm': false,
        'npmlog': false
      };
    }

    return config;
  },
  // Edge Runtime에서 실행되는 미들웨어를 위한 설정
  experimental: {},
  serverExternalPackages: ['bcrypt'], // bcrypt를 서버 컴포넌트에서만 사용
};

export default nextConfig;
