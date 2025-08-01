# 🍽️ Scrapetizer

![Next.js](https://img.shields.io/badge/Next.js-15.4-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

## ✨ Features

- 🔄 **Automated Scraping** - Daily menu scraping from multiple restaurants
- 🎨 **Modern UI** - Clean, responsive interface built with Tailwind CSS
- 📱 **Mobile Friendly** - Horizontal scroll with touch support
- 🚀 **Fast & Efficient** - Static generation with incremental updates
- 🔍 **Smart Parsing** - Intelligent text extraction and price detection
- 📊 **Structured Data** - Consistent menu format across all restaurants

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/scrapetizer.git
cd scrapetizer

# Install dependencies
npm install

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

### Scraping Menus

```bash
# Scrape all restaurants
npm run scrape

# Scrape a specific restaurant
npm run scrape:restaurant -- --restaurant hybernska

# Run scheduled scraping (for production)
npm run scrape:scheduler
```

## 🏗️ Architecture

### Project Structure

```
scrapetizer/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   └── hooks/            # Custom React hooks
├── lib/                   # Core business logic
│   ├── scrapers/         # Restaurant scrapers
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── scripts/              # CLI scripts
├── tests/                # Test files
└── public/               # Static assets
```

### Key Technologies

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4, Radix UI(shadcn/ui)
- **Scraping**: Playwright
- **Testing**: Jest, ts-jest
- **Deployment**: Vercel

## 🍴 Adding a New Restaurant

1. **Create a new scraper** in `lib/scrapers/`:

```typescript
// lib/scrapers/myrestaurant.ts
import { BaseScraper } from './base';
import { MenuItem } from '../types';

export class MyRestaurantScraper extends BaseScraper {
  protected getMenuUrl(): string {
    return 'https://myrestaurant.com/daily-menu';
  }

  protected async extractMenuItems(): Promise<MenuItem[]> {
    // Your scraping logic here
    const menuData = await this.page!.evaluate(() => {
      // Extract menu items from DOM
    });

    return menuData.map((item) => this.createMenuItem(item.name, item.price, item.description));
  }
}
```

2. **Register the restaurant** in `lib/config/restaurants.ts`:

```typescript
export const restaurants: Restaurant[] = [
  // ... existing restaurants
  {
    id: 'myrestaurant',
    name: 'My Restaurant',
    url: 'https://myrestaurant.com',
    scraperType: 'myrestaurant',
  },
];
```

3. **Export the scraper** in `lib/scrapers/index.ts`:

```typescript
export { MyRestaurantScraper } from './myrestaurant';
```

4. **Test your scraper**:

```bash
# Debug single scraper
npm run scrape:restaurant -- --restaurant myrestaurant
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

### Writing Tests

Tests are located in the `tests/` directory. Example:

```typescript
// tests/lib/scrapers/myrestaurant.test.ts
describe('MyRestaurantScraper', () => {
  it('should extract menu items correctly', async () => {
    // Your test logic
  });
});
```

## 🚀 Deployment

### Vercel (Recommended)

1. Fork this repository
2. Import to Vercel
3. Set environment variables:
   ```
   GITHUB_TOKEN=your_github_token  # For manual scraping trigger
   ```
4. Deploy!

### GitHub Actions

The repository includes GitHub Actions workflows for:

- Scheduled scraping (daily at 10:00 AM Prague time)
- Manual scraping trigger
- Automatic deployment to GitHub Pages

## 🛠️ Development

### Code Style

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint
```

### Environment Variables

Create a `.env.local` file:

```env
# GitHub token for manual scraping (optional)
GITHUB_TOKEN=your_github_token

# Development mode
NODE_ENV=development
```

### Debugging

- **Debug scrapers**: Use `scripts/debug-scraper.ts`
- **Browser mode**: Set `headless: false` in scraper
- **Logs**: Check console output with structured logging

## 📝 API Reference

### GET /api/menus

Fetch menus for a specific date.

```typescript
// Response
{
  date: string;
  menus: RestaurantMenu[];
  lastUpdated: string | null;
}
```

### POST /api/scrape

Trigger manual scraping (rate limited to once per 10 minutes). Maybe doesn't work.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
