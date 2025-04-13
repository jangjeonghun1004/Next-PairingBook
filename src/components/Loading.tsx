'use client';

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
                <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-3 h-3 rounded-full bg-pink-500 animate-bounce"></div>
                </div>
                <p className="text-white text-sm font-medium">로딩 중...</p>
            </div>
        </div>
    );
};