export interface MenuItem {
  name: string;
  price: number;
  description?: string;
}

export interface RestaurantMenu {
  restaurantId: string;
  restaurantName: string;
  date: string; // ISO date format
  dayOfWeek: string; // Czech day name
  items: MenuItem[];
  sourceUrl: string;
  instagramUrl?: string;
  scrapedAt: string; // ISO timestamp
  isAvailable: boolean;
  errorMessage?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  url: string;
  menuUrl?: string; // If different from main URL
  instagramUrl?: string; // Instagram profile URL
  scrapeConfig: {
    type: 'static' | 'dynamic' | 'pdf';
    selectors?: {
      menuContainer?: string;
      menuItem?: string;
      itemName?: string;
      itemPrice?: string;
      itemDescription?: string;
      daySection?: string; // For sites with multiple days on one page
    };
    dayUrlPattern?: string; // For dynamic URLs like /menu/{day}
    pdfUrl?: string; // For PDF menus
  };
}

export interface ScraperResult {
  success: boolean;
  menu?: RestaurantMenu;
  error?: string;
}