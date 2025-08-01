import { Utensils } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="text-center py-12">
      <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-lg font-semibold mb-2">No menus available</h2>
      <p className="text-muted-foreground">
        Try running the scraper to fetch today&apos;s menus.
      </p>
      <pre className="mt-4 text-sm bg-muted px-3 py-2 rounded-md inline-block">
        npm run scrape:restaurant
      </pre>
    </div>
  );
}