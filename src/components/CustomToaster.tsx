'use client';

import { Toaster, Toast, resolveValue, toast } from 'react-hot-toast';
import Logo from "@/components/Logo";
import { X } from "lucide-react";

// Toaster의 children 속성으로 전달되는 객체의 타입 정의
interface ToastWithHandlers extends Toast {
  id: string;
}

export default function CustomToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        className: '',
        duration: 3000,
        style: {
          padding: 0,
          margin: 0,
          background: 'transparent',
          boxShadow: 'none',
          border: 'none',
          backdropFilter: 'none',
        },
      }}
    >
      {(t) => {
        // Toast 타입으로 변환
        const toastItem = t as ToastWithHandlers;
        
        return (
          <div
            className={`${
              toastItem.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md`}
          >
            <div className="relative bg-gray-800/90 backdrop-blur-sm text-white px-6 py-4 rounded-lg shadow-lg border border-gray-700/30 flex items-center gap-3">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-lg animate-gradient-x -z-10"></div>
              <div>
                <Logo size="sm" />
              </div>
              <span className="font-medium bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {resolveValue(toastItem.message, toastItem)}
              </span>
              {toastItem.type !== 'loading' && (
                <button
                  onClick={() => toast.dismiss(toastItem.id)}
                  className="p-1 hover:bg-gray-700/50 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      }}
    </Toaster>
  );
} 