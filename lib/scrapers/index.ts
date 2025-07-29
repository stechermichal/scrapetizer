import { Restaurant, ScraperResult } from '../types';
import { BaseScraper } from './base';
import { HybernskaScraper } from './hybernska';
import { MagburgerScraper } from './magburger';
import { TiskarnaScraper } from './tiskarna';
import { SaporeveroScraper } from './saporevero';
import { MeatbeerScraper } from './meatbeer';
import { NekazankaScraper } from './nekazanka';

// Type for concrete scraper classes
type ScraperClass = new (restaurant: Restaurant) => BaseScraper;

// Map of scraper classes by restaurant ID
const scraperMap: Record<string, ScraperClass> = {
  'hybernska': HybernskaScraper,
  'magburger': MagburgerScraper,
  'tiskarna': TiskarnaScraper,
  'saporevero': SaporeveroScraper,
  'meatbeer': MeatbeerScraper,
  'nekazanka': NekazankaScraper,
};

export async function scrapeRestaurant(restaurant: Restaurant): Promise<ScraperResult> {
  const ScraperClass = scraperMap[restaurant.id];
  
  if (!ScraperClass) {
    console.warn(`⚠️  No scraper implemented for ${restaurant.name} (${restaurant.id})`);
    return {
      success: false,
      error: `No scraper implemented for restaurant ${restaurant.id}`
    };
  }

  const scraper = new ScraperClass(restaurant);
  return await scraper.scrape();
}

export { BaseScraper } from './base';
export { HybernskaScraper } from './hybernska';
export { MagburgerScraper } from './magburger';
export { TiskarnaScraper } from './tiskarna';
export { SaporeveroScraper } from './saporevero';
export { MeatbeerScraper } from './meatbeer';
export { NekazankaScraper } from './nekazanka';