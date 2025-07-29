#!/usr/bin/env tsx
import { format } from 'date-fns';
import { restaurants, getRestaurantById } from '../lib/config/restaurants';
import { scrapeRestaurant } from '../lib/scrapers';
import { saveMenuData, loadMenuData } from '../lib/utils/storage';
import { RestaurantMenu } from '../lib/types';

async function main() {
  const args = process.argv.slice(2);
  const restaurantIdArg = args.find(arg => arg.startsWith('--restaurant='));
  const restaurantId = restaurantIdArg?.split('=')[1];

  console.log('🍽️  Prague Lunch Menu Scraper');
  console.log('============================\n');

  const today = format(new Date(), 'yyyy-MM-dd');
  console.log(`📅 Date: ${today}`);
  console.log(`🕐 Time: ${format(new Date(), 'HH:mm:ss')}\n`);

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
    console.log(`🎯 Scraping all ${restaurants.length} restaurants\n`);
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
      // If scraping single restaurant, merge with existing data
      if (restaurantId) {
        const existingData = await loadMenuData(today);
        const otherRestaurants = existingData.filter(m => m.restaurantId !== restaurantId);
        const allMenus = [...otherRestaurants, ...results];
        await saveMenuData(today, allMenus);
      } else {
        await saveMenuData(today, results);
      }
      
      console.log(`\n💾 Saved ${results.length} restaurant menus to data/menus/${today}.json`);
    } catch (error) {
      console.error('\n❌ Failed to save menu data:', error);
    }
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log(`   ✅ Success: ${results.length} restaurants`);
  console.log(`   ❌ Failed: ${errors.length} restaurants`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(error => console.log(`   - ${error}`));
  }

  console.log('\n✨ Done!');
  process.exit(errors.length > 0 ? 1 : 0);
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});