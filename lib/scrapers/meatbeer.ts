import { BaseScraper } from './base';
import { MenuItem } from '../types';

export class MeatbeerScraper extends BaseScraper {
  protected getMenuUrl(): string {
    return this.restaurant.menuUrl || 'https://www.meatbeer.cz/menu/';
  }

  async extractMenuItems(): Promise<MenuItem[]> {
    console.log('🥩 Scraping Meat Beer menu...');
    
    try {
      // Wait for page content to load
      await this.page!.waitForTimeout(3000);
      
      const items = await this.page!.evaluate(() => {
        const menuItems: { name: string; price: number; description?: string }[] = [];
        
        // Get all text content from the page
        const pageText = document.body.innerText;
        
        let inSoupSection = false;
        let inMainSection = false;
        
        // Split the page into lines
        const lines = pageText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Check if we've hit the grill section (where lunch menu ends)
          if (line.includes('Z MEAT BEER GRILU NA DŘEVĚNÉM UHLÍ')) {
            break;
          }
          
          // Check for section headers
          if (line === 'POLÉVKY' || line.includes('POLÉVKY')) {
            inSoupSection = true;
            inMainSection = false;
            continue;
          }
          
          if (line === 'HLAVNÍ JÍDLA' || line.includes('HLAVNÍ JÍDLA')) {
            inSoupSection = false;
            inMainSection = true;
            continue;
          }
          
          // Parse items if we're in soup or main course sections
          if (inSoupSection || inMainSection) {
            // Look for price pattern
            const priceMatch = line.match(/(\d+)\s*Kč/);
            
            if (priceMatch) {
              const price = parseInt(priceMatch[1]);
              
              // Get the item name from previous line(s)
              let name = '';
              let j = i - 1;
              
              // Go back to find the name (might be multi-line)
              while (j >= 0) {
                const prevLine = lines[j];
                
                // Stop if we hit another price or a section header
                if (prevLine.match(/\d+\s*Kč/) || 
                    prevLine.includes('POLÉVKY') || 
                    prevLine.includes('HLAVNÍ JÍDLA')) {
                  break;
                }
                
                // Prepend this line to the name
                name = prevLine + (name ? ' ' + name : '');
                j--;
              }
              
              // Clean up the name
              name = name
                .replace(/^(BEZMASOVKA|RYCHLOVKA|TUTOVKA|STREETOVKA|MEATOVKA|SRDCOVKA):\s*/i, '')
                .trim();
              
              if (name && price > 0 && price < 500) {
                menuItems.push({
                  name,
                  price,
                  description: inSoupSection ? 'Polévka' : undefined
                });
              }
            }
          }
        }
        
        return menuItems;
      });
      
      console.log(`✅ Found ${items.length} items at Meat Beer`);
      
      // Normalize text
      return items.map(item => ({
        ...item,
        name: this.normalizeText(item.name),
        description: item.description ? this.normalizeText(item.description) : undefined
      }));
      
    } catch (error) {
      console.error('Error scraping Meat Beer:', error);
      return [];
    }
  }
}