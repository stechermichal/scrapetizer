import { BaseScraper } from './base';
import { MenuItem } from '../types';
import { getPragueDateString } from '../utils/date';
import { loadMenuData } from '../utils/storage';

const MENUS_API = 'https://www.saporevero.cz/api/menus?lang=cs';
const LOOKBACK_DAYS = 10;

export class SaporeveroScraper extends BaseScraper {
  protected getMenuUrl(): string {
    return 'https://www.saporevero.cz/';
  }

  /**
   * The site's own /api/menus returns a single "Menu del Giorno" record that the
   * restaurant edits in place, usually around 10:00 Prague. It carries no edit
   * timestamp and its `date` field lags days behind, so a menu identical to the
   * last one we stored is treated as yesterday's and reported as "not posted
   * yet" (price 0), which keeps the scheduled job retrying.
   */
  protected async extractMenuItems(): Promise<MenuItem[]> {
    const notPosted = (): MenuItem[] => [
      {
        name: 'Menu not posted yet',
        price: 0,
        description: 'Check back later',
      },
    ];

    try {
      const res = await this.page!.request.get(MENUS_API, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok()) {
        console.log(`Sapore Vero /api/menus returned ${res.status()}`);
        return notPosted();
      }
      const body = await res.json();
      if (body?.settings?.is_daily_menu_displayed === false || !body?.dailyMenu) {
        console.log('Sapore Vero: no daily menu displayed');
        return notPosted();
      }

      const items: MenuItem[] = [];
      for (const section of body.dailyMenu.sections ?? []) {
        for (const product of section?.products ?? []) {
          if (product?.displayed === false || product?.availability === false) continue;

          const price =
            typeof product?.price === 'number'
              ? product.price
              : this.parsePrice(String(product?.price ?? ''));
          if (!price || price <= 0) continue;

          // description is "Czech name -\nEnglish name"; keep the Czech part
          const raw = String(product?.description || product?.name || '');
          const name = raw.split('-')[0].trim() || String(product?.name || '').trim();
          if (!name) continue;

          items.push(this.createMenuItem(name, String(price)));
        }
      }

      if (items.length === 0) {
        console.log('Sapore Vero: daily menu has no usable products');
        return notPosted();
      }

      const previous = await this.lastStoredMenu();
      if (previous && sameMenu(previous, items)) {
        console.log('📅 Sapore Vero menu matches the last stored day - not posted yet');
        return notPosted();
      }

      console.log(`✅ Sapore Vero: extracted ${items.length} items from API`);
      return items;
    } catch (error) {
      console.error('Error fetching Sapore Vero daily menu:', error);
      return notPosted();
    }
  }

  private async lastStoredMenu(): Promise<MenuItem[] | null> {
    const today = new Date(`${getPragueDateString()}T12:00:00Z`).getTime();
    for (let n = 1; n <= LOOKBACK_DAYS; n++) {
      const date = new Date(today - n * 86_400_000).toISOString().slice(0, 10);
      const menus = await loadMenuData(date);
      const entry = menus.find(m => m.restaurantId === this.restaurant.id);
      const priced = entry?.items.filter(i => i.price > 0) ?? [];
      if (priced.length > 0) return priced;
    }
    return null;
  }
}

function sameMenu(a: MenuItem[], b: MenuItem[]): boolean {
  const key = (items: MenuItem[]) => items.map(i => `${i.name}|${i.price}`).sort().join('\n');
  return key(a) === key(b);
}
