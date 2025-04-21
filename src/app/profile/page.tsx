'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Camera, Loader2, ArrowLeft, AlertCircle, User, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import PairingBookPage1 from '@/components/pairing-book/PairingBookPage1';
import PairingBookPage2 from '@/components/pairing-book/PairingBookPage2';

interface UserProfile {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: Date;
}

// 북 커버 인터페이스 추가
interface BookCover {
    title: string;
    author: string;
    coverImage: string | null;
    color: string;
}

// 페어링 북 질문 및 답변 인터페이스
interface PairingQuestion {
    id: number;
    question: string;
    answer: string;
}

export default function ProfilePage() {
    // const router = useRouter();
    const { data: session, update: updateSession, status } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [newName, setNewName] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [errors, setErrors] = useState<{
        name?: string;
        image?: string;
        form?: string;
    }>({});

    // 북 커버 관련 상태 추가
    const [bookCover, setBookCover] = useState<BookCover>({
        title: '페어링 북',
        author: '화안샤지음',
        coverImage: null,
        color: '#ffffff'
    });
    // const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
    const [bookColors, setBookColors] = useState<string[]>([
        '#ffffff', // 흰색
        '#f3f4f6', // 연한 회색
        '#fef3c7', // 연한 노란색
        '#d1fae5', // 연한 녹색
        '#dbeafe', // 연한 파란색
        '#ede9fe', // 연한 보라색
        '#fce7f3'  // 연한 분홍색
    ]);

    // 페어링 모달 관련 상태 및 함수
    const [showPairingModal, setShowPairingModal] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [pairingQuestions, setPairingQuestions] = useState<PairingQuestion[]>([]);

    // 이미지 크롭 관련 상태
    const [showCropModal, setShowCropModal] = useState(false);
    const [srcImg, setSrcImg] = useState<string | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [crop, setCrop] = useState<Crop>({
        unit: '%',
        width: 100,
        height: 100,
        x: 0,
        y: 0,
    });
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

    // 사용자 프로필 불러오기
    const fetchUserProfile = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/users/${session?.user?.id}`);

            if (!response.ok) {
                throw new Error('프로필을 불러오는데 실패했습니다.');
            }

            const data = await response.json();
            setProfile(data);
            setNewName(data.name || '');
        } catch (error) {
            console.error('프로필 불러오기 오류:', error);
            toast.error('프로필을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchUserProfile();
        }
    }, [status, fetchUserProfile]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // 파일 크기 체크 (5MB 이하)
            if (file.size > 5 * 1024 * 1024) {
                setErrors({ ...errors, image: '이미지 크기는 5MB 이하여야 합니다.' });
                return;
            }

            // 이미지 파일 임시 저장
            setImageFile(file);

            // 크롭 모달을 위한 이미지 URL 생성
            const reader = new FileReader();
            reader.onloadend = () => {
                setSrcImg(reader.result as string);
                setShowCropModal(true);
            };
            reader.readAsDataURL(file);

            // 에러 초기화
            if (errors.image) {
                setErrors({ ...errors, image: undefined });
            }
        }
    };

    // 이미지 크롭 처리
    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        imgRef.current = e.currentTarget;

        // 이미지 스케일 계산 (화면에 표시된 크기와 실제 이미지 크기의 비율)
        // const scaleX = naturalWidth / width;
        // const scaleY = naturalHeight / height;

        // 초기 크롭 영역을 원형으로 설정 (1/3 정도 작게 설정)
        const minSize = Math.min(width, height);
        const cropSize = minSize * 0.67; // 2/3 크기로 설정 (1/3 작게)
        const x = (width - cropSize) / 2;
        const y = (height - cropSize) / 2;

        // 초기 crop 설정
        const initialCrop: Crop = {
            unit: 'px',
            width: cropSize,
            height: cropSize,
            x,
            y,
        };

        // crop 상태 설정
        setCrop(initialCrop);

        // 초기 completedCrop 값도 설정 (영역을 이동하지 않아도 저장 가능하도록)
        setCompletedCrop({
            width: cropSize,
            height: cropSize,
            x: x,
            y: y,
            unit: 'px'
        } as PixelCrop);

    };

    // 크롭된 이미지 생성
    const getCroppedImg = (image: HTMLImageElement, pixelCrop: PixelCrop): Promise<Blob> => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');
        }

        // 원형 마스크를 적용하기 위해 정사각형 캔버스 설정
        // const size = Math.min(pixelCrop.width, pixelCrop.height);

        // 최종 이미지 크기 설정 (정사각형)
        const outputSize = 300; // 고정된 출력 크기로 설정
        canvas.width = outputSize;
        canvas.height = outputSize;

        // 비율 계산
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // 원형 마스크 생성
        ctx.beginPath();
        ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip();

        // 크롭할 영역의 좌표 및 크기 계산
        const sourceX = pixelCrop.x * scaleX;
        const sourceY = pixelCrop.y * scaleY;
        const sourceWidth = pixelCrop.width * scaleX;
        const sourceHeight = pixelCrop.height * scaleY;

        // 디버깅 로그
        console.log('원본 이미지 크기:', image.naturalWidth, 'x', image.naturalHeight);
        console.log('표시 이미지 크기:', image.width, 'x', image.height);
        console.log('선택 영역 (화면):', pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);
        console.log('선택 영역 (원본):', sourceX, sourceY, sourceWidth, sourceHeight);

        // 이미지 그리기
        ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            outputSize,
            outputSize
        );

        // 투명한 배경 설정을 위해 globalCompositeOperation 사용
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();

        // 캔버스를 Blob으로 변환
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('이미지 생성에 실패했습니다.'));
                        return;
                    }
                    resolve(blob);
                },
                'image/png', // PNG 형식으로 변경하여 투명도 유지
                1.0 // 최대 품질
            );
        });
    };

    // 크롭 확인 처리
    const handleCropComplete = async () => {
        if (!imgRef.current || !completedCrop) {
            toast.error('이미지 크롭에 실패했습니다.');
            return;
        }

        try {
            setIsImageUploading(true);

            // 크롭된 이미지 생성
            const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);

            // Blob에서 File 객체 생성
            const croppedFile = new File(
                [croppedBlob],
                imageFile?.name || 'cropped-image.jpg',
                { type: 'image/png' } // PNG 형식으로 변경
            );

            // 크롭된 이미지로 상태 업데이트
            setImageFile(croppedFile);

            // 미리보기 URL 생성
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(croppedBlob);

            // 모달 닫기
            setShowCropModal(false);

            // 이미지 즉시 업로드 및 프로필 업데이트
            const imageUrl = await uploadImage(croppedFile);
            if (!imageUrl) {
                throw new Error('이미지 업로드에 실패했습니다.');
            }

            // 프로필 업데이트 API 호출
            const response = await fetch(`/api/users/${session?.user?.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageUrl,
                }),
            });

            if (!response.ok) {
                throw new Error('프로필 이미지 업데이트에 실패했습니다.');
            }

            const updatedProfile = await response.json();
            setProfile(updatedProfile);

            // 세션 업데이트
            await updateSession();

            // 성공 메시지
            toast.success('프로필 이미지가 업데이트되었습니다.');

        } catch (error) {
            console.error('이미지 크롭 또는 업로드 중 오류:', error);
            toast.error('이미지 처리에 실패했습니다.');
        } finally {
            setIsImageUploading(false);
        }
    };

    // 크롭 취소 처리
    const handleCropCancel = () => {
        setShowCropModal(false);
        // 취소 시에도 이미지 파일과 URL은 유지
        // 이전에 선택한 이미지가 있으면 그대로 사용하기 위함
        // setSrcImg(null);
        // setImageFile(null);
    };

    // 필요에 따라 크롭 모달 다시 열기
    const handleReCrop = () => {
        if (imageFile) {
            // 이미지가 이미 존재하면 다시 크롭 모달 열기
            if (!srcImg) {
                // URL이 없으면 다시 생성
                const reader = new FileReader();
                reader.onloadend = () => {
                    setSrcImg(reader.result as string);
                };
                reader.readAsDataURL(imageFile);
            }
            setShowCropModal(true);
        } else if (profile?.image) {
            // 프로필 이미지가 있지만 로컬 파일이 없는 경우
            toast.error('현재 프로필 이미지는 다시 크롭할 수 없습니다. 새 이미지를 선택해주세요.');
        } else {
            toast.error('크롭할 이미지가 없습니다. 이미지를 선택해주세요.');
        }
    };

    // 이미지 업로드 함수
    const uploadImage = async (file: File): Promise<string | null> => {
        setIsImageUploading(true);
        try {
            // 파일 이름을 고유하게 만들기
            const fileName = `profile-images/${session?.user?.id}_${Date.now()}_${file.name.replace(/\s+/g, '-')}`;

            // Supabase Storage에 이미지 업로드
            const { error } = await supabase.storage
                .from('profile-images')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                throw new Error(`이미지 업로드 오류: ${error.message}`);
            }

            // 업로드된 이미지의 공개 URL 가져오기
            const { data: publicUrlData } = supabase.storage
                .from('profile-images')
                .getPublicUrl(fileName);

            return publicUrlData.publicUrl;
        } catch (error) {
            console.error('이미지 업로드 실패:', error);
            toast.error('이미지 업로드에 실패했습니다.');
            return null;
        } finally {
            setIsImageUploading(false);
        }
    };

    const validateForm = () => {
        const newErrors: typeof errors = {};

        if (!newName.trim()) {
            newErrors.name = "이름을 입력해주세요";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // 프로필 업데이트 API 호출 - 이름만 업데이트
            const response = await fetch(`/api/users/${session?.user?.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newName
                }),
            });

            if (!response.ok) {
                throw new Error('프로필 업데이트에 실패했습니다.');
            }

            const updatedProfile = await response.json();
            setProfile(updatedProfile);

            // 세션 업데이트
            await updateSession();

            // 성공 메시지
            toast.success('이름이 업데이트되었습니다.');
        } catch (error) {
            console.error('프로필 업데이트 중 오류:', error);
            toast.error('프로필 업데이트에 실패했습니다.');
            setErrors({ form: '프로필 업데이트에 실패했습니다.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleBookCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // 파일 크기 체크 (5MB 이하)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('이미지 크기는 5MB 이하여야 합니다.');
                return;
            }

            // setCoverImageFile(file);

            // 미리보기 URL 생성
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverPreviewUrl(reader.result as string);
                setBookCover(prev => ({
                    ...prev,
                    coverImage: reader.result as string
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    // 북 커버 제목 변경 핸들러
    const handleBookTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBookCover(prev => ({
            ...prev,
            title: e.target.value
        }));
    };

    // 북 커버 저자 변경 핸들러
    const handleBookAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBookCover(prev => ({
            ...prev,
            author: e.target.value
        }));
    };

    // 북 커버 색상 변경 핸들러
    const handleBookColorChange = (color: string) => {
        setBookCover(prev => ({
            ...prev,
            color: color
        }));
    };

    // 페어링 모달 열기 함수 - UI 버튼에서 호출
    const openPairingModal = () => {
        setShowPairingModal(true);
        // 브라우저 히스토리에 상태 추가
        window.history.pushState({ pairing: true }, '');
    };

    // 페어링 모달 닫기
    const closePairingModal = () => {
        setShowPairingModal(false);
    };

    // 뒤로가기 처리를 위한 popstate 이벤트 리스너
    useEffect(() => {
        const handlePopState = () => {
            if (showPairingModal) {
                closePairingModal();
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [showPairingModal]);

    // 질문 답변 업데이트
    const updateQuestionAnswer = (id: number, answer: string) => {
        setPairingQuestions(prev =>
            prev.map(q => q.id === id ? { ...q, answer } : q)
        );
    };

    // 다음 질문으로 이동
    const goToNextQuestion = () => {
        if (currentQuestionIndex < pairingQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // 마지막 질문이면 저장하고 모달 닫기
            savePairingBook();
        }
    };

    // 이전 질문으로 이동
    const goToPrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    // 페어링 북 저장
    const savePairingBook = () => {
        // 여기에 페어링 북 저장 로직 구현
        // API 호출 등의 작업을 수행
        toast.success('페어링 북이 저장되었습니다.');
        closePairingModal();
    };

    // 새 질문 추가
    const addNewQuestion = () => {
        const newId = Math.max(...pairingQuestions.map(q => q.id), 0) + 1;
        setPairingQuestions(prev => [
            ...prev,
            { id: newId, question: '', answer: '' }
        ]);
        setCurrentQuestionIndex(pairingQuestions.length);
    };

    if (!session) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-gray-500">로그인이 필요합니다.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Sidebar />

            {/* 이미지 크롭 모달 */}
            {showCropModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                    <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">프로필 이미지 편집</h3>

                        <div className="mb-4">
                            <p className="text-sm text-gray-400 mb-2">원하는 영역을 선택하세요</p>
                            {srcImg && (
                                <ReactCrop
                                    crop={crop}
                                    onChange={(c) => setCrop(c)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={1}
                                    circularCrop
                                    className="max-h-[50vh] mx-auto"
                                >
                                    <img
                                        src={srcImg}
                                        ref={imgRef}
                                        onLoad={onImageLoad}
                                        className="max-w-full max-h-[50vh] mx-auto"
                                        alt="크롭할 이미지"
                                    />
                                </ReactCrop>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                type="button"
                                onClick={handleCropCancel}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-1"
                            >
                                <X className="w-4 h-4" />
                                <span>취소</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleCropComplete}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1"
                            >
                                <Check className="w-4 h-4" />
                                <span>적용</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 페어링 북 모달 */}
            {showPairingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* 모달 헤더 */}
                        <div className="p-4 sm:p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
                            <div className="flex justify-between">
                                <ArrowLeft className="w-5 h-5" />
                                <h2 className="text-xl font-bold absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    페어링북 만들기
                                </h2>
                                <button
                                    type="button"
                                    className="flex items-center gap-1"
                                    onClick={() => setShowPairingModal(false)}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-gray-400 text-sm mt-1">
                                질문에 답변하여 나만의 페어링 북을 완성하세요.
                            </p>
                        </div>

                        {/* 모달 본문 */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            <div className="max-w-xl mx-auto">
                                {/* 질문 번호 표시 */}
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-400">
                                        질문 {currentQuestionIndex + 1} / {pairingQuestions.length}
                                    </span>
                                    <button
                                        onClick={addNewQuestion}
                                        className="text-sm text-indigo-400 hover:underline"
                                    >
                                        + 새 질문 추가
                                    </button>
                                </div>

                                {/* 질문 표시 */}
                                <div className="mb-6">
                                    <div className="bg-gray-700/50 p-4 rounded-lg">
                                        <h4 className="font-medium text-indigo-300 mb-2">질문</h4>
                                        <input
                                            type="text"
                                            value={pairingQuestions[currentQuestionIndex]?.question || ''}
                                            onChange={(e) => {
                                                const updatedQuestions = [...pairingQuestions];
                                                updatedQuestions[currentQuestionIndex].question = e.target.value;
                                                setPairingQuestions(updatedQuestions);
                                            }}
                                            className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 focus:outline-none text-sm"
                                            placeholder="질문을 입력하세요"
                                        />
                                    </div>
                                </div>

                                {/* 답변 입력 */}
                                <div className="mb-6">
                                    <div className="bg-gray-700/50 p-4 rounded-lg">
                                        <h4 className="font-medium text-indigo-300 mb-2">답변</h4>
                                        <textarea
                                            value={pairingQuestions[currentQuestionIndex]?.answer || ''}
                                            onChange={(e) => updateQuestionAnswer(pairingQuestions[currentQuestionIndex].id, e.target.value)}
                                            className="w-full h-32 px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 focus:outline-none text-sm resize-none"
                                            placeholder="답변을 입력하세요"
                                        />
                                    </div>
                                </div>

                                {/* 이전/다음 버튼 */}
                                <div className="flex justify-between mt-6">
                                    <button
                                        onClick={goToPrevQuestion}
                                        disabled={currentQuestionIndex === 0}
                                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentQuestionIndex === 0
                                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                                            }`}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        이전
                                    </button>
                                    <button
                                        onClick={goToNextQuestion}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 text-white"
                                    >
                                        {currentQuestionIndex === pairingQuestions.length - 1 ? '저장' : '다음'}
                                        {currentQuestionIndex === pairingQuestions.length - 1 ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <ArrowLeft className="w-4 h-4 transform rotate-180" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen flex flex-col items-center px-4 md:pl-64 pb-8 w-full">
                <div className="w-full max-w-6xl pt-12 md:pt-8">
                    {/* Header */}
                    <div className="flex flex-col gap-4 mb-8">
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                프로필
                            </span>
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                관리
                            </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <p className="text-gray-400">나만의 페어링 BOOK을 통해 자신을 표현해보세요.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 mt-4 sm:mt-6">
                        {/* 프로필 정보 통합 섹션 */}
                        <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
                            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                                {/* 프로필 이미지 */}
                                <div className="flex flex-col items-center md:items-start">
                                    <label className="block text-sm font-medium mb-4 text-gray-300 md:hidden">프로필 이미지</label>
                                    <div className={`relative w-36 h-36 sm:w-40 sm:h-40 mb-2 ${errors.image ? 'ring-2 ring-red-500' : ''}`}>
                                        <div className="w-full h-full overflow-hidden bg-gray-800 border border-gray-700 rounded-full">
                                            {(previewUrl || profile?.image) ? (
                                                <Image
                                                    src={previewUrl || profile?.image || '/default-avatar.png'}
                                                    alt="프로필 이미지"
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                                    <User className="w-16 h-16 text-gray-500" />
                                                </div>
                                            )}

                                            {isImageUploading && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                                                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute bottom-0 right-0 flex gap-1">
                                            {/* 이미지 선택 버튼 */}
                                            <label className="p-2 bg-indigo-600 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors">
                                                <Camera className="w-5 h-5" />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    className="hidden"
                                                    disabled={isImageUploading}
                                                />
                                            </label>

                                            {/* 재크롭 버튼 - 이미지가 있을 때만 표시 */}
                                            {imageFile && (
                                                <button
                                                    type="button"
                                                    onClick={handleReCrop}
                                                    className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
                                                    disabled={isImageUploading}
                                                    title="이미지 영역 다시 선택"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                                        <path d="M6 13H0"></path>
                                                        <path d="M0 13V19H6"></path>
                                                        <path d="M18 13H24"></path>
                                                        <path d="M24 13V7H18"></path>
                                                        <rect x="4" y="4" width="16" height="16" rx="2"></rect>
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {errors.image && (
                                        <div className="flex items-center gap-1 text-red-400 text-xs sm:text-sm mb-2">
                                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span>{errors.image}</span>
                                        </div>
                                    )}

                                    <p className="text-sm text-gray-400 md:max-w-[180px] text-center md:text-left">
                                        사진을 선택하면 원하는 영역으로 편집할 수 있습니다.
                                        {imageFile && <span> 크롭 아이콘을 눌러 영역을 다시 선택할 수 있습니다.</span>}
                                    </p>
                                </div>

                                {/* 개인 정보 */}
                                <div className="flex-1 space-y-5">
                                    {/* 이름 입력 필드 */}
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-300">
                                            이름
                                        </label>
                                        <div className="flex gap-2 w-full md:w-96">
                                            <input
                                                type="text"
                                                id="name"
                                                value={newName}
                                                onChange={(e) => {
                                                    setNewName(e.target.value);
                                                    if (errors.name) {
                                                        setErrors({ ...errors, name: undefined });
                                                    }
                                                }}
                                                className={`flex-1 px-4 py-3 bg-gray-800/80 border rounded-lg focus:ring-2 placeholder-gray-400 focus:outline-none text-sm sm:text-base ${errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-700 focus:ring-indigo-500"
                                                    }`}
                                                placeholder="이름을 입력하세요"
                                            />
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    '저장'
                                                )}
                                            </button>
                                        </div>
                                        {errors.name && (
                                            <div className="flex items-center gap-1 mt-2 text-red-400 text-xs sm:text-sm">
                                                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                <span>{errors.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 이메일 표시 (수정 불가) */}
                                    <div>
                                        <p className="text-sm font-medium text-gray-300 mb-1">이메일</p>
                                        <p className="text-gray-400">{profile?.email || session?.user.email}</p>
                                        <p className="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다.</p>
                                    </div>

                                    {/* 가입일 표시 */}
                                    <div>
                                        <p className="text-sm font-medium text-gray-300 mb-1">가입일</p>
                                        <p className="text-gray-400">
                                            {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ko-KR', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 에러 메시지 */}
                        {errors.form && (
                            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                                <div className="flex items-center gap-2 text-red-400">
                                    <AlertCircle className="w-5 h-5" />
                                    <span>{errors.form}</span>
                                </div>
                            </div>
                        )}
                    </form>

                    {/* 페어링 북 섹션 - 제목과 소개 */}
                    <div className="mt-12 mb-6">
                        <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
                            <div className="flex flex-wrap items-center justify-between mb-4">
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">페어링 BOOK</h2>
                                    <p className="text-sm text-gray-400 mt-1">나만의 페어링 북을 통해 자신을 표현해보세요</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 페어링 북 페이지 1 - 독립적인 영역으로 구성 */}
                    <div className="mb-10">
                        <div className="rounded-xl overflow-hidden shadow-2xl border border-indigo-100 dark:border-gray-700">
                            <PairingBookPage1
                                question="1. 이성을 설레게 하는 나의 매력"
                                answer={pairingQuestions[0]?.answer || "친절하고 사소한 것에 감동을 잘하는 것이 매력이며\n상대방의 장점을 잘 알고\n상대의 이야기를 잘 들어줍니다.\n\n외적으로는 웃음이 많고 미소가 이쁘다고 생각합니다."}
                                sparklesImage="/images/sparkles.svg"
                                onAnswerChange={(newAnswer: string) => {
                                    const updatedQuestions = [...pairingQuestions];
                                    if (updatedQuestions[0]) {
                                        updatedQuestions[0].answer = newAnswer;
                                        setPairingQuestions(updatedQuestions);
                                        // 변경사항 저장 알림
                                        toast.success('답변이 저장되었습니다.');
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* 페어링 북 페이지 2 - 독립적인 영역으로 구성 */}
                    <div className="mb-10">
                        <div className="rounded-xl overflow-hidden shadow-2xl border border-amber-100 dark:border-gray-700">
                            <PairingBookPage2
                                question="2. 나의 하루 그리고 나의 휴일"
                                answer={pairingQuestions[1]?.answer || "아침 조깅을 하고, 강아지랑 산책을 하고 돌아와\n홈케어로 피부 관리를 합니다.\n\n하루 일정 끝에는 스트레칭을 통해\n하루 동안 뭉쳤던 근육을 꼭 풀어줍니다."}
                                sunImage="/images/sun.svg"
                                onAnswerChange={(newAnswer: string) => {
                                    const updatedQuestions = [...pairingQuestions];
                                    if (updatedQuestions[1]) {
                                        updatedQuestions[1].answer = newAnswer;
                                        setPairingQuestions(updatedQuestions);
                                        // 변경사항 저장 알림
                                        toast.success('답변이 저장되었습니다.');
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* 북 커버 섹션 */}
                    <div className="bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-gray-700/50 shadow-lg">
                        <div className="flex flex-wrap items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">북 커버 설정</h2>
                            <button
                                type="button"
                                onClick={openPairingModal}
                                className="mt-2 sm:mt-0 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                페어링 BOOK 작성하기
                            </button>
                        </div>
                        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                            {/* 북 커버 미리보기 */}
                            <div className="flex-1 flex justify-center">
                                <div
                                    className="w-80 h-[400px] rounded-lg shadow-2xl relative overflow-hidden flex flex-col justify-between"
                                    style={{ backgroundColor: bookCover.color }}
                                >
                                    {/* 책 표지 그림자 효과 */}
                                    <div className="absolute inset-0 shadow-inner pointer-events-none z-10"></div>

                                    {/* 책 상단 제목 */}
                                    <div className="p-4 text-center mt-6">
                                        <div className="text-xs text-gray-600 mb-1">히트메이킹</div>
                                        <h3 className="text-2xl font-bold text-gray-800 mb-1 font-serif">{bookCover.title}</h3>
                                    </div>

                                    {/* 책 중앙 이미지 */}
                                    <div className="flex-1 flex items-center justify-center p-6">
                                        {bookCover.coverImage ? (
                                            <div className="w-48 h-48 relative border border-gray-300">
                                                <Image
                                                    src={bookCover.coverImage}
                                                    alt="북 커버 이미지"
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-48 h-48 border border-gray-300 flex items-center justify-center">
                                                <p className="text-gray-500">이미지를 선택해주세요</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* 책 하단 저자 */}
                                    <div className="p-4 text-center mb-6">
                                        <p className="text-sm text-gray-700 font-medium">{bookCover.author}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 북 커버 설정 */}
                            <div className="flex-1 space-y-4">
                                {/* 책 제목 */}
                                <div>
                                    <label htmlFor="bookTitle" className="block text-sm font-medium mb-2 text-gray-300">
                                        책 제목
                                    </label>
                                    <input
                                        type="text"
                                        id="bookTitle"
                                        value={bookCover.title}
                                        onChange={handleBookTitleChange}
                                        className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 focus:outline-none text-sm sm:text-base"
                                        placeholder="책 제목을 입력하세요"
                                    />
                                </div>

                                {/* 저자 */}
                                <div>
                                    <label htmlFor="bookAuthor" className="block text-sm font-medium mb-2 text-gray-300">
                                        저자
                                    </label>
                                    <input
                                        type="text"
                                        id="bookAuthor"
                                        value={bookCover.author}
                                        onChange={handleBookAuthorChange}
                                        className="w-full px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 focus:outline-none text-sm sm:text-base"
                                        placeholder="저자 이름을 입력하세요"
                                    />
                                </div>

                                {/* 책 표지 이미지 */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-300">
                                        책 표지 이미지
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center justify-center w-32 h-32 border border-dashed border-gray-500 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors overflow-hidden relative">
                                            {coverPreviewUrl ? (
                                                <Image
                                                    src={coverPreviewUrl}
                                                    alt="커버 이미지 미리보기"
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                    <span className="text-xs text-gray-400">이미지 추가</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleBookCoverImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-400">책 표지에 표시될 이미지를 선택하세요.</p>
                                            <p className="text-xs text-gray-500 mt-1">PNG, JPG 형식 (최대 5MB)</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 책 표지 색상 */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-300">
                                        책 표지 색상
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {bookColors.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => handleBookColorChange(color)}
                                                className={`w-8 h-8 rounded-full transition-all ${bookCover.color === color ? 'ring-2 ring-indigo-500 scale-110' : 'hover:scale-110'}`}
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                        <label
                                            className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-500 cursor-pointer hover:scale-110 transition-all"
                                            title="사용자 지정 색상"
                                        >
                                            <input
                                                type="color"
                                                value={bookCover.color}
                                                onChange={(e) => handleBookColorChange(e.target.value)}
                                                className="opacity-0 absolute"
                                            />
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                            </svg>
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">선택한 색상: {bookCover.color}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 