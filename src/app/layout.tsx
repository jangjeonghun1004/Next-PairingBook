import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import CustomToaster from "@/components/CustomToaster";

const inter = Inter({ subsets: ["latin"] });

// viewport와 metadata를 분리
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0
};

export const metadata: Metadata = {
  title: "페어링북 - 당신의 독서 경험을 공유하고 연결하세요",
  description: "좋아하는 책을 발견하고, 리뷰를 공유하고, 다른 독자들과 소통하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="overflow-y-scroll">
      <body className={`${inter.className} overflow-x-hidden`}>
        <Providers>
          {children}
          <CustomToaster />
        </Providers>
      </body>
    </html>
  );
}
