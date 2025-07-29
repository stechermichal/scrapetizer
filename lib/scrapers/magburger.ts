import { BaseScraper } from './base';
import { MenuItem } from '../types';
import { getCurrentCzechDay } from '../utils/czech-days';

export class MagburgerScraper extends BaseScraper {
  protected getMenuUrl(): string {
    return this.restaurant.menuUrl || 'https://www.magburgerhouse.cz/poledni-menu';
  }

  protected async extractMenuItems(): Promise<MenuItem[]> {
    console.log('🍔 Scraping Meet & Greet menu...');
    
    try {
      // Wait for content to load
      await this.page!.waitForTimeout(3000);
      
      const items = await this.page!.evaluate((todayName) => {
        const menuItems: { name: string; price: number; description?: string }[] = [];
        
        // Get all text content
        const bodyText = document.body.innerText;
        
        // More flexible pattern - just look for the day name followed by a date
        const dayPattern = new RegExp(`${todayName}\\s+\\d+\\.\\d+\\.`, 'i');
        const dayMatch = bodyText.match(dayPattern);
        
        if (!dayMatch) {
          console.log(`Could not find ${todayName} in menu`);
          console.log('Looking for:', todayName);
          console.log('Sample text:', bodyText.substring(0, 1000));
          return menuItems;
        }
        
        // Find the start of today's section
        const startIndex = bodyText.indexOf(dayMatch[0]);
        if (startIndex === -1) return menuItems;
        
        // Find the next day section or end
        const czechDays = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek'];
        let endIndex = bodyText.length;
        
        // Look for next day
        for (const day of czechDays) {
          if (day.toLowerCase() !== todayName.toLowerCase()) {
            const nextDayPattern = new RegExp(`${day}\\s+\\d+\\.\\d+\\.\\d+`, 'i');
            const nextMatch = bodyText.substring(startIndex + dayMatch[0].length).match(nextDayPattern);
            if (nextMatch) {
              const nextIndex = startIndex + dayMatch[0].length + bodyText.substring(startIndex + dayMatch[0].length).indexOf(nextMatch[0]);
              if (nextIndex < endIndex && nextIndex > startIndex) {
                endIndex = nextIndex;
              }
            }
          }
        }
        
        // Also check for "Back to Top" as end marker
        const backToTopIndex = bodyText.indexOf('Back to Top', startIndex);
        if (backToTopIndex > startIndex && backToTopIndex < endIndex) {
          endIndex = backToTopIndex;
        }
        
        // Extract today's section
        const todaySection = bodyText.substring(startIndex, endIndex);
        const lines = todaySection.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        let inSoupSection = false;
        let inMainSection = false;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Check for section headers
          if (line === 'Polévka:' || line.includes('Polévka:')) {
            inSoupSection = true;
            inMainSection = false;
            continue;
          }
          
          if (line === 'Hlavní jídla:' || line.includes('Hlavní jídla:')) {
            inSoupSection = false;
            inMainSection = true;
            continue;
          }
          
          // Skip if not in a section
          if (!inSoupSection && !inMainSection) continue;
          
          // Check if line ends with allergen numbers
          const allergenMatch = line.match(/\(\s*[\d,]+\s*\)$/);
          
          if (allergenMatch) {
            // Extract the Czech name - could be on this line or previous lines
            let czechName = line.replace(/\s*\(\s*[\d,]+\s*\)$/, '').trim();
            
            // If the name is empty or very short, it might be a multi-line name
            if (czechName.length < 10 && i > 0) {
              // Look back for the start of the menu item
              let fullName = czechName;
              for (let k = i - 1; k >= Math.max(0, i - 3); k--) {
                const prevLine = lines[k];
                // Stop if we hit a section header or price
                if (prevLine.includes('Polévka:') || prevLine.includes('Hlavní jídla:') || 
                    prevLine.match(/\d+,-/) || prevLine.match(/\(\s*[\d,]+\s*\)/)) {
                  break;
                }
                // Stop if line is in English (simple heuristic - contains common English words)
                if (prevLine.match(/\b(with|and|served|in|of)\b/i)) {
                  break;
                }
                fullName = prevLine + ' ' + fullName;
              }
              czechName = fullName.trim();
            }
            
            // Look for price in the next 4 lines (burger price can be further down)
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
              const priceLine = lines[j];
              const priceMatch = priceLine.match(/(\d+),-/);
              
              if (priceMatch) {
                const price = parseInt(priceMatch[1]);
                
                // Always add the item with the first price found (even if line contains NAKED)
                menuItems.push({
                  name: czechName,
                  price,
                  description: inSoupSection ? 'Polévka' : undefined
                });
                
                i = j; // Skip processed lines
                break;
              }
            }
          }
        }
        
        return menuItems;
      }, getCurrentCzechDay());
      
      console.log(`✅ Found ${items.length} items at Meet & Greet`);
      
      // Normalize text
      return items.map(item => ({
        ...item,
        name: this.normalizeText(item.name),
        description: item.description ? this.normalizeText(item.description) : undefined
      }));
      
    } catch (error) {
      console.error('Error scraping Meet & Greet:', error);
      return [];
    }
  }
}