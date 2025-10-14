# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scrapetizer is a Next.js 15 application that scrapes daily lunch menus from Prague restaurants using Playwright and displays them in a unified interface. Menu data is stored as static JSON files in `public/data/menus/` and scraped automatically via GitHub Actions.

## Core Commands

### Development
```bash
npm run dev              # Start dev server on localhost:3000
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Lint code
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
```

### Scraping
```bash
npm run scrape                                      # Scrape all restaurants (incremental - only missing/invalid)
npm run scrape:restaurant -- --restaurant <id>      # Scrape specific restaurant (e.g., hybernska)
npm run scrape:scheduler                           # Run scheduled scraper with node-cron
npm run test:scrapers                              # Test all scrapers
```

### Debugging Scrapers
```bash
tsx scripts/debug-scraper.ts              # Debug scraper with browser visible
tsx scripts/scrape.ts --restaurant <id>   # Debug specific scraper CLI-style
```

## Architecture

### Scraper System (`lib/scrapers/`)

- **Base Class**: `base.ts` - All scrapers extend `BaseScraper`
  - Handles Playwright browser initialization (chromium)
  - Provides retry logic for navigation (`gotoWithRetries`)
  - Common utilities: `parsePrice`, `cleanText`, `normalizeText`, `createMenuItem`
  - Error handling: scrapers return `ScraperResult` with success/failure

- **Scraper Registry**: `index.ts` exports `scrapeRestaurant(restaurant)` function that maps restaurant IDs to scraper classes

- **Individual Scrapers**: Each restaurant has its own scraper class (e.g., `hybernska.ts`, `tiskarna.ts`, `magburger.ts`)
  - Must implement: `getMenuUrl()` and `extractMenuItems()`
  - Return array of `MenuItem` objects with name, price, and optional description

### Restaurant Configuration (`lib/config/restaurants.ts`)

Central registry defining all restaurants with:
- `id`: unique identifier used in scraper mapping
- `name`: display name
- `url`: main website URL
- `menuUrl`: direct menu URL (if different)
- `scrapeConfig`: metadata about scraping approach (type: 'static' | 'dynamic' | 'pdf')

### Data Storage (`lib/utils/storage.ts`)

- **Location**: `public/data/menus/{date}.json` (format: YYYY-MM-DD)
- Functions: `saveMenuData`, `loadMenuData`, `cleanOldData`
- Incremental scraping: script merges new data with existing data for the day
- Data structure: Array of `RestaurantMenu` objects

### Frontend (`app/`)

- Next.js 15 App Router
- API route: `app/api/menus/route.ts` - fetches menu data for date
- Components: `app/components/` - React components with Tailwind CSS
- Hooks: `app/hooks/` - Custom React hooks (e.g., `useMenus`, `useHorizontalScroll`)

## Adding a New Restaurant

1. **Create scraper** in `lib/scrapers/newrestaurant.ts`:
```typescript
import { BaseScraper } from './base';
import { MenuItem } from '../types';

export class NewRestaurantScraper extends BaseScraper {
  protected getMenuUrl(): string {
    return this.restaurant.menuUrl || this.restaurant.url;
  }

  protected async extractMenuItems(): Promise<MenuItem[]> {
    // Your scraping logic using this.page
    const items = await this.page!.$$eval('selector', nodes =>
      nodes.map(node => ({
        name: node.querySelector('.name')?.textContent || '',
        price: node.querySelector('.price')?.textContent || ''
      }))
    );

    return items.map(item => this.createMenuItem(item.name, item.price));
  }
}
```

2. **Add to restaurant config** in `lib/config/restaurants.ts`:
```typescript
{
  id: 'newrestaurant',
  name: 'New Restaurant',
  url: 'https://example.com',
  menuUrl: 'https://example.com/menu',
  scrapeConfig: { type: 'static' }
}
```

3. **Register scraper** in `lib/scrapers/index.ts`:
   - Import the class
   - Add to `scraperMap` object with restaurant id as key

4. **Test**: `npm run scrape:restaurant -- --restaurant newrestaurant`

## GitHub Actions Automation

- **Workflow**: `.github/workflows/scrape-menus.yml`
- **Schedule**: Runs at 10:00 AM Prague time on weekdays (Mon-Fri)
  - Additional run at 11:00 AM if menus are incomplete
  - Uses UTC cron with runtime timezone conversion
- **Incremental**: Checks completeness before running (compares restaurant config vs. data file)
- **Auto-commit**: Commits menu data changes with message "🍽️ Update restaurant menus [skip ci]"
- **Manual trigger**: Can be triggered via workflow_dispatch

## Key Implementation Details

### Scraper Best Practices
- Always wrap extraction in try-catch within `extractMenuItems()`
- Return empty array on failure (let `BaseScraper` handle error reporting)
- Use `this.createMenuItem()` for consistent formatting
- Test selectors in browser DevTools before implementation
- For PDF menus, use `pdf-parse` library (see `magburger.ts`)

### Incremental Scraping Logic (`scripts/scrape.ts`)
- Loads existing menu data for today
- Only scrapes restaurants that don't have valid items (price > 0)
- Merges new results with existing data (preserves prior successes)
- Avoids unnecessary commits when only placeholder data changes

### Czech Locale Support
- Uses `lib/utils/czech-days.ts` for day name handling
- Sets `Accept-Language: cs-CZ` header in Playwright
- Uses `date-fns` for date formatting

### Data Validation
- Menu items must have `price > 0` to be considered "real"
- `RestaurantMenu.isAvailable` flag indicates if valid items exist
- Placeholder/error menus stored but marked as unavailable

## Testing
- Unit tests in `tests/` directory using Jest
- Test individual scrapers: `npm run scrape:restaurant -- --restaurant <id>`
- Debug mode: set `headless: false` in `base.ts` or use debug scripts
