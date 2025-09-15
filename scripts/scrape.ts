#!/usr/bin/env tsx
import { format } from 'date-fns';
import { restaurants, getRestaurantById } from '../lib/config/restaurants';
import { scrapeRestaurant } from '../lib/scrapers';
import { saveMenuData, loadMenuData } from '../lib/utils/storage';
import { RestaurantMenu } from '../lib/types';

async function main() {
  const args = process.argv.slice(2);
  // Support both `--restaurant=id` and `--restaurant id` forms
  const eqArg = args.find(arg => arg.startsWith('--restaurant='));
  const flagIndex = args.findIndex(arg => arg === '--restaurant');
  const flagValue = flagIndex !== -1 && args[flagIndex + 1] && !args[flagIndex + 1].startsWith('-')
    ? args[flagIndex + 1]
    : undefined;
  const restaurantId = (eqArg?.split('=')[1] || flagValue)?.trim();

  console.log('🍽️  Prague Lunch Menu Scraper');
  console.log('============================\n');

  const today = format(new Date(), 'yyyy-MM-dd');
  console.log(`📅 Date: ${today}`);
  console.log(`🕐 Time: ${format(new Date(), 'HH:mm:ss')}\n`);

  // Load existing data for today (to support incremental scraping)
  const existingData = await loadMenuData(today);
  const existingById = new Map<string, RestaurantMenu>(existingData.map(m => [m.restaurantId, m]));

  // Determine which restaurants to scrape
  let restaurantsToScrape = restaurants;
  if (restaurantId) {
    const restaurant = getRestaurantById(restaurantId);
    if (!restaurant) {
      console.error(`❌ Restaurant with ID "${restaurantId}" not found`);
      console.log('Available restaurants:', restaurants.map(r => r.id).join(', '));
      process.exit(1);
    }
    restaurantsToScrape = [restaurant];
    console.log(`🎯 Scraping only: ${restaurant.name}\n`);
  } else {
    // Smart default: only scrape restaurants that don't have a valid menu today
    const toScrape = restaurants.filter(r => {
      const existing = existingById.get(r.id);
      // scrape if no data, or not available, or no items
      if (!existing) return true;
      if (!existing.isAvailable) return true;
      if (!existing.items || existing.items.length === 0) return true;
      return false;
    });
    const skipped = restaurants.length - toScrape.length;
    restaurantsToScrape = toScrape;
    console.log(`🎯 Incremental scrape: ${toScrape.length} to scrape, ${skipped} up-to-date\n`);
  }

  const results: RestaurantMenu[] = [];
  const errors: string[] = [];

  // Scrape each restaurant
  for (const restaurant of restaurantsToScrape) {
    console.log(`\n🔍 Scraping ${restaurant.name}...`);
    
    try {
      const result = await scrapeRestaurant(restaurant);
      
      if (result.success && result.menu) {
        results.push(result.menu);
        console.log(`✅ Success! Found ${result.menu.items.length} items`);
        
        // Display first few items as preview
        if (result.menu.items.length > 0) {
          console.log('   Preview:');
          result.menu.items.slice(0, 3).forEach(item => {
            console.log(`   - ${item.name} (${item.price} Kč)`);
          });
          if (result.menu.items.length > 3) {
            console.log(`   ... and ${result.menu.items.length - 3} more items`);
          }
        }
      } else {
        errors.push(`${restaurant.name}: ${result.error}`);
        console.error(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${restaurant.name}: ${errorMsg}`);
      console.error(`❌ Error: ${errorMsg}`);
    }
  }

  // Save results
  if (results.length > 0) {
    try {
      // Always merge with today's existing data to preserve prior successes
      const existing = await loadMenuData(today);
      const updatesById = new Map<string, RestaurantMenu>(results.map(m => [m.restaurantId, m]));
      const merged: RestaurantMenu[] = [];
      const seen = new Set<string>();

      // Keep current items, overwrite with new ones when present
      for (const item of existing) {
        const updated = updatesById.get(item.restaurantId);
        if (updated) {
          merged.push(updated);
          seen.add(item.restaurantId);
        } else {
          merged.push(item);
        }
      }

      // Add any new restaurants that weren't in existing
      for (const r of results) {
        if (!seen.has(r.restaurantId)) {
          merged.push(r);
        }
      }

      await saveMenuData(today, merged);
      
      console.log(`\n💾 Saved ${results.length} updated menus (merged) to data/menus/${today}.json`);
    } catch (error) {
      console.error('\n❌ Failed to save menu data:', error);
    }
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log(`   ✅ Success: ${results.length} restaurants`);
  console.log(`   ❌ Failed: ${errors.length} restaurants`);
  if (!restaurantId) {
    const skippedCount = restaurants.length - restaurantsToScrape.length;
    console.log(`   ⏭️  Skipped (already up-to-date): ${skippedCount}`);
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(error => console.log(`   - ${error}`));
  }

  console.log('\n✨ Done!');
  // Do not fail the whole job if at least one restaurant succeeded
  // Exit with failure only if all scrapes failed
  process.exit(results.length === 0 ? 1 : 0);
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
