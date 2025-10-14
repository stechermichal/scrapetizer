import { BaseScraper } from './base';
import { MenuItem } from '../types';

export class SaporeveroScraper extends BaseScraper {
  protected getMenuUrl(): string {
    return 'https://www.saporevero.cz/';
  }

  async init(): Promise<void> {
    await super.init();

    // Set Czech locale cookie before navigation
    const context = this.page!.context();
    await context.addCookies([{
      name: 'NEXT_LOCALE',
      value: 'cz',
      domain: '.saporevero.cz',
      path: '/'
    }]);
  }

  async extractMenuItems(): Promise<MenuItem[]> {
    console.log('Looking for Denní Menu button on Sapore Vero...');

    try {
      // Wait for page to load and Czech button to appear
      await this.page!.waitForTimeout(2000);

      // Find and click the "Denní Menu" button
      const dailyMenuButton = await this.page!.waitForSelector('button:has-text("Denní Menu"), a:has-text("Denní Menu")', {
        timeout: 10000
      }).catch(() => null);

      if (!dailyMenuButton) {
        console.log('📅 Denní Menu button not found - menu may not be available today');
        return [{
          name: 'Menu not posted yet',
          price: 0,
          description: 'Check back later'
        }];
      }

      await dailyMenuButton.click();
      console.log('✅ Clicked Denní Menu button, waiting for modal...');

      // Wait for modal content to load
      await this.page!.waitForTimeout(2000);

      // Extract menu items from the modal
      const items = await this.page!.evaluate(() => {
        const menuItems: Array<{ name: string; price: string }> = [];

        // Find all menu item containers (they have h4 for Italian name)
        const itemContainers = document.querySelectorAll('h4.font-sans.text-lg.font-bold');

        itemContainers.forEach((italianNameEl) => {
          // Find the price in the same container
          const priceContainer = italianNameEl.parentElement?.parentElement;
          const priceEl = priceContainer?.querySelector('p.text-sm');
          const priceText = priceEl?.textContent?.trim();

          // Find the Czech description (in <p> tag after the price div)
          const descriptionEl = priceContainer?.querySelector('p.mt-1');
          const descriptionText = descriptionEl?.textContent?.trim();

          if (!descriptionText || !priceText) return;

          // Extract Czech name from description (before the dash or English translation)
          // Format: "Czech name - English name" or just "Czech name"
          const czechName = descriptionText.split('-')[0].trim();

          if (czechName && priceText) {
            menuItems.push({ name: czechName, price: priceText });
          }
        });

        return menuItems;
      });

      if (items.length === 0) {
        console.log('⚠️ No menu items found in modal');
        return [{
          name: 'Menu not posted yet',
          price: 0,
          description: 'Check back later'
        }];
      }

      console.log(`✅ Found ${items.length} menu items from modal`);

      // Process and normalize items
      return items.map(item =>
        this.createMenuItem(item.name, item.price)
      );

    } catch (error) {
      console.error('Error processing Sapore Vero menu:', error);

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