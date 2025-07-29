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
    id: 'masarycka',
    name: 'Masarycka Restaurace',
    url: 'https://masaryckarestaurace.choiceqr.com',
    menuUrl: 'https://masaryckarestaurace.choiceqr.com/section:poledni-menu/',
    scrapeConfig: {
      type: 'dynamic',
      dayUrlPattern: 'https://masaryckarestaurace.choiceqr.com/section:poledni-menu/{day}'
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
  }
];

export function getRestaurantById(id: string): Restaurant | undefined {
  return restaurants.find(r => r.id === id);
}