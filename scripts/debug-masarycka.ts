#!/usr/bin/env tsx
import { chromium } from 'playwright';
import { getCurrentCzechDayUrl } from '../lib/utils/czech-days';

async function debugMasarycka() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Debugging Masarycka scraper...\n');
  
  const dayUrl = getCurrentCzechDayUrl();
  const url = `https://masaryckarestaurace.choiceqr.com/section:poledni-menu/${dayUrl}`;
  
  console.log(`Navigating to: ${url}`);
  console.log(`Today is: ${dayUrl}`);
  
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Check if we're actually on a day-specific section
  const currentUrl = page.url();
  console.log(`\nActual URL: ${currentUrl}`);
  
  // Get all visible text
  const bodyText = await page.evaluate(() => document.body.innerText);
  
  // Look for day markers
  const czechDays = ['pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek'];
  console.log('\nDays found on page:');
  czechDays.forEach(day => {
    if (bodyText.toLowerCase().includes(day)) {
      console.log(`  ✓ ${day}`);
    }
  });
  
  // Check if there's a specific section for today
  const visibleText = await page.evaluate(() => {
    // Check what's currently visible in viewport
    const elements = document.querySelectorAll('*');
    const visibleElements = [];
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top >= 0 && rect.top <= window.innerHeight) {
        const text = el.textContent?.trim();
        if (text && text.length > 5 && text.length < 200) {
          visibleElements.push(text);
        }
      }
    });
    
    return visibleElements.slice(0, 20);
  });
  
  console.log('\nVisible elements in viewport:');
  visibleText.forEach((text, i) => {
    console.log(`${i}: "${text}"`);
  });
  
  // Try to find menu sections
  const menuSections = await page.evaluate(() => {
    const sections = [];
    const possibleSelectors = [
      '[id*="pondeli"]', '[id*="utery"]', '[id*="streda"]', '[id*="ctvrtek"]', '[id*="patek"]',
      '[class*="pondeli"]', '[class*="utery"]', '[class*="streda"]', '[class*="ctvrtek"]', '[class*="patek"]',
      'section', 'article', '[class*="day"]', '[class*="menu"]'
    ];
    
    possibleSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        elements.forEach(el => {
          const text = el.textContent?.substring(0, 100);
          sections.push({
            selector,
            id: el.id,
            class: el.className,
            text
          });
        });
      }
    });
    
    return sections;
  });
  
  console.log('\nFound sections:');
  menuSections.forEach(section => {
    if (section.id || section.class) {
      console.log(`  ${section.selector}: id="${section.id}" class="${section.class}"`);
    }
  });
  
  console.log('\n⏰ Browser will close in 30 seconds...');
  await page.waitForTimeout(30000);
  
  await browser.close();
}

debugMasarycka().catch(console.error);