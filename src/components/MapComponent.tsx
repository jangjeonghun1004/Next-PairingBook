'use client';

import { useEffect, useRef } from 'react';

interface MapComponentProps {
    latitude?: number;
    longitude?: number;
    address: string;
    center: { lat: number; lng: number };
    zoom: number;
    onLocationSelect?: (location: { lat: number; lng: number }) => void;
}

// 카카오맵 타입 선언
declare global {
    interface Window {
        kakao: {
            maps: {
                load: (callback: () => void) => void;
                LatLng: new (lat: number, lng: number) => KakaoLatLng;
                Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
                Marker: new (options: KakaoMarkerOptions) => KakaoMarker;
                InfoWindow: new (options: KakaoInfoWindowOptions) => KakaoInfoWindow;
                services: {
                    Geocoder: new () => {
                        addressSearch: (address: string, callback: (result: GeocodeResult[], status: GeocodeStatus) => void) => void;
                    };
                    Status: {
                        OK: GeocodeStatus;
                    };
                };
            };
        };
    }
}

// 카카오맵 관련 인터페이스
interface KakaoLatLng {
    getLat(): number;
    getLng(): number;
}

interface KakaoMapOptions {
    center: KakaoLatLng;
    level: number;
}

interface KakaoMap {
    setCenter(position: KakaoLatLng): void;
}

interface KakaoMarkerOptions {
    map: KakaoMap;
    position: KakaoLatLng;
}

interface KakaoMarker {
    setMap(map: KakaoMap | null): void;
}

interface KakaoInfoWindowOptions {
    content: string;
}

interface KakaoInfoWindow {
    open(map: KakaoMap, marker: KakaoMarker): void;
}

// 지오코드 결과 타입
interface GeocodeResult {
    y: string; // 위도
    x: string; // 경도
}

// 지오코드 상태 타입
type GeocodeStatus = 'OK' | 'ZERO_RESULT' | 'ERROR';

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
            geocoder.addressSearch(address, (result: GeocodeResult[], status: GeocodeStatus) => {
                if (status === window.kakao.maps.services.Status.OK) {
                    const coords = new window.kakao.maps.LatLng(
                        parseFloat(result[0].y), 
                        parseFloat(result[0].x)
                    );

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