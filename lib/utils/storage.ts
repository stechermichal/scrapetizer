import fs from 'fs/promises';
import path from 'path';
import { RestaurantMenu } from '../types';

const DATA_DIR = path.join(process.cwd(), 'public', 'data', 'menus');

export async function saveMenuData(date: string, menus: RestaurantMenu[]): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const filePath = path.join(DATA_DIR, `${date}.json`);
    await fs.writeFile(filePath, JSON.stringify(menus, null, 2));
    console.log(`✅ Saved menu data for ${date}`);
  } catch (error) {
    console.error('❌ Error saving menu data:', error);
    throw error;
  }
}

export async function loadMenuData(date: string): Promise<RestaurantMenu[]> {
  try {
    const filePath = path.join(DATA_DIR, `${date}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      console.log(`📝 No menu data found for ${date}`);
      return [];
    }
    console.error('❌ Error loading menu data:', error);
    throw error;
  }
}

export async function cleanOldData(daysToKeep: number = 7): Promise<void> {
  try {
    const files = await fs.readdir(DATA_DIR);
    const now = Date.now();
    const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (file === '.gitkeep') continue;
      
      const filePath = path.join(DATA_DIR, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filePath);
        console.log(`🗑️  Deleted old menu data: ${file}`);
      }
    }
  } catch (error) {
    console.error('❌ Error cleaning old data:', error);
  }
}