import { Restaurant, ScraperResult } from '../types';
import { BaseScraper } from './base';
import { HybernskaScraper } from './hybernska';
import { MasaryckaScraper } from './masarycka';
import { MagburgerScraper } from './magburger';
import { TiskarnaScraper } from './tiskarna';

// Map of scraper classes by restaurant ID
const scraperMap: Record<string, typeof BaseScraper> = {
  'hybernska': HybernskaScraper,
  'masarycka': MasaryckaScraper,
  'magburger': MagburgerScraper,
  'tiskarna': TiskarnaScraper,
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
export { MasaryckaScraper } from './masarycka';
export { MagburgerScraper } from './magburger';
export { TiskarnaScraper } from './tiskarna';