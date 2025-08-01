'use client';

import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { RefreshCw, Utensils } from 'lucide-react';

interface HeaderProps {
  lastUpdated: string | null;
  loading: boolean;
  isScraping: boolean;
  onRefresh: () => void;
}

export function Header({ lastUpdated, loading, isScraping, onRefresh }: HeaderProps) {
  const today = format(new Date(), 'EEEE d. MMMM', { locale: cs });

  return (
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
              onClick={onRefresh}
              disabled={loading || isScraping}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Refresh menus"
            >
              <RefreshCw className={`h-4 w-4 ${loading || isScraping ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isScraping ? 'Scraping...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}