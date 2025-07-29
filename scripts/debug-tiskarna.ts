#!/usr/bin/env tsx
import { chromium } from 'playwright';

async function debugTiskarna() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Debugging Tiskarna scraper...\n');
  
  await page.goto('https://www.restauracetiskarna.cz/obed', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Get page content
  const bodyText = await page.evaluate(() => document.body.innerText);
  
  // Look for today's day
  const today = new Date();
  const dayNames = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
  const todayName = dayNames[today.getDay()];
  
  console.log(`Looking for: ${todayName}`);
  
  // Find today's section
  const dayPattern = new RegExp(`${todayName}\\s+\\d+\\.\\s*\\d+\\.`, 'i');
  const dayMatch = bodyText.match(dayPattern);
  
  if (dayMatch) {
    console.log(`✅ Found today's section: "${dayMatch[0]}"`);
    
    // Extract today's menu section
    const startIndex = bodyText.indexOf(dayMatch[0]);
    const section = bodyText.substring(startIndex, startIndex + 1500);
    
    console.log('\nToday\'s menu section:');
    console.log('====================');
    console.log(section.substring(0, 800));
    console.log('...\n');
    
    // Look for price patterns
    const prices = section.match(/\d+\s*Kč/g);
    console.log('Prices found:', prices || 'None');
    
    // Look for menu item patterns
    const lines = section.split('\n').slice(0, 20);
    console.log('\nFirst 20 lines:');
    lines.forEach((line, i) => {
      console.log(`${i}: "${line.trim()}"`);
    });
  } else {
    console.log('❌ Could not find today\'s section');
    console.log('\nSearching for any day patterns...');
    
    const allDays = bodyText.match(/(pondělí|úterý|středa|čtvrtek|pátek)\s+\d+\.\s*\d+\./gi);
    console.log('Days found:', allDays || 'None');
    
    // Show a sample of the page content
    console.log('\nFirst 1000 characters of page:');
    console.log(bodyText.substring(0, 1000));
  }
  
  console.log('\n⏰ Browser will close in 30 seconds...');
  await page.waitForTimeout(30000);
  
  await browser.close();
}

debugTiskarna().catch(console.error);