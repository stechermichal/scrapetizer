import { getCurrentCzechDayUrl } from '@/lib/utils/czech-days';

export function UnreadableRestaurants() {
  return (
    <div className="mt-8 p-4 bg-muted rounded-lg flex-shrink-0">
      <h2 className="text-xl font-semibold mb-3">Restaurants with unreadable menus 😢</h2>
      <div className="flex flex-wrap gap-4">
        <a 
          href="https://www.lasadelitas.cz/denni-menu/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Las Adelitas →
        </a>
        {/* This is actually scrapeable, it's just a real real pain */}
        <a 
          href={`https://masaryckarestaurace.choiceqr.com/section:poledni-menu/${getCurrentCzechDayUrl()}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Masarycka →
        </a>
      </div>
    </div>
  );
}