import { BaseScraper } from './base';
import { MenuItem } from '../types';
import { formatInTimeZone } from 'date-fns-tz';
import { PRAGUE_TZ } from '../utils/date';

const API_BASE = 'https://api.saporevero.dev.waitergo.it/api';

export class SaporeveroScraper extends BaseScraper {
  protected getMenuUrl(): string {
    return 'https://www.saporevero.cz/';
  }

  /**
   * Sapore Vero serves its daily menu from a Strapi CMS, not from the page DOM.
   * There is a single "Menu del Giorno" record that the restaurant edits in
   * place each day. We read it directly from the API and, crucially, only
   * accept it once it has actually been (re)published TODAY.
   *
   * Why the freshness gate matters: the restaurant publishes the day's menu
   * late in the morning (~10:00 Prague). Our scraper starts at ~08:30 and the
   * incremental logic freezes the first result with a valid price and never
   * retries. Without a gate we'd lock in YESTERDAY's still-valid menu for the
   * whole day. Reporting "not posted yet" (price 0) keeps the scheduled job
   * retrying until the real menu lands.
   *
   * Note the record's own `date` field is unreliable (it lags several days
   * behind the actual menu), so freshness is judged by `updatedAt`/`publishedAt`,
   * which bump every time the menu is saved.
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
      const req = this.page!.request;

      // 1) List the daily-menu record(s); pick the most recently updated one.
      const listRes = await req.get(`${API_BASE}/daily-menus?locale=cs`, {
        headers: { Accept: 'application/json' },
      });
      if (!listRes.ok()) {
        console.log(`Sapore Vero daily-menus list returned ${listRes.status()}`);
        return notPosted();
      }
      const list = await listRes.json();
      const records: any[] = Array.isArray(list?.data) ? list.data : [];
      const stamp = (r: any) => new Date(r?.updatedAt || r?.publishedAt || 0).getTime();
      const record = records.slice().sort((a, b) => stamp(b) - stamp(a))[0];
      if (!record?.documentId) {
        console.log('Sapore Vero: no daily-menu record found');
        return notPosted();
      }

      // 2) Freshness gate — only accept a menu (re)published on today's Prague date.
      const today = formatInTimeZone(new Date(), PRAGUE_TZ, 'yyyy-MM-dd');
      const lastEdited = record.updatedAt || record.publishedAt;
      const editedPragueDate = lastEdited
        ? formatInTimeZone(new Date(lastEdited), PRAGUE_TZ, 'yyyy-MM-dd')
        : null;
      if (editedPragueDate !== today) {
        console.log(
          `📅 Sapore Vero menu is stale (last updated ${editedPragueDate ?? 'unknown'}, today ${today}) - not posted yet`
        );
        return notPosted();
      }

      // 3) Fetch the products for that record.
      const detailRes = await req.get(
        `${API_BASE}/daily-menus/${record.documentId}?locale=cs&populate[sections][populate]=products`,
        { headers: { Accept: 'application/json' } }
      );
      if (!detailRes.ok()) {
        console.log(`Sapore Vero daily-menu detail returned ${detailRes.status()}`);
        return notPosted();
      }
      const detail = await detailRes.json();
      const sections: any[] = detail?.data?.sections ?? [];

      const items: MenuItem[] = [];
      for (const section of sections) {
        for (const product of section?.products ?? []) {
          if (product?.displayed === false || product?.availability === false) continue;

          const price =
            typeof product?.price === 'number'
              ? product.price
              : this.parsePrice(String(product?.price ?? ''));
          if (!price || price <= 0) continue;

          // Description is "Czech name -\nEnglish name"; keep the Czech part.
          const raw = String(product?.description || product?.name || '');
          const name = raw.split('-')[0].trim() || String(product?.name || '').trim();
          if (!name) continue;

          items.push(this.createMenuItem(name, String(price)));
        }
      }

      if (items.length === 0) {
        console.log('Sapore Vero: daily menu record has no usable products');
        return notPosted();
      }

      console.log(`✅ Sapore Vero: extracted ${items.length} items from API`);
      return items;
    } catch (error) {
      console.error('Error fetching Sapore Vero daily menu:', error);
      return notPosted();
    }
  }
}
