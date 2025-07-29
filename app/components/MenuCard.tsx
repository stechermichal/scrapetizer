'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ExternalLink, MapPin, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { RestaurantMenu } from '@/lib/types';
import { format } from 'date-fns';

interface MenuCardProps {
  menu: RestaurantMenu;
}

export function MenuCard({ menu }: MenuCardProps) {
  const hasItems = menu.items.length > 0;
  const [isOpen, setIsOpen] = useState(true);
  
  // Only show collapsible on mobile when there are more than 3 items
  const showCollapsible = hasItems && menu.items.length > 3;
  
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {menu.restaurantName}
            </CardTitle>
            <CardDescription className="text-xs">
              {menu.scrapedAt ? (
                <>Last updated: {format(new Date(menu.scrapedAt), 'HH:mm')}</>
              ) : (
                'No data available'
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={menu.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label={`Visit ${menu.restaurantName} website`}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            {showCollapsible && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-muted-foreground hover:text-primary transition-colors md:hidden"
                aria-label={isOpen ? 'Collapse menu' : 'Expand menu'}
              >
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {hasItems ? (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleContent>
              <div className="space-y-3">
                {menu.items.map((item, index) => (
                  <div key={index} className="border-b last:border-b-0 pb-3 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm leading-tight">{item.name}</h4>
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
            </CollapsibleContent>
            {!isOpen && (
              <div className="text-sm text-muted-foreground">
                {menu.items.length} items available
              </div>
            )}
          </Collapsible>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{menu.errorMessage || 'No menu available'}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}