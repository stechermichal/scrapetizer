import { Restaurant } from '../types';

export const restaurants: Restaurant[] = [
  {
    id: 'hybernska',
    name: 'Restaurace Hybernská',
    url: 'https://www.restauracehybernska.cz/',
    scrapeConfig: {
      type: 'static',
      selectors: {
        menuContainer: '.menu-list', // We'll need to inspect the actual selectors
        menuItem: '.menu-item',
        itemName: '.item-name',
        itemPrice: '.item-price',
        itemDescription: '.item-description'
      }
    }
  },
  {
    id: 'tiskarna',
    name: 'Restaurace Tiskárna',
    url: 'https://www.restauracetiskarna.cz/',
    menuUrl: 'https://www.restauracetiskarna.cz/jindrisska/obedy/',
    scrapeConfig: {
      type: 'static',
      selectors: {
        daySection: '.day-menu', // We'll need to inspect the actual selectors
        menuItem: '.menu-item',
        itemName: '.item-name',
        itemPrice: '.item-price'
      }
    }
  },
  {
    id: 'meatbeer',
    name: 'Meat Beer',
    url: 'https://www.meatbeer.cz/',
    menuUrl: 'https://www.meatbeer.cz/menu/',
    scrapeConfig: {
      type: 'static'
    }
  },
  {
    id: 'magburger',
    name: 'Meet&Greet',
    url: 'https://www.magburgerhouse.cz/',
    menuUrl: 'https://www.magburgerhouse.cz/poledni-menu',
    scrapeConfig: {
      type: 'pdf',
      pdfUrl: 'https://www.magburgerhouse.cz/poledni-menu'
    }
  },
  {
    id: 'saporevero',
    name: 'Sapore Vero',
    url: 'https://saporevero.choiceqr.com/',
    menuUrl: 'https://saporevero.choiceqr.com/delivery/section:denni-menu',
    scrapeConfig: {
      type: 'pdf',
      pdfUrl: 'dynamic' // PDF URL changes daily
    }
  },
  {
    id: 'nekazanka',
    name: 'Bistro Nekázanka',
    url: 'https://www.bistronekazanka.cz/',
    menuUrl: 'https://www.prazskejrej.cz/menu-na-web/bistro-nekazanka-11',
    scrapeConfig: {
      type: 'static'
    }
  }
];

export function getRestaurantById(id: string): Restaurant | undefined {
  return restaurants.find(r => r.id === id);
}