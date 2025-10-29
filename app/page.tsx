'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MenuCard } from './components/MenuCard';
import { MenuCardSkeleton } from './components/MenuCardSkeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Header } from './components/Header';
import { EmptyState } from './components/EmptyState';
import { useMenus } from './hooks/useMenus';
import { useHorizontalScroll } from './hooks/useHorizontalScroll';

export default function Home() {
  const { menus, loading, error, lastUpdated, isScraping, triggerScrape } = useMenus();
  const { 
    scrollContainerRef, 
    showLeftShadow, 
    showRightShadow, 
    scrollHorizontally, 
    handleWheel 
  } = useHorizontalScroll();

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header 
        lastUpdated={lastUpdated}
        loading={loading}
        isScraping={isScraping}
        onRefresh={triggerScrape}
      />

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
              className="flex items-start gap-6 overflow-x-auto pb-4 h-full"
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

        {!loading && !error && menus.length === 0 && <EmptyState />}
      </main>
    </div>
  );
}