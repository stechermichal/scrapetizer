import { BaseScraper } from './base';
import { MenuItem } from '../types';
import { getCurrentCzechDayUrl } from '../utils/czech-days';

export class MasaryckaScraper extends BaseScraper {
  protected getMenuUrl(): string {
    // Get the day-based URL pattern from config
    const pattern = this.restaurant.scrapeConfig.dayUrlPattern;
    if (!pattern) {
      return this.restaurant.menuUrl || this.restaurant.url;
    }

    // Replace {day} with current Czech day
    const currentDay = getCurrentCzechDayUrl();
    return pattern.replace('{day}', currentDay);
  }

  protected async extractMenuItems(): Promise<MenuItem[]> {
    // Wait for content to load
    await this.page!.waitForTimeout(2000);

    // Extract menu items from the page
    const menuData = await this.page!.evaluate(() => {
      const itemsData: Array<{
        name: string;
        description: string;
        priceText: string;
      }> = [];

      // Try to find menu items - ChoiceQR typically uses specific structure
      // Look for elements that might contain menu items
      const possibleContainers = [
        '.menu-item',
        '.item',
        '.product',
        '[class*="menu"]',
        '[class*="item"]'
      ];

      let items: Element[] = [];

      // Try each selector until we find items
      for (const selector of possibleContainers) {
        const found = Array.from(document.querySelectorAll(selector));
        if (found.length > 0) {
          items = found;
          break;
        }
      }

      // If no items found with selectors, try a different approach
      // Look for all elements with text that contains price patterns
      if (items.length === 0) {
        const bodyText = document.body.innerText;
        const lines = bodyText.split('\n');

        let currentName = '';
        let currentDescription = '';

        for (const line of lines) {
          const trimmed = line.trim();

          // Skip empty lines
          if (!trimmed) continue;

          // Check if line contains a price (number followed by Kč or just a number at the end)
          const priceMatch = trimmed.match(/(\d+)\s*(?:Kč|,-|,-)?\s*$/);

          if (priceMatch) {
            // This line has a price, extract the name and description
            const nameAndPrice = trimmed;
            const name = nameAndPrice.replace(/\d+\s*(?:Kč|,-|,-)?\s*$/, '').trim();

            if (name && name.length > 2) {
              itemsData.push({
                name: name,
                description: currentDescription,
                priceText: priceMatch[1]
              });
            }

            currentDescription = '';
          } else if (trimmed.length > 15 && !trimmed.match(/^\d/)) {
            // This might be a description or name
            if (!currentName) {
              currentName = trimmed;
            } else {
              currentDescription = trimmed;
            }
          }
        }
      } else {
        // Process found items
        items.forEach(item => {
          const nameEl = item.querySelector('[class*="name"], [class*="title"], h3, h4, strong');
          const priceEl = item.querySelector('[class*="price"], [class*="cena"]');
          const descEl = item.querySelector('[class*="desc"], [class*="popis"], p');

          const name = nameEl?.textContent?.trim() || '';
          const priceText = priceEl?.textContent?.trim() || '';
          const description = descEl?.textContent?.trim() || '';

          if (name && priceText) {
            itemsData.push({
              name,
              description,
              priceText
            });
          }
        });
      }

      return itemsData;
    });

    // Process the extracted data using base class helper
    return menuData
      .filter(item => item.name && item.priceText)
      .map(item =>
        this.createMenuItem(item.name, item.priceText, item.description || undefined)
      );
  }
}
