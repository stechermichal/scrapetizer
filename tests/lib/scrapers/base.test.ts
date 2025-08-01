import { BaseScraper } from '@/lib/scrapers/base';
import { Restaurant, MenuItem } from '@/lib/types';

// Create a concrete implementation for testing
class TestScraper extends BaseScraper {
  protected getMenuUrl(): string {
    return 'https://example.com/menu';
  }

  protected async extractMenuItems(): Promise<MenuItem[]> {
    return [
      { name: 'Test Item 1', price: 100, description: 'Test description' },
      { name: 'Test Item 2', price: 150 }
    ];
  }
}

describe('BaseScraper', () => {
  let scraper: TestScraper;
  const mockRestaurant: Restaurant = {
    id: 'test-restaurant',
    name: 'Test Restaurant',
    url: 'https://example.com',
    scraperType: 'test'
  };

  beforeEach(() => {
    scraper = new TestScraper(mockRestaurant);
  });

  describe('parsePrice', () => {
    it('should parse price from various formats', () => {
      expect(scraper['parsePrice']('189 Kč')).toBe(189);
      expect(scraper['parsePrice']('189,-')).toBe(189);
      expect(scraper['parsePrice']('Kč 189')).toBe(189);
      expect(scraper['parsePrice']('Price: 250 Kč')).toBe(250);
    });

    it('should return 0 for invalid price text', () => {
      expect(scraper['parsePrice']('no price')).toBe(0);
      expect(scraper['parsePrice']('')).toBe(0);
    });
  });

  describe('cleanText', () => {
    it('should clean whitespace and newlines', () => {
      expect(scraper['cleanText']('  hello   world  ')).toBe('hello world');
      expect(scraper['cleanText']('hello\n\nworld')).toBe('hello world');
      expect(scraper['cleanText']('  multiple   spaces   ')).toBe('multiple spaces');
    });
  });

  describe('normalizeText', () => {
    it('should capitalize first letter and lowercase rest', () => {
      expect(scraper['normalizeText']('HELLO WORLD')).toBe('Hello world');
      expect(scraper['normalizeText']('test item')).toBe('Test item');
      expect(scraper['normalizeText']('  MIXED case TEXT  ')).toBe('Mixed case text');
    });

    it('should handle empty strings', () => {
      expect(scraper['normalizeText']('')).toBe('');
      expect(scraper['normalizeText']('   ')).toBe('');
    });
  });

  describe('createMenuItem', () => {
    it('should create menu item with normalized text and parsed price', () => {
      const item = scraper['createMenuItem']('BURGER DELUXE', '150 Kč', 'WITH FRIES');
      
      expect(item).toEqual({
        name: 'Burger deluxe',
        price: 150,
        description: 'With fries'
      });
    });

    it('should handle missing description', () => {
      const item = scraper['createMenuItem']('BURGER', '100 Kč');
      
      expect(item).toEqual({
        name: 'Burger',
        price: 100,
        description: undefined
      });
    });
  });

  describe('safeExtractMenuItems', () => {
    it('should return menu items on success', async () => {
      const items = await scraper['safeExtractMenuItems']();
      
      expect(items).toHaveLength(2);
      expect(items[0].name).toBe('Test Item 1');
    });

    it('should return empty array on error', async () => {
      // Override extractMenuItems to throw error
      scraper['extractMenuItems'] = async () => {
        throw new Error('Extraction failed');
      };
      
      const items = await scraper['safeExtractMenuItems']();
      expect(items).toEqual([]);
    });
  });
});