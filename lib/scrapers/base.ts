import { chromium, Browser, Page } from 'playwright';
import { Restaurant, RestaurantMenu, ScraperResult, MenuItem } from '../types';
import { getCurrentCzechDay } from '../utils/czech-days';
import { logger } from '../utils/logger';

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected page: Page | null = null;

  constructor(protected restaurant: Restaurant) {}

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      // More robust in CI environments with limited shared memory
      args: ['--disable-dev-shm-usage']
    });
    this.page = await this.browser.newPage();
    // Be a bit more forgiving for slower sites
    this.page.setDefaultNavigationTimeout(45000);
    this.page.setDefaultTimeout(15000);
    
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
      logger.info(`Scraping ${this.restaurant.name}`, { url, restaurantId: this.restaurant.id });
      
      await this.gotoWithRetries(url);
      // Small settle time for dynamic content
      await this.page!.waitForTimeout(1000);
      
      const items = await this.safeExtractMenuItems();
      
      const hasRealItems = items.some(i => (i as any)?.price && (i as any).price > 0);
      const menu: RestaurantMenu = {
        restaurantId: this.restaurant.id,
        restaurantName: this.restaurant.name,
        date: new Date().toISOString().split('T')[0],
        dayOfWeek: getCurrentCzechDay(),
        items,
        sourceUrl: url,
        instagramUrl: this.restaurant.instagramUrl,
        scrapedAt: new Date().toISOString(),
        isAvailable: hasRealItems,
        errorMessage: hasRealItems ? undefined : 'No valid menu items found'
      };

      logger.info(`Successfully scraped ${this.restaurant.name}`, { 
        itemCount: items.length,
        restaurantId: this.restaurant.id 
      });

      return { success: true, menu };
    } catch (error) {
      logger.error(`Error scraping ${this.restaurant.name}`, error, { 
        restaurantId: this.restaurant.id 
      });
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

  /**
   * Wrapper for extractMenuItems with consistent error handling and logging
   */
  protected async safeExtractMenuItems(): Promise<MenuItem[]> {
    try {
      logger.debug(`Extracting menu items for ${this.restaurant.name}`);
      const items = await this.extractMenuItems();
      
      if (items.length > 0) {
        logger.info(`Found ${items.length} menu items from ${this.restaurant.name}`);
        // Log first 3 items for debugging
        items.slice(0, 3).forEach((item, index) => {
          logger.debug(`Item ${index + 1}: ${item.name}: ${item.price} Kč`);
        });
      } else {
        logger.warn(`No menu items found for ${this.restaurant.name}`);
      }
      
      return items;
    } catch (error) {
      logger.error(`Error extracting menu items from ${this.restaurant.name}`, error);
      return [];
    }
  }

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

  /**
   * Process menu item data with consistent formatting
   */
  protected createMenuItem(name: string, priceText: string, description?: string): MenuItem {
    return {
      name: this.normalizeText(name),
      price: this.parsePrice(priceText),
      description: description ? this.normalizeText(description) : undefined
    };
  }

  private async gotoWithRetries(url: string, attempts: number = 3): Promise<void> {
    let lastError: unknown = null;
    for (let i = 1; i <= attempts; i++) {
      try {
        // 'domcontentloaded' is less flaky than 'networkidle' on sites with beacons
        await this.page!.goto(url, { waitUntil: 'domcontentloaded' });
        return;
      } catch (err) {
        lastError = err;
        logger.warn(`Navigation attempt ${i} failed for ${url}`);
        if (i < attempts) {
          await this.page!.waitForTimeout(1000 * i);
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Navigation failed');
  }
}
