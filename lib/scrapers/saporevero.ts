import { BaseScraper } from './base';
import { MenuItem } from '../types';
import pdf from 'pdf-parse';

export class SaporeveroScraper extends BaseScraper {
  protected getMenuUrl(): string {
    return this.restaurant.menuUrl || 'https://saporevero.choiceqr.com/delivery/section:denni-menu';
  }

  async extractMenuItems(): Promise<MenuItem[]> {
    console.log('Looking for PDF button on Sapore Vero...');
    
    try {
      // Wait for the PDF button/link to be available
      try {
        await this.page!.waitForSelector('a[href*="/api/public/menu/open"]', { timeout: 10000 });
      } catch {
        // No PDF link found - menu not posted yet
        console.log('📅 Sapore Vero menu not posted yet');
        return [{
          name: 'Menu not posted yet',
          price: 0,
          description: 'Check back later'
        }];
      }
      
      // Get the PDF URL from the link
      const pdfUrl = await this.page!.evaluate(() => {
        const pdfLink = document.querySelector('a[href*="/api/public/menu/open"]');
        return pdfLink ? (pdfLink as HTMLAnchorElement).href : null;
      });
      
      if (!pdfUrl) {
        console.log('📅 Sapore Vero menu not posted yet');
        return [{
          name: 'Menu not posted yet',
          price: 0,
          description: 'Check back later'
        }];
      }
      
      console.log(`📄 Found PDF URL: ${pdfUrl}`);
      
      // Download the PDF
      const response = await fetch(pdfUrl);
      const pdfBuffer = await response.arrayBuffer();
      
      // Parse the PDF
      const data = await pdf(Buffer.from(pdfBuffer));
      const text = data.text;
      
      console.log('📄 PDF content extracted, parsing menu items...');
      
      // Parse menu items from the PDF text
      const items: MenuItem[] = [];
      const lines = text.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0);
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Look for Italian names with prices (e.g., "MINESTRONE 59Kč")
        const priceMatch = line.match(/(\d+)\s*(?:Kč|CZK|,-)/);
        
        if (priceMatch && i + 1 < lines.length) {
          const price = parseInt(priceMatch[1]);
          
          // The Czech name is on the next line after the Italian name
          const czechName = lines[i + 1];
          
          // Skip if the next line looks like a category header or English translation
          if (!czechName.match(/^[A-Z\s\/]+$/) && // Not all caps (category)
              !czechName.match(/\d+\s*Kč/) && // Doesn't have a price
              czechName.length > 3 && // Not too short
              price > 0 && price < 500) { // Reasonable price range
            
            items.push({ 
              name: czechName.trim(),
              price 
            });
          }
        }
      }
      
      // Remove duplicates based on name
      const uniqueItems = items.filter((item, index, self) =>
        index === self.findIndex(i => i.name === item.name)
      );
      
      console.log(`✅ Found ${uniqueItems.length} menu items from PDF`);
      
      if (uniqueItems.length === 0) {
        console.log('PDF text sample:', text.substring(0, 500));
      }
      
      // Normalize text before returning
      return uniqueItems.map(item => ({
        ...item,
        name: this.normalizeText(item.name)
      }));
      
    } catch (error) {
      console.error('Error processing Sapore Vero PDF:', error);
      
      // If it's a timeout error that wasn't caught above, it's likely menu not posted
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