import { useRef, useState, useEffect, RefObject } from 'react';

interface UseHorizontalScrollReturn {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  showLeftShadow: boolean;
  showRightShadow: boolean;
  scrollHorizontally: (direction: 'left' | 'right') => void;
  handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
}

export function useHorizontalScroll(): UseHorizontalScrollReturn {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftShadow(scrollLeft > 0);
    setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 5);
  };

  const scrollHorizontally = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = 300; // Scroll by roughly one card width
    const targetScroll = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount;
    
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // If it's a horizontal scroll gesture (trackpad swipe left/right), let it work naturally
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      return; // Native horizontal scroll - don't interfere
    }

    // Check if the event target is inside a card
    const target = e.target as HTMLElement;
    const card = target.closest('.hover\\:shadow-lg'); // Cards have this class

    // If we're over a card, check if it has a scrollbar
    if (card) {
      const scrollableDiv = card.querySelector('div[style*="overflow-y"]') as HTMLElement;
      if (scrollableDiv && scrollableDiv.scrollHeight > scrollableDiv.clientHeight) {
        // Card is scrollable, don't handle horizontal scroll
        return;
      }
    }

    // Otherwise, convert vertical scroll to horizontal
    e.preventDefault();
    container.scrollLeft += e.deltaY;
  };

  useEffect(() => {
    checkScroll();
    const handleScroll = () => checkScroll();
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    
    window.addEventListener('resize', checkScroll);
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  return {
    scrollContainerRef,
    showLeftShadow,
    showRightShadow,
    scrollHorizontally,
    handleWheel
  };
}