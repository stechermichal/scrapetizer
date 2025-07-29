import { BaseScraper } from './base';
import { MenuItem } from '../types';
import { getCurrentCzechDayUrl } from '../utils/czech-days';

export class MasaryckaScraper extends BaseScraper {
  protected getMenuUrl(): string {
    // Generate URL with current day name
    const dayUrl = getCurrentCzechDayUrl();
    const baseUrl = this.restaurant.menuUrl || this.restaurant.url;
    
    // Replace {day} placeholder or append day name
    if (this.restaurant.scrapeConfig.dayUrlPattern) {
      return this.restaurant.scrapeConfig.dayUrlPattern.replace('{day}', dayUrl);
    }
    
    return `${baseUrl}${dayUrl}`;
  }

  protected async extractMenuItems(): Promise<MenuItem[]> {
    const items: MenuItem[] = [];

    try {
      // Wait for dynamic content to load
      await this.page!.waitForTimeout(3000);
      
      // Get current day name for filtering
      const currentDayUrl = getCurrentCzechDayUrl();
      const czechDays = ['pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek'];
      const currentDayIndex = ['pondeli', 'utery', 'streda', 'ctvrtek', 'patek'].indexOf(currentDayUrl);
      const currentDayName = currentDayIndex >= 0 ? czechDays[currentDayIndex] : '';
      
      console.log(`🔍 Looking for ${currentDayName} menu items...`);
      
      // Get menu items from the page
      const menuData = await this.page!.evaluate((todayName) => {
        const itemsData: Array<{
          name: string;
          description: string;
          priceText: string;
        }> = [];

        // Find menu items with the specific class structure
        const menuItems = document.querySelectorAll('.styles_menuItem__rvgPH');
        
        // We need to determine which items belong to today
        // The page structure shows all days, so we need to find today's section
        let inTodaySection = false;
        let foundToday = false;
        
        // First, find all day headers
        const allElements = document.querySelectorAll('*');
        const dayHeaders: Element[] = [];
        
        allElements.forEach(el => {
          const text = el.textContent?.toLowerCase().trim() || '';
          if ((text === 'pondělí' || text === 'úterý' || text === 'středa' || 
               text === 'čtvrtek' || text === 'pátek') && 
              el.children.length === 0) {
            dayHeaders.push(el);
          }
        });
        
        // Find today's header
        let todayHeaderElement: Element | null = null;
        let nextDayHeaderElement: Element | null = null;
        
        for (let i = 0; i < dayHeaders.length; i++) {
          if (dayHeaders[i].textContent?.toLowerCase().trim() === todayName.toLowerCase()) {
            todayHeaderElement = dayHeaders[i];
            if (i < dayHeaders.length - 1) {
              nextDayHeaderElement = dayHeaders[i + 1];
            }
            break;
          }
        }
        
        if (!todayHeaderElement) {
          console.log('Could not find today\'s section header');
          return itemsData;
        }
        
        // Get all elements between today's header and the next day's header
        let currentElement = todayHeaderElement;
        const todayElements: Element[] = [];
        
        while (currentElement) {
          currentElement = currentElement.nextElementSibling;
          if (!currentElement || currentElement === nextDayHeaderElement) break;
          
          // Check if this element or its children contain menu items
          if (currentElement.classList.contains('styles_menuItem__rvgPH') ||
              currentElement.querySelector('.styles_menuItem__rvgPH')) {
            todayElements.push(currentElement);
          }
        }
        
        // Now extract menu items from today's section
        todayElements.forEach(element => {
          const menuItemElements = element.classList.contains('styles_menuItem__rvgPH') 
            ? [element] 
            : Array.from(element.querySelectorAll('.styles_menuItem__rvgPH'));
            
          menuItemElements.forEach(item => {
            const titleEl = item.querySelector('.styles_menu-item-title__Mnuv_');
            const priceEl = item.querySelector('.styles_menu-item-price__G8nZ_');
            
            if (titleEl && priceEl) {
              const name = titleEl.textContent?.trim() || '';
              const priceText = priceEl.textContent?.trim() || '';
              
              // Skip if no name or price
              if (!name || !priceText) return;
              
              itemsData.push({
                name,
                description: '',
                priceText
              });
            }
          });
        });
        
        // If we couldn't find items with the section approach, fall back to limiting items
        if (itemsData.length === 0 && menuItems.length > 0) {
          // Assume roughly 8-10 items per day, take only a reasonable amount
          const maxItemsPerDay = 10;
          const startIndex = currentDayIndex >= 0 ? currentDayIndex * maxItemsPerDay : 0;
          
          for (let i = startIndex; i < Math.min(startIndex + maxItemsPerDay, menuItems.length); i++) {
            const item = menuItems[i];
            const titleEl = item.querySelector('.styles_menu-item-title__Mnuv_');
            const priceEl = item.querySelector('.styles_menu-item-price__G8nZ_');
            
            if (titleEl && priceEl) {
              const name = titleEl.textContent?.trim() || '';
              const priceText = priceEl.textContent?.trim() || '';
              
              if (name && priceText) {
                itemsData.push({
                  name,
                  description: '',
                  priceText
                });
              }
            }
          }
        }
        
        return itemsData;
      }, currentDayName);

      // Process the extracted data and remove duplicates
      const uniqueItems = new Map<string, typeof menuData[0]>();
      
      for (const item of menuData) {
        // Use name + price as unique key to remove duplicates
        const key = `${item.name}-${item.priceText}`;
        if (!uniqueItems.has(key)) {
          uniqueItems.set(key, item);
        }
      }
      
      // Convert to menu items
      for (const item of uniqueItems.values()) {
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