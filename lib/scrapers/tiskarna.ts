import { BaseScraper } from './base';
import { MenuItem } from '../types';
import { getCurrentCzechDayUrl } from '../utils/czech-days';

export class TiskarnaScraper extends BaseScraper {
  protected getMenuUrl(): string {
    return this.restaurant.menuUrl || this.restaurant.url;
  }

  protected async extractMenuItems(): Promise<MenuItem[]> {
    const items: MenuItem[] = [];

    try {
      // Get today's menu from the page
      const menuData = await this.page!.evaluate(() => {
        const itemsData: Array<{
          name: string;
          description: string;
          priceText: string;
        }> = [];

        // Get the body text to find today's section
        const bodyText = document.body.innerText;
        
        // Get today's day name from the date displayed on page
        const today = new Date();
        const dayNames = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
        const todayName = dayNames[today.getDay()];
        
        // Find today's section - look for day name pattern
        const dayPattern = new RegExp(`${todayName}\\s+\\d+\\.\\s*\\d+\\.`, 'i');
        const dayMatch = bodyText.match(dayPattern);
        
        if (!dayMatch) {
          console.log('Could not find today\'s menu section');
          return itemsData;
        }
        
        // Get the section starting from today's date
        const startIndex = bodyText.indexOf(dayMatch[0]);
        if (startIndex === -1) return itemsData;
        
        // Find next day section or end of menu
        const nextDayPattern = /(pondělí|úterý|středa|čtvrtek|pátek)\s+\d+\.\s*\d+\./gi;
        const remainingText = bodyText.substring(startIndex + dayMatch[0].length);
        const nextDayMatch = remainingText.match(nextDayPattern);
        
        const endIndex = nextDayMatch 
          ? startIndex + dayMatch[0].length + remainingText.indexOf(nextDayMatch[0])
          : bodyText.length;
        
        const todaySection = bodyText.substring(startIndex, endIndex);
        
        // Split into lines and parse
        const lines = todaySection.split('\n').map(line => line.trim()).filter(line => line);
        
        let i = 0;
        while (i < lines.length) {
          const line = lines[i];
          
          // Skip day pattern and empty lines only
          if (!line || line.match(dayPattern)) {
            i++;
            continue;
          }
          
          // Check if this line looks like a menu item or special item
          const isMenuItem = line.match(/^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ\s]+$/) || 
                           line.match(/^\d+\.\s*/) || 
                           line.toLowerCase().includes('náš tip:');
          
          if (isMenuItem) {
            let name = line.replace(/^\d+\.\s*/, '');
            
            // Handle "Náš tip:" prefix
            if (name.toLowerCase().includes('náš tip:')) {
              name = name.replace(/náš tip:\s*/i, '').trim();
            }
            
            let description = '';
            let priceText = '';
            
            // Look at next lines for description and price
            let j = i + 1;
            while (j < lines.length) {
              const nextLine = lines[j];
              
              // Stop if we hit another menu item
              if (nextLine.match(/^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ\s]+$/) && 
                  !nextLine.match(/^[\d,\s]+$/) && 
                  nextLine.length > 20) {
                break;
              }
              
              if (nextLine.match(/^\d+\.\s*/)) {
                break;
              }
              
              // Check if it's a price
              if (nextLine.match(/\d+\s*Kč/)) {
                priceText = nextLine;
                j++;
                break;
              }
              
              // Skip allergen numbers (short line with numbers/commas)
              if (nextLine.match(/^[\d,\s]+$/) && nextLine.length < 20) {
                j++;
                continue;
              }
              
              // Otherwise it's probably description
              if (!description && nextLine.length > 5) {
                description = nextLine;
              }
              
              j++;
            }
            
            // For items without price found in next lines, check further
            if (!priceText) {
              // Look up to 5 lines ahead for price
              for (let k = j; k < Math.min(j + 5, lines.length); k++) {
                if (lines[k].match(/\d+\s*Kč/)) {
                  priceText = lines[k];
                  break;
                }
              }
            }
            
            if (name) {
              itemsData.push({
                name,
                description,
                priceText
              });
            }
            
            i = j - 1; // Continue from where we left off
          }
          
          i++;
        }
        
        return itemsData;
      });

      // Process the extracted data
      for (const item of menuData) {
        const menuItem: MenuItem = {
          name: item.name,
          price: this.parsePrice(item.priceText),
          description: item.description
        };
        
        items.push(menuItem);
      }

      console.log(`✅ Found ${items.length} menu items from ${this.restaurant.name}`);
      
      // Debug: Show what we found
      items.slice(0, 3).forEach(item => {
        console.log(`   - ${item.name}: ${item.price} Kč`);
      });
      
    } catch (error) {
      console.error(`❌ Error extracting menu items from ${this.restaurant.name}:`, error);
    }

    return items;
  }
}