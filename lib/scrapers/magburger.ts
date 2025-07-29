import { BaseScraper } from './base';
import { MenuItem } from '../types';

export class MagburgerScraper extends BaseScraper {
  protected getMenuUrl(): string {
    return this.restaurant.menuUrl || this.restaurant.url;
  }

  protected async extractMenuItems(): Promise<MenuItem[]> {
    const items: MenuItem[] = [];

    try {
      // First, try to navigate to the main page to find the lunch menu link
      if (!this.restaurant.menuUrl) {
        await this.page!.goto(this.restaurant.url, { waitUntil: 'networkidle' });
        
        // Look for lunch menu link
        const menuLink = await this.page!.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a'));
          const lunchLink = links.find(link => 
            link.textContent?.toLowerCase().includes('polední') || 
            link.textContent?.toLowerCase().includes('poledni') ||
            link.textContent?.toLowerCase().includes('lunch')
          );
          return lunchLink?.href;
        });
        
        if (menuLink) {
          await this.page!.goto(menuLink, { waitUntil: 'networkidle' });
        }
      }
      
      // Wait for content to load
      await this.page!.waitForTimeout(3000);
      
      // Try to extract menu items from the page
      const menuData = await this.page!.evaluate(() => {
        const itemsData: Array<{
          name: string;
          description: string;
          priceText: string;
        }> = [];

        const bodyText = document.body.innerText;
        
        // Look for today's menu section
        const days = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek'];
        const today = new Date();
        const dayIndex = today.getDay() - 1; // Monday is 0
        
        if (dayIndex >= 0 && dayIndex < 5) {
          const todayName = days[dayIndex];
          
          // Find today's section
          const dayPattern = new RegExp(`${todayName}`, 'i');
          const dayMatch = bodyText.match(dayPattern);
          
          if (dayMatch) {
            const startIndex = bodyText.indexOf(dayMatch[0]);
            const nextDayIndex = dayIndex < 4 ? bodyText.indexOf(days[dayIndex + 1], startIndex) : bodyText.length;
            const todaySection = bodyText.substring(startIndex, nextDayIndex !== -1 ? nextDayIndex : bodyText.length);
            
            // Parse menu items from today's section
            const lines = todaySection.split('\n').map(line => line.trim()).filter(line => line);
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              
              // Skip day name and empty lines
              if (!line || line === todayName) continue;
              
              // Look for menu items with prices
              if (line.length > 5) {
                let name = line;
                let description = '';
                let priceText = '';
                
                // Check next lines for price
                for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
                  const nextLine = lines[j];
                  
                  if (nextLine.match(/\d+.*Kč/) || nextLine.match(/\d+,-/)) {
                    priceText = nextLine;
                    // Lines between name and price might be description
                    if (j > i + 1) {
                      description = lines.slice(i + 1, j).join(' ');
                    }
                    break;
                  } else if (!description && nextLine.length > 10 && !nextLine.match(/^[A-Z\s]+$/)) {
                    description = nextLine;
                  }
                }
                
                // Alternative: price might be on the same line
                const sameLine = line.match(/(.+?)\s+(\d+.*Kč|\d+,-)/);
                if (sameLine && !priceText) {
                  name = sameLine[1].trim();
                  priceText = sameLine[2].trim();
                }
                
                if (name && priceText) {
                  // Clean up the name - remove allergen numbers and English translations
                  let cleanName = name;
                  
                  // Remove allergen numbers in parentheses at the end
                  cleanName = cleanName.replace(/\s*\([0-9,\s]+\)\s*$/, '');
                  
                  // If there's English translation after Czech, keep only Czech
                  const czechEnglishMatch = cleanName.match(/^(.+?)\s{2,}[A-Z]/);
                  if (czechEnglishMatch) {
                    cleanName = czechEnglishMatch[1].trim();
                  }
                  
                  itemsData.push({
                    name: cleanName,
                    description,
                    priceText
                  });
                  i += 2; // Skip processed lines
                }
              }
            }
          }
        }
        
        // If no day-specific menu found, try to extract any menu items
        if (itemsData.length === 0) {
          const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line);
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Look for lines that might be menu items
            if (line.length > 5 && !line.match(/^[a-z]/) && !line.includes('www') && !line.includes('@')) {
              // Check if there's a price nearby
              for (let j = i; j < Math.min(i + 5, lines.length); j++) {
                const checkLine = lines[j];
                if (checkLine.match(/\d+.*Kč/) || checkLine.match(/\d+,-/)) {
                  // Clean up the name
                  let cleanName = line;
                  cleanName = cleanName.replace(/\s*\([0-9,\s]+\)\s*$/, '');
                  
                  // Remove English translation if present
                  const czechEnglishMatch = cleanName.match(/^(.+?)\s{2,}[A-Z]/);
                  if (czechEnglishMatch) {
                    cleanName = czechEnglishMatch[1].trim();
                  }
                  
                  // Skip section headers
                  if (cleanName.toLowerCase().includes('polévka') || 
                      cleanName.toLowerCase().includes('hlavní') || 
                      cleanName.endsWith(':')) {
                    break;
                  }
                  
                  itemsData.push({
                    name: cleanName,
                    description: j > i + 1 ? lines[i + 1] : '',
                    priceText: checkLine
                  });
                  i = j; // Skip to after price
                  break;
                }
              }
            }
          }
        }
        
        return itemsData;
      });

      // If we couldn't extract menu items, provide a fallback message
      if (menuData.length === 0) {
        console.log(`⚠️  Could not extract menu items from ${this.restaurant.name}`);
        console.log('   The menu might be in a PDF or image format.');
        
        // Check if there's a PDF link
        const pdfLink = await this.page!.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a'));
          const pdfLink = links.find(link => 
            link.href?.endsWith('.pdf') || 
            link.textContent?.toLowerCase().includes('pdf')
          );
          return pdfLink?.href;
        });
        
        if (pdfLink) {
          console.log(`   PDF menu found at: ${pdfLink}`);
          // For now, we'll return empty items but could implement PDF parsing later
        }
      } else {
        // Process the extracted data
        for (const item of menuData) {
          // Skip NAKED menu items
          if (item.name.toUpperCase().includes('NAKED') || 
              item.priceText.toUpperCase().includes('NAKED')) {
            continue;
          }
          
          const menuItem: MenuItem = {
            name: item.name,
            price: this.parsePrice(item.priceText),
            description: item.description
          };
          
          items.push(menuItem);
        }
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