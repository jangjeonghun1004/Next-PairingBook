'use client';

import { PenSquare } from "lucide-react";
import Link from "next/link";

interface NewPostButtonProps {
  isMenuOpen: boolean;
  path: string;
}

export default function NewPostButton({ isMenuOpen, path }: NewPostButtonProps) {
  return (
    <Link
      href={path}
      className={`fixed right-6 bottom-6 z-30 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 hover:scale-110 ${
        isMenuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <PenSquare className="w-6 h-6 text-white" />
    </Link>
  );
} 