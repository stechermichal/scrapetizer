import { BaseScraper } from './base';
import { MenuItem } from '../types';
import { getCurrentCzechDay } from '../utils/czech-days';

export class MeatbeerScraper extends BaseScraper {
  protected getMenuUrl(): string {
    return this.restaurant.menuUrl || 'https://www.meatbeer.cz/menu/';
  }

  async extractMenuItems(): Promise<MenuItem[]> {
    console.log('🥩 Scraping Meat Beer menu...');

    try {
      await this.page!.waitForTimeout(3000);

      const todayCzech = getCurrentCzechDay();

      const items = await this.page!.evaluate((todayCzech: string) => {
        const dayLabels = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
        const todayIdx = dayLabels.indexOf(todayCzech);
        if (todayIdx < 1 || todayIdx > 5) return []; // weekends: no lunch menu

        const text = document.body.innerText;
        const rawLines = text.split('\n');
        const lines: string[] = [];
        for (let k = 0; k < rawLines.length; k++) {
          const t = rawLines[k].trim();
          if (t) lines.push(t);
        }

        // Lunch block starts at the "OBĚD" header
        let start = -1;
        for (let k = 0; k < lines.length; k++) {
          if (lines[k] === 'OBĚD') {
            start = k;
            break;
          }
        }
        if (start === -1) return [];

        let currentDay = '';
        let pendingName = '';
        const collected: { name: string; price: number }[] = [];

        for (let i = start + 1; i < lines.length; i++) {
          const line = lines[i];

          // End markers — exit the lunch block
          if (
            line.startsWith('ZAREZERVUJTE') ||
            line.startsWith('USPOŘÁDEJTE') ||
            line.startsWith('Ať už hledáte') ||
            line === 'DOMŮ'
          ) {
            break;
          }

          const lower = line.toLocaleLowerCase('cs-CZ');
          if (dayLabels.indexOf(lower) !== -1) {
            currentDay = lower;
            pendingName = '';
            continue;
          }

          if (currentDay !== todayCzech) continue;

          // Day-level "no menu" markers (e.g. "Státní svátek", "Zavřeno")
          if (/státní svátek/i.test(line) || /^zavřeno/i.test(line)) break;

          const priceMatch = line.match(/^(\d+)\s*Kč$/);
          if (priceMatch && pendingName) {
            collected.push({ name: pendingName, price: parseInt(priceMatch[1], 10) });
            pendingName = '';
          } else if (!priceMatch) {
            pendingName = pendingName ? pendingName + ' ' + line : line;
          }
        }

        return collected;
      }, todayCzech);

      console.log(`✅ Found ${items.length} items at Meat Beer`);

      return items.map((item, idx) => ({
        name: this.normalizeText(item.name),
        price: item.price,
        // First item each day is the soup (cheapest, ~59 Kč in current format)
        description: idx === 0 ? this.normalizeText('Polévka') : undefined,
      }));
    } catch (error) {
      console.error('Error scraping Meat Beer:', error);
      return [];
    }
  }
}
