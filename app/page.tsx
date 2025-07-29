'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { RefreshCw, Utensils } from 'lucide-react';
import { RestaurantMenu } from '@/lib/types';
import { MenuCard } from './components/MenuCard';
import { MenuCardSkeleton } from './components/MenuCardSkeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  useEffect(() => {
    fetchMenus();
  }, []);

  const today = format(new Date(), 'EEEE d. MMMM', { locale: cs });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Utensils className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Scrapetizer</h1>
                <p className="text-sm text-muted-foreground">{today}</p>
              </div>
            </div>
            
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
          
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {format(new Date(lastUpdated), 'HH:mm')}
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error ? (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <MenuCardSkeleton key={i} />)
              : menus.map((menu) => (
                  <MenuCard key={menu.restaurantId} menu={menu} />
                ))}
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
      </main>
    </div>
  );
}