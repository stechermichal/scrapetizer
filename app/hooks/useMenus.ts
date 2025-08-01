import { useState, useEffect } from 'react';
import { RestaurantMenu } from '@/lib/types';
import { toast } from 'sonner';

interface MenuResponse {
  date: string;
  menus: RestaurantMenu[];
  lastUpdated: string | null;
}

interface UseMenusReturn {
  menus: RestaurantMenu[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  isScraping: boolean;
  fetchMenus: () => Promise<void>;
  triggerScrape: () => Promise<void>;
}

export function useMenus(): UseMenusReturn {
  const [menus, setMenus] = useState<RestaurantMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);

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

  const triggerScrape = async () => {
    try {
      setIsScraping(true);
      
      const response = await fetch('/api/scrape', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 429) {
          toast.error(data.error);
        } else {
          toast.error('Failed to start scraping');
        }
        return;
      }
      
      toast.success('Scraping started! This might take up to 4 minutes.', {
        duration: 6000,
      });
      
      // Poll for updates every 30 seconds
      const pollInterval = setInterval(async () => {
        await fetchMenus();
      }, 30000);
      
      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsScraping(false);
        toast.info('Scraping should be complete. Refresh the page if needed.');
      }, 5 * 60 * 1000);
      
    } catch (err) {
      toast.error('Failed to trigger scraping');
      setIsScraping(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  return {
    menus,
    loading,
    error,
    lastUpdated,
    isScraping,
    fetchMenus,
    triggerScrape
  };
}