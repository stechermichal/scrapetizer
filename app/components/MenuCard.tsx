'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MapPin, AlertCircle, Instagram } from 'lucide-react';
import { RestaurantMenu } from '@/lib/types';
import { formatMenuItemName } from '@/lib/utils/text-formatting';

interface MenuCardProps {
  menu: RestaurantMenu;
}

export function MenuCard({ menu }: MenuCardProps) {
  const hasItems = menu.items.length > 0;
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolled(scrollTop > 5);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const scrollableDiv = e.currentTarget;
    // If this card has a scrollbar, stop the event from bubbling up
    if (scrollableDiv.scrollHeight > scrollableDiv.clientHeight) {
      e.stopPropagation();
    }
  };
  
  return (
    <Card className="hover:shadow-lg transition-shadow flex-shrink-0 w-80 overflow-hidden flex flex-col gap-0 h-fit" style={{ maxHeight: 'calc(100vh - 160px)' }}>
      {/* Fixed header */}
      <div className={`${isScrolled ? 'shadow-md' : ''}`}>
        <div className="px-6 pb-3 -mt-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {menu.restaurantName}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {menu.instagramUrl && (
                <a
                  href={menu.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={`Visit ${menu.restaurantName} on Instagram`}
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              <a
                href={menu.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label={`Visit ${menu.restaurantName} website`}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-b" />
      </div>
      <div 
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
        onWheel={handleWheel}
      >
        {hasItems ? (
          <div className="space-y-3 px-6 pb-6">
            {menu.items.map((item, index) => (
              <div key={index} className={`border-b last:border-b-0 pb-3 last:pb-0 ${index === 0 ? 'pt-3' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm leading-tight">
                      {(() => {
                        const { bold, rest } = formatMenuItemName(item.name);
                        return (
                          <>
                            <span className="font-semibold">{bold}</span>
                            {rest && <span className="font-normal"> {rest}</span>}
                          </>
                        );
                      })()}
                    </h4>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {item.price} Kč
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground px-6 py-3">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{menu.errorMessage || 'No menu available'}</span>
          </div>
        )}
      </div>
    </Card>
  );
}