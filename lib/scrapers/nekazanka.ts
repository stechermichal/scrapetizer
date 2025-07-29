import { BaseScraper } from './base';
import { MenuItem } from '../types';

export class NekazankaScraper extends BaseScraper {
  protected getMenuUrl(): string {
    // The menu is embedded via iframe from prazskejrej.cz
    return 'https://www.prazskejrej.cz/menu-na-web/bistro-nekazanka-11';
  }

  protected async extractMenuItems(): Promise<MenuItem[]> {
    console.log('🍴 Scraping Bistro Nekázanka menu...');
    
    try {
      // Wait for content to load
      await this.page!.waitForTimeout(3000);
      
      const items = await this.page!.evaluate(() => {
        const menuItems: { name: string; price: number; description?: string }[] = [];
        
        // Get all text content
        const bodyText = document.body.innerText;
        const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        let inMainSection = false;
        let isProcessingSoup = false;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Check for soup section
          if (line === 'Polévka' || line.toLowerCase() === 'polévka') {
            isProcessingSoup = true;
            inMainSection = false;
            continue;
          }
          
          // Check for main dishes section
          if (line === 'Hlavní jídlo' || line.toLowerCase().includes('hlavní')) {
            isProcessingSoup = false;
            inMainSection = true;
            continue;
          }
          
          // Process soup
          if (isProcessingSoup && i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const priceMatch = nextLine.match(/(\d+)\s*Kč/);
            
            if (priceMatch) {
              const price = parseInt(priceMatch[1]);
              menuItems.push({
                name: line,
                price,
                description: 'Polévka'
              });
              
              isProcessingSoup = false;
              i++; // Skip price line
            }
          }
          
          // Process main dishes - they have numbers
          if (inMainSection && line.match(/^\d+$/)) {
            // Found a dish number, next line should be the dish name
            if (i + 2 < lines.length) {
              const dishName = lines[i + 1];
              const priceLine = lines[i + 2];
              const priceMatch = priceLine.match(/(\d+)\s*Kč/);
              
              if (priceMatch) {
                const price = parseInt(priceMatch[1]);
                menuItems.push({
                  name: dishName,
                  price
                });
                
                i += 2; // Skip name and price lines
              }
            }
          }
        }
        
        return menuItems;
      });
      
      console.log(`✅ Found ${items.length} items at Bistro Nekázanka`);
      
      // Normalize text
      return items.map(item => ({
        ...item,
        name: this.normalizeText(item.name),
        description: item.description ? this.normalizeText(item.description) : undefined
      }));
      
    } catch (error) {
      console.error('Error scraping Bistro Nekázanka:', error);
      return [];
    }
  }
}