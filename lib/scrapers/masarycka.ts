import { BaseScraper } from './base';
import { MenuItem } from '../types';
import { getCurrentCzechDayUrl, czechDays } from '../utils/czech-days';
import { getDay } from 'date-fns';

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

    // Get current Czech day name for filtering
    const dayIndex = getDay(new Date());
    const currentDayName = czechDays[dayIndex];

    // Extract menu items from the page
    const menuData = await this.page!.evaluate((dayName: string) => {
      const itemsData: Array<{
        name: string;
        description: string;
        priceText: string;
      }> = [];

      // Find the section for the current day
      // Look for headings that contain the day name (case insensitive)
      const allHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, [class*="heading"], [class*="title"]'));

      let daySection: Element | null = null;
      let nextDaySection: Element | null = null;

      // Find the heading that matches current day
      for (let i = 0; i < allHeadings.length; i++) {
        const heading = allHeadings[i];
        const headingText = heading.textContent?.toLowerCase() || '';

        if (headingText.includes(dayName.toLowerCase())) {
          daySection = heading;
          // Find the next day section to know where to stop
          if (i + 1 < allHeadings.length) {
            nextDaySection = allHeadings[i + 1];
          }
          break;
        }
      }

      if (!daySection) {
        console.log('Could not find day section for:', dayName);
        return itemsData;
      }

      // Get all text between this day section and the next day section
      let currentElement: Element | null = daySection;
      const seenItems = new Set<string>();

      // Walk through siblings until we hit the next day section
      while (currentElement) {
        currentElement = currentElement.nextElementSibling;

        // Stop if we hit the next day section
        if (currentElement === nextDaySection || !currentElement) {
          break;
        }

        // Get text content from this element
        const text = currentElement.textContent?.trim() || '';
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        // Look for lines with prices
        for (const line of lines) {
          // Match pattern: "Item name XXX Kč" or just "XXX Kč"
          const priceMatch = line.match(/^(.+?)\s*(\d+)\s*(?:Kč|kč)\s*$/);

          if (priceMatch) {
            const name = priceMatch[1].trim();
            const price = priceMatch[2];

            // Create a unique key to avoid duplicates
            const itemKey = `${name}|${price}`;

            if (name.length > 3 && !seenItems.has(itemKey)) {
              seenItems.add(itemKey);
              itemsData.push({
                name,
                description: '',
                priceText: price
              });
            }
          }
        }
      }

      // If we didn't find items with the section approach, try a simpler approach
      // Just look at the visible text near the day name
      if (itemsData.length === 0 && daySection) {
        const sectionText = daySection.parentElement?.textContent || '';
        const lines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        let inCurrentDay = false;
        const seenItems = new Set<string>();

        for (const line of lines) {
          // Check if we've reached our day
          if (line.toLowerCase().includes(dayName.toLowerCase())) {
            inCurrentDay = true;
            continue;
          }

          // Check if we've hit another day (stop processing)
          const otherDays = ['pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek'];
          if (inCurrentDay && otherDays.some(d => d !== dayName && line.toLowerCase().includes(d))) {
            break;
          }

          if (inCurrentDay) {
            const priceMatch = line.match(/^(.+?)\s*(\d+)\s*(?:Kč|kč)\s*$/);

            if (priceMatch) {
              const name = priceMatch[1].trim();
              const price = priceMatch[2];
              const itemKey = `${name}|${price}`;

              if (name.length > 3 && !seenItems.has(itemKey)) {
                seenItems.add(itemKey);
                itemsData.push({
                  name,
                  description: '',
                  priceText: price
                });
              }
            }
          }
        }
      }

      return itemsData;
    }, currentDayName);

    // Process the extracted data using base class helper
    return menuData
      .filter(item => item.name && item.priceText)
      .map(item =>
        this.createMenuItem(item.name, item.priceText, item.description || undefined)
      );
  }
}
