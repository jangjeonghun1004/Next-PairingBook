'use client';

import { useEffect, useRef } from 'react';

interface MapComponentProps {
    latitude?: number;
    longitude?: number;
    address: string;
}

declare global {
    interface Window {
        kakao: any;
    }
}

export default function MapComponent({ address }: MapComponentProps) {
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadMap = () => {
            if (typeof window === 'undefined' || !window.kakao || !mapRef.current) return;

            // 지도 생성
            const mapOption = {
                center: new window.kakao.maps.LatLng(37.4565, 126.7052), // 초기 중심좌표
                level: 2 // 지도의 확대 레벨
            };

            const map = new window.kakao.maps.Map(mapRef.current, mapOption);

            // 주소-좌표 변환 객체 생성
            const geocoder = new window.kakao.maps.services.Geocoder();

            // 주소로 좌표 검색
            geocoder.addressSearch(address, (result: any, status: any) => {
                if (status === window.kakao.maps.services.Status.OK) {
                    const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

                    // 마커 생성
                    const marker = new window.kakao.maps.Marker({
                        map: map,
                        position: coords
                    });

                    // 인포윈도우로 장소에 대한 설명 표시
                    const infowindow = new window.kakao.maps.InfoWindow({
                        content: `<div style="width:150px;text-align:center;padding:6px 0;color:black;">${address}</div>`
                    });
                    infowindow.open(map, marker);

                    // 지도 중심을 검색된 위치로 이동
                    map.setCenter(coords);
                } else {
                    console.error('주소를 찾을 수 없습니다.');
                }
            });
        };

        // 카카오맵 스크립트가 로드된 후 지도 초기화
        if (window.kakao && window.kakao.maps) {
            loadMap();
        } else {
            const script = document.createElement('script');
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services&autoload=false`;
            script.async = true;
            
            script.onload = () => {
                window.kakao.maps.load(() => {
                    loadMap();
                });
            };
            
            document.head.appendChild(script);
        }
    }, [address]);

    return (
        <div 
            ref={mapRef} 
            className="w-full h-full rounded-xl"
            style={{ minHeight: '300px' }}
        />
    );
} 