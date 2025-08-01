import { BaseScraper } from './base';
import { MenuItem } from '../types';

export class HybernskaScraper extends BaseScraper {
  protected getMenuUrl(): string {
    return this.restaurant.url;
  }

  protected async extractMenuItems(): Promise<MenuItem[]> {
    // Get the page content and parse it
    const menuData = await this.page!.evaluate(() => {
      const itemsData: Array<{
        name: string;
        description: string;
        priceText: string;
      }> = [];

      // Get the entire body text to parse prices correctly
      const bodyText = document.body.innerText;
      
      // Get all H3 elements which are menu item names
      const h3Elements = document.querySelectorAll('h3');
      
      h3Elements.forEach(h3 => {
        const name = h3.textContent?.trim() || '';
        
        // Skip if not a menu item
        if (!name || name.length < 3) return;
        
        let description = '';
        let priceText = '';
        
        // Find this item in the body text to get the full context
        const itemIndex = bodyText.indexOf(name);
        if (itemIndex !== -1) {
          // Get the next 400 characters after the item name
          const itemSection = bodyText.substring(itemIndex, itemIndex + 400);
          
          // Split into lines
          const lines = itemSection.split('\n');
          
          // Look through lines for description and price
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines
            if (!line) continue;
            
            // Check if it's a price (contains number followed by Kč)
            if (line.match(/\d+.*Kč/)) {
              priceText = line;
              break; // Price found, stop looking
            }
            
            // Skip allergen numbers (only numbers and commas)
            if (/^[\d,\s]+$/.test(line) && line.length < 20) {
              continue;
            }
            
            // Otherwise it's probably description (if it's long enough)
            if (!description && line.length > 10) {
              description = line;
            }
          }
        }
        
        // Only add if we found a price
        if (priceText) {
          itemsData.push({
            name,
            description,
            priceText
          });
        }
      });
      
      return itemsData;
    });

    // Process the extracted data using base class helper
    return menuData.map(item => 
      this.createMenuItem(item.name, item.priceText, item.description)
    );
  }
}