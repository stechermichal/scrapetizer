# 🍽️ Prague Lunch Menu Aggregator - Implementation Plan

## Project Overview

A simple web application that scrapes daily lunch menus from our favorite Prague restaurants and displays them in a single, unified interface. Built for personal use by a small group of friends to avoid checking 10+ restaurant websites every lunch time.

## Tech Stack

### Core Technologies
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Web Scraping**: Playwright
- **UI Library**: Chakra UI v2
- **Date Handling**: date-fns (with Czech locale support)
- **Development Server**: Next.js dev server

### Local Development Stack
- **Data Storage**: Local JSON files in `/data` directory
- **Scheduling**: node-cron (for automated scraping)
- **Scripts**: tsx for running TypeScript scripts

### Future Deployment (Bonus)
- **Platform**: Vercel
- **Data Storage**: Vercel KV (Redis)
- **Scheduling**: Vercel Cron Jobs

## Restaurant Scraping Patterns

### 1. Static HTML (Simple)
**Example**: Hybernska (https://www.restauracehybernska.cz/)
- Menu directly on homepage
- CSS selector extraction
- No JavaScript rendering needed

### 2. Static HTML (Complex)
**Example**: Tiskarna (https://www.restauracetiskarna.cz/obed)
- Structured daily menu sections
- Multiple menu items per day
- Prices and allergens included

### 3. Dynamic URL Pattern
**Example**: Masarycka (https://masaryckarestaurace.choiceqr.com/section:poledni-menu/[day])
- URL changes based on Czech day name
- Days: `pondeli`, `utery`, `streda`, `ctvrtek`, `patek`
- Need to generate correct URL for current day

### 4. PDF/Image Menus
**Example**: Magburger (https://www.magburgerhouse.cz/)
- Menu in PDF format
- May require OCR or PDF parsing
- Fallback: Direct link to PDF

## Data Models

```typescript
interface MenuItem {
  name: string;
  price: number;
  description?: string;
  allergens?: string[];
  category?: 'soup' | 'main' | 'dessert' | 'special';
}

interface RestaurantMenu {
  restaurantId: string;
  restaurantName: string;
  date: string; // ISO date format
  dayOfWeek: string; // Czech day name
  items: MenuItem[];
  sourceUrl: string;
  scrapedAt: string; // ISO timestamp
  isAvailable: boolean;
  errorMessage?: string;
}

interface Restaurant {
  id: string;
  name: string;
  url: string;
  menuUrl?: string; // If different from main URL
  scrapeConfig: {
    type: 'static' | 'dynamic' | 'pdf';
    selectors?: {
      menuContainer?: string;
      menuItem?: string;
      itemName?: string;
      itemPrice?: string;
      itemDescription?: string;
    };
    dayUrlPattern?: string; // For dynamic URLs
    pdfUrl?: string; // For PDF menus
  };
}
```

## Project Structure

```
lunch-menus/
├── app/
│   ├── api/
│   │   └── menus/
│   │       └── route.ts          # API endpoint to fetch menus
│   ├── components/
│   │   ├── MenuCard.tsx          # Individual restaurant card
│   │   ├── MenuList.tsx          # List of all menus
│   │   └── LoadingState.tsx      # Loading skeleton
│   ├── providers.tsx             # Chakra UI provider
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
│
├── lib/
│   ├── scrapers/
│   │   ├── base.ts               # Base scraper class
│   │   ├── hybernska.ts          # Hybernska scraper
│   │   ├── tiskarna.ts           # Tiskarna scraper
│   │   ├── masarycka.ts          # Masarycka scraper
│   │   ├── magburger.ts          # Magburger scraper
│   │   └── index.ts              # Scraper registry
│   ├── config/
│   │   └── restaurants.ts        # Restaurant configurations
│   ├── utils/
│   │   ├── czech-days.ts         # Day name helpers
│   │   └── storage.ts            # JSON file operations
│   └── types/
│       └── index.ts              # Shared TypeScript types
│
├── data/                         # Local data storage
│   └── menus/
│       └── 2024-07-30.json       # Daily menu data
│
├── scripts/
│   ├── scrape.ts                 # Manual scrape script
│   └── scrape-scheduler.ts       # Automated scraping with cron
│
├── public/                       # Static assets
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## Implementation Phases

### Phase 1: Local Foundation (Day 1-2)

#### Day 1 Tasks:
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Set up Chakra UI v2
- [ ] Create project structure
- [ ] Define TypeScript interfaces
- [ ] Set up restaurant configuration system
- [ ] Create local JSON storage utilities

#### Day 2 Tasks:
- [ ] Install and configure Playwright
- [ ] Build base scraper class with error handling
- [ ] Implement Hybernska scraper (simplest case)
- [ ] Create manual scrape script
- [ ] Test scraping and JSON storage
- [ ] Add Czech day name utilities

### Phase 2: All Scrapers (Day 3-4)

#### Day 3 Tasks:
- [ ] Implement Tiskarna scraper (complex HTML structure)
- [ ] Parse menu items with prices and allergens
- [ ] Implement Masarycka scraper (dynamic URLs)
- [ ] Handle day-based URL generation
- [ ] Test both scrapers thoroughly

#### Day 4 Tasks:
- [ ] Implement Magburger scraper (PDF handling)
- [ ] Add PDF parsing or link extraction
- [ ] Create scraper registry for easy management
- [ ] Add comprehensive error handling
- [ ] Test all scrapers together
- [ ] Handle edge cases (weekends, holidays)

### Phase 3: Simple Frontend (Day 5)

#### Tasks:
- [ ] Create API route to read local JSON menus
- [ ] Build MenuCard component with Chakra UI
- [ ] Create homepage layout
- [ ] Display all restaurant menus
- [ ] Add loading states
- [ ] Show "last updated" timestamp
- [ ] Handle missing/error states
- [ ] Make responsive for mobile
- [ ] Add external links to restaurant websites

### Phase 4: Local Automation (Day 6)

#### Tasks:
- [ ] Set up node-cron for scheduled scraping
- [ ] Create scraping scheduler script
- [ ] Schedule runs at 9am, 10am, 11am on weekdays
- [ ] Add logging for debugging
- [ ] Create npm scripts for easy operation
- [ ] Test automated scraping
- [ ] Add data retention (keep 7 days)
- [ ] Document local setup for friends

### Phase 5: Vercel Deployment (Bonus - Day 7+)

#### Tasks:
- [ ] Set up Vercel project
- [ ] Configure Vercel KV for data storage
- [ ] Migrate from JSON files to KV storage
- [ ] Convert node-cron to Vercel Cron
- [ ] Add environment variables
- [ ] Update API routes for KV
- [ ] Add authentication for manual scrape endpoint
- [ ] Deploy and test on Vercel
- [ ] Share URL with friends

## NPM Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "scrape": "tsx scripts/scrape.ts",
    "scrape:restaurant": "tsx scripts/scrape.ts --restaurant",
    "scrape:scheduler": "tsx scripts/scrape-scheduler.ts",
    "test:scrapers": "tsx scripts/test-scrapers.ts"
  }
}
```

## Environment Variables

### Local Development
```env
# .env.local
NODE_ENV=development
```

### Production (Vercel)
```env
# .env.production
VERCEL_KV_URL=xxx
VERCEL_KV_REST_API_URL=xxx
VERCEL_KV_REST_API_TOKEN=xxx
VERCEL_KV_REST_API_READ_ONLY_TOKEN=xxx
SCRAPE_SECRET=xxx  # For protecting manual scrape endpoint
```

## Key Design Decisions

1. **Local-First Development**: Start with JSON files, migrate to Vercel KV later
2. **Simple UI**: No filtering or favorites, just display all menus
3. **Modular Scrapers**: Each restaurant has its own scraper class
4. **Error Resilience**: Continue scraping other restaurants if one fails
5. **Czech Language Support**: Built-in from the start
6. **Mobile-First**: Responsive design for lunch-time phone checking

## Development Guidelines

### Adding a New Restaurant

1. Create new scraper in `lib/scrapers/[restaurant-name].ts`
2. Extend the base scraper class
3. Implement the `scrape()` method
4. Add restaurant config to `lib/config/restaurants.ts`
5. Register scraper in `lib/scrapers/index.ts`
6. Test with `npm run scrape:restaurant [restaurant-id]`

### Scraper Best Practices

- Always use try-catch blocks
- Log errors but don't throw (to continue scraping others)
- Test selectors in browser DevTools first
- Handle missing elements gracefully
- Return empty menu with error message on failure

### UI Components

- Use Chakra UI v2 components consistently
- Keep components simple and focused
- Use TypeScript for all props
- Handle loading and error states
- Make everything responsive by default

## Testing Strategy

### Manual Testing
- Test each scraper individually
- Verify data structure consistency
- Check UI on different screen sizes
- Test error states (network failures, missing menus)

### Automated Testing (Future)
- Unit tests for scrapers
- Integration tests for API routes
- Visual regression tests for UI

## Maintenance

### Daily Tasks
- Monitor scraping logs for failures
- Check that all restaurants are updating

### Weekly Tasks
- Verify scraper selectors still work
- Clean up old data files (keep 7 days)
- Check for new restaurant requests

### Monthly Tasks
- Update dependencies
- Review and optimize scrapers
- Add new restaurants as requested

## Success Metrics

- All restaurant menus load within 2 seconds
- 95%+ scraping success rate
- Zero manual checking needed
- Happy friends who save time every lunch

## Future Enhancements (Not in MVP)

- Restaurant filtering and search
- Favorite restaurants
- Menu item ratings
- Price tracking over time
- Dietary restriction filters
- Push notifications for daily specials
- Multi-language support
- Restaurant opening hours