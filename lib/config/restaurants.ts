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
    url: 'https://www.saporevero.cz/',
    menuUrl: 'https://www.saporevero.cz/',
    scrapeConfig: {
      type: 'static' // Menu available via modal on homepage
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
  },
  {
    id: 'kantyna',
    name: 'Kantýna',
    url: 'https://www.kantyna.ambi.cz/',
    menuUrl: 'https://www.kantyna.ambi.cz/menu/denni-menu',
    scrapeConfig: {
      type: 'static'
    }
  }
];

export function getRestaurantById(id: string): Restaurant | undefined {
  return restaurants.find(r => r.id === id);
}