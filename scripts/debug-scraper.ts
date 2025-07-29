#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function debug() {
  const browser = await chromium.launch({ headless: false }); // Show browser
  const page = await browser.newPage();
  
  console.log('🔍 Debugging Hybernska scraper...\n');
  
  await page.goto('https://www.restauracehybernska.cz/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Debug: Get page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Debug: Check for H3 elements
  const h3Count = await page.evaluate(() => document.querySelectorAll('h3').length);
  console.log('Number of H3 elements:', h3Count);
  
  // Debug: Get all H3 text content
  const h3Texts = await page.evaluate(() => {
    const h3s = document.querySelectorAll('h3');
    return Array.from(h3s).map(h3 => h3.textContent?.trim() || '');
  });
  console.log('\nH3 elements found:', h3Texts);
  
  // Debug: Look for menu content differently
  const bodyText = await page.evaluate(() => document.body.innerText);
  const hasMenu = bodyText.includes('POLEDNÍ MENU');
  console.log('\nContains "POLEDNÍ MENU":', hasMenu);
  
  if (hasMenu) {
    const menuIndex = bodyText.indexOf('POLEDNÍ MENU');
    const menuSection = bodyText.substring(menuIndex, menuIndex + 1000);
    console.log('\nMenu section preview:');
    console.log(menuSection);
  }
  
  // Debug: Try different selectors
  const possibleSelectors = [
    '.menu-item',
    '.food-item',
    '[class*="menu"]',
    '[class*="item"]',
    'article',
    '.content h3',
    'main h3'
  ];
  
  console.log('\nTrying different selectors:');
  for (const selector of possibleSelectors) {
    const count = await page.evaluate((sel) => document.querySelectorAll(sel).length, selector);
    if (count > 0) {
      console.log(`  ${selector}: ${count} elements found`);
    }
  }
  
  // Keep browser open for 30 seconds to inspect
  console.log('\n⏰ Browser will close in 30 seconds...');
  await page.waitForTimeout(30000);
  
  await browser.close();
}

debug().catch(console.error);