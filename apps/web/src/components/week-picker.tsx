import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface WeekPickerProps {
  selectedDate: string // ISO date string (YYYY-MM-DD)
  onDateSelect: (date: string) => void
  todosByDate?: Record<string, number> // Date -> count of todos
  completedByDate?: Record<string, number> // Date -> count of completed todos
  onWeekChange?: (weekStart: string, weekEnd: string) => void // Called when viewed week changes
}

export function WeekPicker({
  selectedDate,
  onDateSelect,
  todosByDate = {},
  completedByDate = {},
  onWeekChange,
}: WeekPickerProps) {
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  // Track which week we're viewing (offset from TODAY's week, not selected date)
  const [weekOffset, setWeekOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(
    null
  )

  // Touch handling refs
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep "today" stable for the lifetime of this component (same behavior as the old useMemo([]))
  const [today] = useState(() => new Date().toISOString().split('T')[0])

  // Get the start of today's week (Sunday)
  const todayWeekStart = (() => {
    const todayDate = new Date(today)
    const dayOfWeek = todayDate.getDay()
    const start = new Date(todayDate)
    start.setDate(todayDate.getDate() - dayOfWeek)
    return start
  })()

  // Calculate the week dates based on TODAY's week + offset (not selectedDate)
  const weekDates = (() => {
    const start = new Date(todayWeekStart)
    start.setDate(start.getDate() + weekOffset * 7)

    const dates: string[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  })()

  const weekStartIso = weekDates[0]
  const weekEndIso = weekDates[6]

  // Store callback in ref to avoid re-running effect when callback reference changes
  const onWeekChangeRef = useRef(onWeekChange)
  useEffect(() => {
    onWeekChangeRef.current = onWeekChange
  })

  // Notify parent when viewed week changes (only when week values change, not callback)
  useEffect(() => {
    if (onWeekChangeRef.current && weekStartIso && weekEndIso) {
      onWeekChangeRef.current(weekStartIso, weekEndIso)
    }
  }, [weekStartIso, weekEndIso])

  // Check if we're viewing the current week (week containing today)
  const isCurrentWeek = weekOffset === 0

  // Get the month/year label for the current week view
  const weekLabel = (() => {
    const startDate = new Date(weekStartIso)
    const endDate = new Date(weekEndIso)

    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' })
    const startYear = startDate.getFullYear()
    const endYear = endDate.getFullYear()

    if (startYear !== endYear) {
      return `${startMonth} ${startYear} - ${endMonth} ${endYear}`
    }
    if (startMonth !== endMonth) {
      return `${startMonth} - ${endMonth} ${startYear}`
    }
    return `${startMonth} ${startYear}`
  })()

  // Get status for a day - only if data exists for that specific date
  const getDayStatus = (date: string) => {
    const isSelected = date === selectedDate

    // Only show status if we have explicit data for this date
    const hasTodosData = date in todosByDate
    const hasCompletedData = date in completedByDate

    if (!hasTodosData && !hasCompletedData) {
      return { type: 'empty', isSelected, hasTodos: false }
    }

    const todos = todosByDate[date] || 0
    const completed = completedByDate[date] || 0

    if (todos === 0) {
      return { type: 'empty', isSelected, hasTodos: false }
    }

    if (completed === todos && todos > 0) {
      return { type: 'all-complete', isSelected, hasTodos: true }
    }

    if (completed > 0) {
      return { type: 'partial', isSelected, hasTodos: true }
    }

    return { type: 'pending', isSelected, hasTodos: true }
  }

  const formatDayNumber = (date: string) => {
    return new Date(date).getDate()
  }

  const isToday = (date: string) => {
    return date === today
  }

  // Navigate weeks with animation
  const navigateWeek = (direction: 'prev' | 'next') => {
    if (isAnimating) return

    setIsAnimating(true)
    setSlideDirection(direction === 'next' ? 'left' : 'right')

    setTimeout(() => {
      setWeekOffset((prev) => prev + (direction === 'next' ? 1 : -1))
      setSlideDirection(null)
      setIsAnimating(false)
    }, 200)
  }

  // Go to today
  const goToToday = () => {
    if (isAnimating) return

    setIsAnimating(true)
    setSlideDirection(weekOffset > 0 ? 'right' : 'left')

    setTimeout(() => {
      setWeekOffset(0)
      onDateSelect(today)
      setSlideDirection(null)
      setIsAnimating(false)
    }, 200)
  }

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return

    const diff = touchStartX.current - touchEndX.current
    const threshold = 50 // Minimum swipe distance

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swiped left -> next week
        navigateWeek('next')
      } else {
        // Swiped right -> previous week
        navigateWeek('prev')
      }
    }

    touchStartX.current = null
    touchEndX.current = null
  }

  return (
    <div className="relative">
      {/* Week label and navigation */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          onClick={() => navigateWeek('prev')}
          className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-white/60 transition-all active:scale-95"
          aria-label="Previous week"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 12L6 8L10 4" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground/60 tracking-wide">
            {weekLabel}
          </span>
          {!isCurrentWeek && (
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-primary text-white rounded-full hover:bg-primary/90 transition-all shadow-sm active:scale-95 animate-in fade-in slide-in-from-left-2 duration-200"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={() => navigateWeek('next')}
          className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-white/60 transition-all active:scale-95"
          aria-label="Next week"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 4L10 8L6 12" />
          </svg>
        </button>
      </div>

      {/* Swipeable week view */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="overflow-hidden touch-pan-y"
      >
        <div
          className={cn(
            'flex items-center justify-around transition-all duration-200',
            slideDirection === 'left' && 'opacity-0 -translate-x-8',
            slideDirection === 'right' && 'opacity-0 translate-x-8'
          )}
        >
          {weekDates.map((date, index) => {
            const dayName = daysOfWeek[index]
            const dayNumber = formatDayNumber(date)
            const status = getDayStatus(date)
            const isTodayDate = isToday(date)

            return (
              <button
                key={date}
                onClick={() => onDateSelect(date)}
                className={cn(
                  'flex flex-col items-center gap-1 min-w-[44px] py-1 transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-xl'
                )}
              >
                <span
                  className={cn(
                    'text-[10px] font-semibold uppercase tracking-wider',
                    isTodayDate ? 'text-primary' : 'text-foreground/50'
                  )}
                >
                  {dayName}
                </span>
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200',
                    status.isSelected
                      ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30'
                      : 'bg-white/60 hover:bg-white/90',
                    isTodayDate &&
                      !status.isSelected &&
                      'ring-2 ring-primary/40'
                  )}
                >
                  <span
                    className={cn(
                      status.isSelected
                        ? 'text-white'
                        : isTodayDate
                          ? 'text-primary font-extrabold'
                          : 'text-foreground/70'
                    )}
                  >
                    {dayNumber}
                  </span>
                </div>
                {/* Status indicator dot below the day circle */}
                <div className="h-1.5 flex items-center justify-center">
                  {status.hasTodos && !status.isSelected && (
                    <div
                      className={cn(
                        'w-1.5 h-1.5 rounded-full transition-all',
                        status.type === 'all-complete' && 'bg-emerald-500',
                        status.type === 'partial' && 'bg-amber-500',
                        status.type === 'pending' && 'bg-foreground/30'
                      )}
                    />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Swipe hint indicator dots */}
      <div className="flex justify-center gap-1.5 mt-2">
        <div
          className={cn(
            'w-1.5 h-1.5 rounded-full transition-all duration-300',
            weekOffset < 0
              ? 'bg-primary/60 scale-100'
              : 'bg-foreground/15 scale-75'
          )}
        />
        <div
          className={cn(
            'w-1.5 h-1.5 rounded-full transition-all duration-300',
            weekOffset === 0
              ? 'bg-primary scale-125'
              : 'bg-foreground/15 scale-75'
          )}
        />
        <div
          className={cn(
            'w-1.5 h-1.5 rounded-full transition-all duration-300',
            weekOffset > 0
              ? 'bg-primary/60 scale-100'
              : 'bg-foreground/15 scale-75'
          )}
        />
      </div>
    </div>
  )
}
