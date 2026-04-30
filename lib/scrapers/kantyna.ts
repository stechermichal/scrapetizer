import { BaseScraper } from './base';
import { MenuItem } from '../types';

export class KantynaScraper extends BaseScraper {
  protected getMenuUrl(): string {
    return 'https://www.kantyna.ambi.cz/menu/denni-menu';
  }

  async extractMenuItems(): Promise<MenuItem[]> {
    console.log('🍴 Scraping Kantyna Ambi menu...');

    try {
      // The site uses CSS-module hashed class names that rotate on every
      // rebuild, so we parse rendered text instead of pinning a selector.
      // Wait until any "<number> Kč" appears in the DOM as a signal that
      // the menu has hydrated.
      await this.page!.waitForFunction(() => /\d+\s*Kč/.test(document.body.innerText), undefined, {
        timeout: 15000,
      });

      const result = await this.page!.evaluate(() => {
        const text = document.body.innerText;
        const all = text
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        // Bound the lunch block: starts after "Zobrazit alergeny" (or the
        // "Nabídka" intro), ends at the first footer/marketing line.
        let from = all.findIndex((l) => l === 'Zobrazit alergeny');
        if (from === -1) from = all.findIndex((l) => l.startsWith('Nabídka'));
        const startIdx = from === -1 ? 0 : from + 1;

        const endStarts = [
          'Nahlížíte',
          'Odebírat',
          'Souhlasím',
          'Politických',
          'Šéfřezník',
          'Šéfkuchař',
        ];
        let endIdx = all.length;
        for (let i = startIdx; i < all.length; i++) {
          const l = all[i];
          let matched = false;
          for (let m = 0; m < endStarts.length; m++) {
            if (l.startsWith(endStarts[m])) {
              matched = true;
              break;
            }
          }
          if (matched) {
            endIdx = i;
            break;
          }
        }

        const lines = all.slice(startIdx, endIdx);

        const items: { name: string; description?: string; price: number; section?: string }[] = [];
        let buffer: string[] = [];
        let section = '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Section header: short, no digits, all-uppercase in Czech locale.
          const upper = line.toLocaleUpperCase('cs-CZ');
          const lower = line.toLocaleLowerCase('cs-CZ');
          const isHeader =
            line.length <= 30 && !/\d/.test(line) && line === upper && upper !== lower;
          if (isHeader) {
            section = line;
            buffer = [];
            continue;
          }

          const priceMatch = line.match(/^(\d+)\s*Kč$/);
          if (priceMatch && buffer.length > 0) {
            const name = buffer[0];
            const description = buffer.length > 1 ? buffer.slice(1).join(' ') : undefined;
            items.push({
              name,
              description,
              price: parseInt(priceMatch[1], 10),
              section,
            });
            buffer = [];
          } else if (!priceMatch) {
            buffer.push(line);
          }
        }

        return items;
      });

      console.log(`✅ Found ${result.length} items at Kantyna Ambi`);

      if (result.length === 0) {
        return [
          {
            name: 'Menu not posted yet',
            price: 0,
            description: 'Check back later',
          },
        ];
      }

      return result.map((item) => ({
        name: this.normalizeText(item.name),
        price: item.price,
        description: item.description ? this.normalizeText(item.description) : undefined,
      }));
    } catch (error) {
      console.error('Error scraping Kantyna Ambi:', error);

      if (error instanceof Error && error.name === 'TimeoutError') {
        return [
          {
            name: 'Menu not posted yet',
            price: 0,
            description: 'Check back later',
          },
        ];
      }

      return [
        {
          name: 'Menu temporarily unavailable',
          price: 0,
          description: 'Could not process menu',
        },
      ];
    }
  }
}
