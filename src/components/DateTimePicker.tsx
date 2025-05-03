'use client';

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, Check } from "lucide-react";

interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  minDate?: Date;
}

export default function DateTimePicker({
  value,
  onChange,
  placeholder = '날짜와 시간을 선택하세요',
  className = '',
  minDate = new Date(),
}: DateTimePickerProps) {
  // 달력 열기/닫기 상태
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  
  // 선택된 날짜와 시간 상태
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);
  const [selectedHour, setSelectedHour] = useState<number>(value ? (value.getHours() % 12 || 12) : 12);
  const [selectedMinute, setSelectedMinute] = useState<number>(value ? value.getMinutes() : 0);
  const [selectedAmPm, setSelectedAmPm] = useState<'오전'|'오후'>(value ? (value.getHours() >= 12 ? '오후' : '오전') : '오후');
  
  // 현재 표시되는 월
  const [currentMonth, setCurrentMonth] = useState<Date>(value || new Date());
  
  // 캘린더 외부 클릭시 닫기를 위한 ref
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // value prop이 변경되면 내부 상태 업데이트
  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
      setSelectedHour(value.getHours() % 12 || 12);
      setSelectedMinute(value.getMinutes());
      setSelectedAmPm(value.getHours() >= 12 ? '오후' : '오전');
      setCurrentMonth(new Date(value));
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  // 캘린더 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 날짜 선택 핸들러
  const handleDateSelect = (date: Date) => {
    setSelectedDate(new Date(date));
  };

  // 시간 버튼 선택 핸들러
  const handleTimeButtonClick = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    if (hours >= 12) {
      setSelectedHour(hours === 12 ? 12 : hours - 12);
      setSelectedAmPm('오후');
    } else {
      setSelectedHour(hours === 0 ? 12 : hours);
      setSelectedAmPm('오전');
    }
    
    setSelectedMinute(minutes);
  };

  // 시간 input 변경 핸들러
  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    
    // 24시간제 입력을 12시간제로 변환
    if (hours >= 12) {
      setSelectedHour(hours === 12 ? 12 : hours - 12);
      setSelectedAmPm('오후');
    } else {
      setSelectedHour(hours === 0 ? 12 : hours);
      setSelectedAmPm('오전');
    }
    
    setSelectedMinute(minutes);
  };

  // 오전/오후 변경 핸들러
  const handleAmPmChange = (newAmPm: '오전'|'오후') => {
    setSelectedAmPm(newAmPm);
  };

  // 날짜시간 선택 완료
  const handleDateTimeSelect = () => {
    if (selectedDate) {
      const dateTime = new Date(selectedDate);
      
      // 시간 설정 (12시간제 → 24시간제)
      let hours = selectedHour;
      if (selectedAmPm === '오후' && selectedHour !== 12) {
        hours += 12;
      } else if (selectedAmPm === '오전' && selectedHour === 12) {
        hours = 0;
      }
      
      dateTime.setHours(hours, selectedMinute, 0, 0);
      onChange(dateTime);
      setShowCalendar(false);
    }
  };

  // 24시간제 시간 문자열 반환 (HH:mm)
  const get24HourTimeString = (): string => {
    let hours = selectedHour;
    if (selectedAmPm === '오후' && selectedHour !== 12) {
      hours += 12;
    } else if (selectedAmPm === '오전' && selectedHour === 12) {
      hours = 0;
    }
    return `${hours.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
  };
  
  // 월 변경 핸들러
  const nextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonth(next);
  };
  
  const prevMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentMonth(prev);
  };
  
  // 캘린더에 표시할 날짜 데이터 생성
  const getMonthData = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // 해당 월의 첫 날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 첫 주의 시작일 (이전 달의 날짜 포함)
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // 마지막 주의 종료일 (다음 달의 날짜 포함)
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };
  
  // 날짜 및 시간 한국어 포맷 변환
  const formatDateTimeKorean = (date: Date): string => {
    return `${format(date, 'yyyy년 MM월 dd일', { locale: ko })} ${formatTimeForDisplay(date.getHours(), date.getMinutes())}`;
  };
  
  // 12시간제 시간 표시용 함수
  const formatTimeForDisplay = (hours: number, minutes: number): string => {
    const isPM = hours >= 12;
    const hour12 = hours % 12 || 12;
    const minutesStr = minutes.toString().padStart(2, '0');
    return `${isPM ? '오후' : '오전'} ${hour12}시 ${minutesStr}분`;
  };

  // 오늘 날짜
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 최소 날짜 설정
  const minDateNormalized = minDate || today;
  minDateNormalized.setHours(0, 0, 0, 0);

  return (
    <div className={`relative ${className}`}>
      <div 
        className="w-full flex items-center p-3 rounded-xl bg-gray-800/80 text-white border border-gray-700 transition-all duration-200 shadow-inner cursor-pointer hover:bg-gray-800" 
        onClick={() => setShowCalendar(true)}
      >
        <Calendar className="w-5 h-5 text-indigo-400 mr-2" />
        <span>
          {value ? formatDateTimeKorean(value) : placeholder}
        </span>
      </div>

      {/* 캘린더 팝업 */}
      {showCalendar && (
        <div 
          ref={calendarRef}
          className="absolute z-50 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-xl p-4 w-[calc(100vw-40px)] sm:w-80 max-h-[85vh] overflow-y-auto"
        >
          <div className="mb-3">
            <div className="flex items-center justify-between mb-3">
              <button 
                type="button" 
                onClick={prevMonth}
                className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200"
              >
                &lt;
              </button>
              <h3 className="text-sm font-medium text-white">
                {format(currentMonth, 'yyyy년 MM월', { locale: ko })}
              </h3>
              <button 
                type="button" 
                onClick={nextMonth}
                className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200"
              >
                &gt;
              </button>
            </div>
            
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>
            
            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-1">
              {getMonthData(currentMonth).map((date, index) => {
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
                const isPast = date < minDateNormalized;
                
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    className={`
                      p-2 rounded-lg text-center text-sm transition-colors
                      ${isSelected ? 'bg-indigo-500 text-white' : 
                        isCurrentMonth ? 'text-gray-200 hover:bg-indigo-500/20' : 
                        'text-gray-500 hover:bg-gray-800/50'}
                      ${isPast ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    disabled={isPast}
                  >
                    <div className="font-medium">{date.getDate()}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">시간 선택</h3>
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between gap-2">
                {['10:00', '12:00', '15:00', '19:00'].map((time) => {
                  const [hStr, mStr] = time.split(':');
                  const h = parseInt(hStr);
                  const m = parseInt(mStr);
                  const isPM = h >= 12;
                  const h12 = h % 12 || 12;
                  const isSelected = selectedHour === h12 && selectedMinute === m && selectedAmPm === (isPM ? '오후' : '오전');
                  
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleTimeButtonClick(time)}
                      className={`px-2 py-1 rounded text-xs flex-1 ${
                        isSelected
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
              
              {/* 오전/오후 선택 */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex rounded-lg overflow-hidden border border-gray-700">
                  <button
                    type="button"
                    onClick={() => handleAmPmChange('오전')}
                    className={`px-3 py-2 text-sm flex-1 ${
                      selectedAmPm === '오전' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    오전
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmPmChange('오후')}
                    className={`px-3 py-2 text-sm flex-1 ${
                      selectedAmPm === '오후' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    오후
                  </button>
                </div>
                
                <div className="flex-1">
                  <input
                    type="time"
                    value={get24HourTimeString()}
                    onChange={handleTimeInputChange}
                    className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700 [&::-webkit-calendar-picker-indicator]:hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleDateTimeSelect}
              disabled={!selectedDate}
              className="flex items-center gap-1 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 