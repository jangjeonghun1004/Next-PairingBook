'use client';

import { Menu, X } from "lucide-react";
import Logo from "./Logo";

interface MobileHeaderProps {
  isMenuOpen: boolean;
  onMenuToggle: (isOpen: boolean) => void;
}

export default function MobileHeader({ isMenuOpen, onMenuToggle }: MobileHeaderProps) {
  return (
    <header className="md:hidden sticky top-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Logo size="lg" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">페어링 BOOK</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isMenuOpen ? (
              <button
                onClick={() => onMenuToggle(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => onMenuToggle(true)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 