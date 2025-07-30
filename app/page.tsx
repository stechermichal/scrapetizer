'use client';

import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { RefreshCw, Utensils, ChevronLeft, ChevronRight } from 'lucide-react';
import { RestaurantMenu } from '@/lib/types';
import { MenuCard } from './components/MenuCard';
import { MenuCardSkeleton } from './components/MenuCardSkeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getCurrentCzechDayUrl } from '@/lib/utils/czech-days';

interface MenuResponse {
  date: string;
  menus: RestaurantMenu[];
  lastUpdated: string | null;
}

export default function Home() {
  const [menus, setMenus] = useState<RestaurantMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/menus');
      if (!response.ok) {
        throw new Error('Failed to fetch menus');
      }
      
      const data: MenuResponse = await response.json();
      setMenus(data.menus);
      setLastUpdated(data.lastUpdated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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
    fetchMenus();
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [menus]);

  const today = format(new Date(), 'EEEE d. MMMM', { locale: cs });

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Utensils className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Scrapetizer</h1>
                <p className="text-sm text-muted-foreground">{today}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <p className="text-xs text-muted-foreground">
                  Last updated: {format(new Date(lastUpdated), 'HH:mm')}
                </p>
              )}
              <button
                onClick={fetchMenus}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Refresh menus"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 overflow-hidden flex flex-col">
        {error ? (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col relative" onWheel={handleWheel}>
            <div 
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex items-start gap-6 overflow-x-auto pb-4 w-full"
            >
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <MenuCardSkeleton key={i} />)
                : menus.map((menu) => (
                    <MenuCard key={menu.restaurantId} menu={menu} />
                  ))}
            </div>
            
            {/* Left shadow */}
            {showLeftShadow && (
              <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
            )}
            
            {/* Right shadow */}
            {showRightShadow && (
              <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            )}
            
            {/* Left arrow button - hidden on mobile */}
            {showLeftShadow && (
              <button
                onClick={() => scrollHorizontally('left')}
                className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border rounded-full p-2 shadow-md hover:bg-accent transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            
            {/* Right arrow button - hidden on mobile */}
            {showRightShadow && (
              <button
                onClick={() => scrollHorizontally('right')}
                className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border rounded-full p-2 shadow-md hover:bg-accent transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {!loading && !error && menus.length === 0 && (
          <div className="text-center py-12">
            <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No menus available</h2>
            <p className="text-muted-foreground">
              Try running the scraper to fetch today&apos;s menus.
            </p>
            <pre className="mt-4 text-sm bg-muted px-3 py-2 rounded-md inline-block">
              npm run scrape:restaurant
            </pre>
          </div>
        )}
        
        {/* Unreadable restaurants section */}
        <div className="mt-8 p-4 bg-muted rounded-lg flex-shrink-0">
          <h2 className="text-xl font-semibold mb-3">Restaurants with unreadable menus 😢</h2>
          <div className="flex flex-wrap gap-4">
            <a 
              href="https://www.lasadelitas.cz/denni-menu/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Las Adelitas →
            </a>
            <a 
              href={`https://masaryckarestaurace.choiceqr.com/section:poledni-menu/${getCurrentCzechDayUrl()}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Masarycka →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}