import { BaseScraper } from './base';
import { MenuItem } from '../types';

export class KantynaScraper extends BaseScraper {
  protected getMenuUrl(): string {
    return 'https://www.kantyna.ambi.cz/menu/denni-menu';
  }

  async extractMenuItems(): Promise<MenuItem[]> {
    console.log('🍴 Scraping Kantyna Ambi menu...');

    try {
      // Wait for menu items to load
      await this.page!.waitForSelector('li.MenuItem_itemWrapper__IptXL', { timeout: 10000 });

      // Extract all menu items
      const items = await this.page!.evaluate(() => {
        const menuItems: Array<{ name: string; description?: string; price: string }> = [];
        const itemElements = document.querySelectorAll('li.MenuItem_itemWrapper__IptXL');

        itemElements.forEach((item) => {
          const nameEl = item.querySelector('.MenuItem_name__4OMO2');
          const descriptionEl = item.querySelector('.MenuItem_description__PEtmC');
          const priceEl = item.querySelector('.MenuItem_price__6_X_Z');

          const name = nameEl?.textContent?.trim();
          const description = descriptionEl?.textContent?.trim();
          const price = priceEl?.textContent?.trim();

          if (name && price) {
            menuItems.push({
              name,
              description: description || undefined,
              price
            });
          }
        });

        return menuItems;
      });

      console.log(`✅ Found ${items.length} items at Kantyna Ambi`);

      if (items.length === 0) {
        return [{
          name: 'Menu not posted yet',
          price: 0,
          description: 'Check back later'
        }];
      }

      // Process items: combine name with description if present
      return items.map(item => {
        const fullName = item.description
          ? `${item.name} - ${item.description}`
          : item.name;

        return this.createMenuItem(fullName, item.price);
      });

    } catch (error) {
      console.error('Error scraping Kantyna Ambi:', error);

      if (error instanceof Error && error.name === 'TimeoutError') {
        return [{
          name: 'Menu not posted yet',
          price: 0,
          description: 'Check back later'
        }];
      }

      return [{
        name: 'Menu temporarily unavailable',
        price: 0,
        description: 'Could not process menu'
      }];
    }
  }
}
