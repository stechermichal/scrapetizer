import { chromium, Browser, Page } from 'playwright';
import { Restaurant, RestaurantMenu, ScraperResult, MenuItem } from '../types';
import { getCurrentCzechDay, formatCzechDate } from '../utils/czech-days';

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected page: Page | null = null;

  constructor(protected restaurant: Restaurant) {}

  async init(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
    
    // Set Czech locale and timezone
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'cs-CZ,cs;q=0.9'
    });
  }

  async cleanup(): Promise<void> {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
  }

  async scrape(): Promise<ScraperResult> {
    try {
      await this.init();
      
      const url = this.getMenuUrl();
      console.log(`🔍 Scraping ${this.restaurant.name} from ${url}`);
      
      await this.page!.goto(url, { waitUntil: 'networkidle' });
      
      // Wait a bit for dynamic content
      await this.page!.waitForTimeout(2000);
      
      const items = await this.extractMenuItems();
      
      const menu: RestaurantMenu = {
        restaurantId: this.restaurant.id,
        restaurantName: this.restaurant.name,
        date: new Date().toISOString().split('T')[0],
        dayOfWeek: getCurrentCzechDay(),
        items,
        sourceUrl: url,
        scrapedAt: new Date().toISOString(),
        isAvailable: items.length > 0,
        errorMessage: items.length === 0 ? 'No menu items found' : undefined
      };

      return { success: true, menu };
    } catch (error) {
      console.error(`❌ Error scraping ${this.restaurant.name}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      await this.cleanup();
    }
  }

  protected abstract getMenuUrl(): string;
  protected abstract extractMenuItems(): Promise<MenuItem[]>;

  protected parsePrice(priceText: string): number {
    // Extract number from strings like "189 Kč", "189,-", "Kč 189"
    const match = priceText.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  protected cleanText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ');
  }
  
  protected normalizeText(text: string): string {
    // Clean the text first
    const cleaned = this.cleanText(text);
    
    // Convert to lowercase and capitalize first letter
    if (cleaned.length === 0) return cleaned;
    
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  }
}