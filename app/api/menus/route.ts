import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import { loadMenuData } from '@/lib/utils/storage';
import { restaurants } from '@/lib/config/restaurants';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
    
    // In production (Vercel), read from public directory
    // In development, use the file system
    let menus: any[] = [];
    
    if (process.env.NODE_ENV === 'production') {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL || ''}/data/menus/${date}.json`);
        if (response.ok) {
          menus = await response.json();
        }
      } catch (error) {
        console.log('No menu data found for', date);
      }
    } else {
      // Development: use file system
      menus = await loadMenuData(date);
    }
    
    // If no menus found, return empty array with restaurant info
    if (menus.length === 0) {
      const emptyMenus = restaurants.map(restaurant => ({
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        date,
        dayOfWeek: format(new Date(date), 'EEEE'),
        items: [],
        sourceUrl: restaurant.url,
        scrapedAt: null,
        isAvailable: false,
        errorMessage: 'No menu data available'
      }));
      
      return NextResponse.json({
        date,
        menus: emptyMenus,
        lastUpdated: null
      });
    }
    
    // Get the most recent scrape time
    const lastUpdated = menus.reduce((latest, menu) => {
      const menuTime = new Date(menu.scrapedAt).getTime();
      return menuTime > latest ? menuTime : latest;
    }, 0);
    
    return NextResponse.json({
      date,
      menus,
      lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : null
    });
  } catch (error) {
    console.error('Error fetching menus:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu data' },
      { status: 500 }
    );
  }
}