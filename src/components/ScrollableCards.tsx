import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollableCardsProps {
  children: React.ReactNode;
}

export function ScrollableCards({ children }: ScrollableCardsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const updateArrowVisibility = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1); // -1 to handle rounding errors
    }
  };

  useEffect(() => {
    // Initial check for right arrow
    if (!isInitialized && scrollContainerRef.current) {
      const { scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowRightArrow(scrollWidth > clientWidth);
      setIsInitialized(true);
    }

    updateArrowVisibility();
    window.addEventListener('resize', updateArrowVisibility);
    return () => window.removeEventListener('resize', updateArrowVisibility);
  }, [isInitialized]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });

      // Update arrows after scroll animation
      setTimeout(updateArrowVisibility, 300);
    }
  };

  return (
    <div className="relative">
      {/* Left Arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-2 shadow-md hover:bg-white transition-all"
        >
          <ChevronLeft className="h-6 w-6 text-gray-600" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide scroll-smooth"
        onScroll={updateArrowVisibility}
      >
        <div className="flex gap-6 p-4">
          {children}
        </div>
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-2 shadow-md hover:bg-white transition-all"
        >
          <ChevronRight className="h-6 w-6 text-gray-600" />
        </button>
      )}
    </div>
  );
}