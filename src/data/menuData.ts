export interface VerifiedCategory {
  id: string;
  name: string;
  order: number;
}

export interface VerifiedMenuItem {
  name: string;
  price: number;
  description: string;
  categoryId?: string;
  subSection?: string;
  image?: string;
}

export const CATEGORIES: VerifiedCategory[] = [
  { id: 'breakfast', name: '🥐 PETIT DÉJEUNER (Breakfast)', order: 0 },
  { id: 'petites-faims', name: '🍳 PETITES FAIMS', order: 1 },
  { id: 'coffee', name: '☕ COFFEE / HOT DRINKS (Les boissons)', order: 2 },
  { id: 'tea', name: '🍵 THÉ & INFUSIONS', order: 3 },
  { id: 'special-hot', name: '🔥 SPECIAL HOT DRINKS', order: 4 },
  { id: 'iced-latte', name: '🧊 ICED LATTE', order: 5 },
  { id: 'ice-tea', name: '🧊 ICE TEA', order: 6 },
  { id: 'juices', name: '🥤 JUS (JUICES)', order: 7 },
  { id: 'frappuccino', name: '🧋 FRAPPUCCINOS COFFEE', order: 8 },
  { id: 'milkshakes', name: '🥤 MILKSHAKES', order: 9 },
  { id: 'smoothies', name: '🥤 SMOOTHIES', order: 10 },
  { id: 'mojitos', name: '🍹 MOJITOS', order: 11 },
  { id: 'salads', name: '🥗 SALADS', order: 12 },
  { id: 'burgers', name: '🍔 Burgers', order: 13 },
  { id: 'sandwiches', name: '🥪 Sandwiches', order: 14 },
  { id: 'pizza', name: '🍕 PIZZA', order: 15 },
  { id: 'plats-gourmands', name: '🥘 PLATS GOURMANDS', order: 16 },
  { id: 'pates', name: '🍝 PÂTES', order: 17 },
  { id: 'crepes-desserts', name: '🥞 Crêpes & Desserts', order: 18 },
  { id: 'pancakes-gaufres', name: '🥞 Pancakes & Gaufres', order: 19 },
  { id: 'ice-cream', name: '🍦 Ice Cream', order: 20 },
  { id: 'afternoon-tea', name: '🍰 Afternoon Tea', order: 21 },
  { id: 'healthy-food', name: '🥗 HEALTHY FOOD', order: 22 },
  { id: 'extras', name: '➕ EXTRAS', order: 23 }
];

export const PRODUCTS_DATA: Record<string, VerifiedMenuItem[]> = {
  'breakfast': [
    { name: 'Occidental', price: 38, description: 'Deux viennoiseries, Jus d’orange, Balboula, Boisson chaude au choix, Eau minérale.' },
    { name: 'Amazigh', price: 45, description: 'Beghrir, Harcha, Meloui, Betbout, Amlou, Fromage, Miel, Jus d’orange, Balboula, Boisson chaude au choix, Eau minérale.' },
    { name: 'Gourmand', price: 48, description: 'Oeufs au plat brouillés avec ou sans fromage, panier de pain, jus d’orange, Belboula, Boisson chaude au choix, Eau minérale.' },
    { name: 'Ftour Fassi', price: 45, description: 'Oeufs au khlii, Huile d’olive, Olives noires, Panier de pain, Jus d’orange, Belboula, Boisson chaude au choix, Eau minérale.' },
    { name: 'Ftour Chamali', price: 58, description: 'Oeufs brouillés avec charcuterie et fromage blanc, Panier de pain, Jus d’orange, Belboula, Boisson chaude au choix, Eau minérale.' },
    { name: 'Omelette Spéciale', price: 48, description: 'Oeufs brouillés avec tomate cerise, Oignons, Dinde fumée, panier de pain, jus d’orange, Belboula, Boisson chaude au choix, Eau minérale.' },
    { name: 'Cappuccino7 Breakfast', price: 68, description: 'Croque Monsieur, Hotdog, Fromage blanc, salade verte, tomate et maïs, Crêpes Nutella, salade fruits, jus d’orange, Belboula, Boisson chaude au choix, Eau minérale.' },
    { name: 'Healthy Breakfast', price: 60, description: 'Toast a la puree d’avocat et oeufs, Bol d’avoine à la banane, chia et fruits secs, Assortiment de fruits de saison, yaourt, Jus d’orange, Balboula, Boisson chaude au choix, Eau minérale.' },
    { name: 'Turkie', price: 68, description: 'Oeufs au plat, Fromage Rouge, Fromage Blanc, Fromage Cheddar, Concombre, Salade Tomate, olives, huile d’olives, jambon, beurre, confiture, pain, Jus d’orange, Balboula, Boisson chaude au choix, Eau minérale.' },
    { name: 'Anglais', price: 85, description: 'Oeufs au plat brouillés, Hash brownes, Tomate grillé, Boul des haricots, Fromage, dinde fumée, champignon sauté, pain grillé, saucice, salade fruits, salade variée, jus d’orange, yaourt, eau minérale, Boisson chaude au choix.' },
    { name: 'Brunch (1 personne)', price: 87, subSection: 'brunch', description: 'Omelette, jambon, fromage, pancakes, jus detox, salade de fruits' },
    { name: 'Brunch (2 personnes)', price: 150, subSection: 'brunch', description: 'Grand assortiment complet pour deux personnes avec boissons chaudes et froides' }
  ],
  'petites-faims': [
    { name: 'Omlette nature', price: 20, description: 'Deux grains d\'œufs frais, sel, poivre' },
    { name: 'Omlette Fromage', price: 25, description: 'Oeufs, fromage emmental fondu' },
    { name: 'Omlette Fromage Champignion', price: 28, description: 'Oeufs, champignons de Paris, fromage' },
    { name: 'Beghrir Amlou', price: 30, description: 'Crêpe marocaine (mille trous) servie avec du véritable Amlou' },
    { name: 'Croque Monsieur', price: 35, description: 'Pain de mie, jambon, fromage, sauce béchamel' },
    { name: 'Croque Madame', price: 35, description: 'Pain de mie, jambon, fromage, œuf au plat sur le dessus' }
  ],
  'coffee': [
    { name: 'Lait chaude', price: 14, description: 'Lait entier onctueux servi bien chaud' },
    { name: 'Espresso', price: 14, description: 'Café court intense et riche en arôme' },
    { name: 'Café americain', price: 15, description: 'Espresso allongé à l\'eau chaude' },
    { name: 'Lait parfumé', price: 14, description: 'Lait chaud aromatisé au choix' },
    { name: 'Café crème', price: 15, description: 'Espresso with a touch of cream' },
    { name: 'Nespresso', price: 15, description: 'Variétés premium de capsules Nespresso' },
    { name: 'Latté Macchiato', price: 16, description: 'Trois couches : lait chaud, espresso, mousse de lait' },
    { name: 'Double Espresso', price: 18, description: 'Double dose de caféine pour un goût intense' },
    { name: 'Cappuccino Italien', price: 18, description: 'Espresso, lait chaud et mousse de lait dense' },
    { name: 'Chocolat chaud', price: 18, description: 'Onctueux chocolat fondu mélangé au lait' },
    { name: 'Cappuccino viennois', price: 25, description: 'Espresso, lait chaud et crème chantilly' },
    { name: 'Café au miel', price: 18, description: 'Espresso doux sucré au miel naturel' }
  ],
  'tea': [
    { name: 'Thé à la menthe', price: 14, description: 'Thé vert traditionnel à la menthe fraîche' },
    { name: 'Lipton', price: 14, description: 'Thé noir classique Lipton' },
    { name: 'Verveine', price: 14, description: 'Infusion de feuilles de verveine apaisantes' },
    { name: 'Infusion thé bio', price: 16, description: 'Sélection de plantes biologiques de saison' }
  ],
  'special-hot': [
    { name: 'Mocaccino', price: 20, description: 'Espresso, chocolat, lait chaud' },
    { name: 'Noisette Macchiato', price: 20, description: 'Macchiato parfumé à la noisette grillée' },
    { name: 'Caramel Macchiato', price: 22, description: 'Macchiato avec une sauce caramel onctueuse' },
    { name: 'Chocolat viennois', price: 22, description: 'Chocolat chaud surmonté de chantilly' },
    { name: 'Chocolat Fondue', price: 28, description: 'Fontaine de chocolat chaud avec accompagnements' },
    { name: 'Chocolat Bresilien', price: 30, description: 'Chocolat noir intense aux notes de café' }
  ],
  'iced-latte': [
    { name: 'Caramel & cream', price: 25, description: 'Café glacé, caramel, crème légère' },
    { name: 'Noisette', price: 25, description: 'Café glacé au goût de noisette' },
    { name: 'Happy moka', price: 25, description: 'Mélange glacé café et chocolat' }
  ],
  'ice-tea': [
    { name: 'Pêche', price: 30, description: 'Infusion glacée à la pêche douce' },
    { name: 'Citron', price: 30, description: 'Infusion glacée au citron acidulé' },
    { name: 'Framboise', price: 30, description: 'Infusion glacée aux baies rouges' }
  ],
  'juices': [
    { name: 'Orange', price: 25, description: 'Jus d\'orange 100% pur pressé' },
    { name: 'Citron', price: 25, description: 'Limonade fraîche maison' },
    { name: 'Carotte', price: 25, description: 'Jus de carottes du jardin pressées' },
    { name: 'Pomme', price: 25, description: 'Jus de pommes croquantes' },
    { name: 'Banane', price: 25, description: 'Nectar de banane onctueux' },
    { name: 'Mangue', price: 25, description: 'Purée de mangue mûre' },
    { name: 'Fraise', price: 25, description: 'Jus de fraises de saison' },
    { name: 'Ananas', price: 25, description: 'Jus d\'ananas tropical' },
    { name: 'Kiwi', price: 25, description: 'Jus de kiwi frais vitaminé' },
    { name: 'Panaché', price: 35, description: 'Mélange de plusieurs fruits pressés' },
    { name: 'Avocat fruits secs', price: 30, description: 'Avocat, lait et fruits secs variés' },
    { name: 'Zazaa', price: 48, description: 'Boisson spéciale signature Cappuccino' }
  ],
  'frappuccino': [
    { name: 'Caramel & Cream', price: 35, description: 'Mix glacé caramel et crème' },
    { name: 'Caramel Beurre salé', price: 35, description: 'Mix glacé au caramel beurre salé' },
    { name: 'Moka Chocolate', price: 35, description: 'Mix glacé café et copeaux de chocolat' },
    { name: 'Noisette', price: 35, description: 'Mix glacé aux éclats de noisettes' },
    { name: 'Amaretto', price: 35, description: 'Mix glacé à l\'arôme d\'amande' }
  ],
  'milkshakes': [
    { name: 'Caramel Shake', price: 40, description: 'Glace vanille, lait, caramel' },
    { name: 'Orange shake', price: 40, description: 'Glace vanille, jus d\'orange, zeste' },
    { name: 'Mixed berries (fruits rouges)', price: 40, description: 'Fruits rouges mixés, glace vanille' },
    { name: 'Mango Alphonso', price: 40, description: 'Mangue Alphonso, lait, glace' },
    { name: 'Chocolat Oreo', price: 40, description: 'Oreo concassé, chocolat fondu, lait' },
    { name: 'Fruit de la passion', price: 40, description: 'Nectar de passion, glace vanille' },
    { name: 'Fraise', price: 40, description: 'Fraises fraîches, lait, crème' }
  ],
  'smoothies': [
    { name: 'Detox Maison', price: 35, description: 'Pomme verte, céleri, concombre, citron' },
    { name: 'Berry Explosion', price: 35, description: 'Fraises, myrtilles, framboises' },
    { name: 'Mango Madness', price: 35, description: 'Mangue, orange, gingembre' },
    { name: 'Tropical paradise', price: 35, description: 'Ananas, coco, passion' }
  ],
  'mojitos': [
    { name: 'Classique', price: 25, description: 'Menthe, citron vert, soda' },
    { name: 'Mango mojito', price: 25, description: 'Mangue, menthe, citron' },
    { name: 'Berries mojito', price: 25, description: 'Fruits rouges, menthe, citron' },
    { name: 'Passion mojito', price: 25, description: 'Nectar de passion, menthe' },
    { name: 'Ananas mojito', price: 25, description: 'Ananas, citron, soda' },
    { name: 'Blue mojito', price: 25, description: 'Curacao bleu, menthe, citron' },
    { name: 'Concombre mojito', price: 25, description: 'Concombre frais, menthe' },
    { name: 'Strawberry mojito', price: 25, description: 'Fraises, menthe, soda' }
  ],
  'salads': [
    { name: 'Salade Marocaine', price: 35, description: 'Tomates, oignons, poivrons rouges et verts, concombres' },
    { name: 'Salade Thon', price: 40, description: 'Thon, laitue, maïs, carottes, oignons, tomates, poivrons, œufs durs, sauce vinaigrette' },
    { name: 'Salade Royale', price: 55, description: 'Saumon fumé, crevettes, avocat, mangue, mâche, sauce agrumes' },
    { name: 'Salade Niçoise', price: 42, description: 'Thon, pommes de terre, haricots verts, œufs, olives, tomates' },
    { name: 'Salade du Chef', price: 65, description: 'Jambon, fromage, œuf dur, tomates, maïs, laitue, concombres, haricots verts' }
  ],
  'burgers': [
    { name: 'Burger Furri', price: 45, description: 'Deux steaks (viande hachée), Jambon, double fromage, Tomate, Oignon, Laitue, Sauce blanche' },
    { name: 'Burger Viande hachée', price: 45, description: 'Viande hachée, Laitue, Fromage, Tomate, Oignon' },
    { name: 'Chicken Burger', price: 40, description: 'Poulet haché, Laitue, Fromage, Tomate, Oignon, Sauce moutarde miel' },
    { name: 'Chicken Kids Burger (mini burger)', price: 35, description: 'Mini burger au poulet, fromage, ketchup, Laitue' },
    { name: 'Beef Kids Burger (mini burger)', price: 38, description: 'Mini burger à la viande hachée, fromage, ketchup, Laitue' }
  ],
  'sandwiches': [
    { name: 'Sandwich Thon (froids)', price: 35, description: 'Thon, maïs, carottes râpées, oignon rouge, laitue, tomates, œuf dur, sauce mayonnaise' },
    { name: 'Sandwich Jambon (froids)', price: 35, description: 'Jambon de bœuf, fromage edam, laitue, tomates, sauce andalouse' },
    { name: 'Sandwich Viande hachée (chauds)', price: 45, description: 'Viande hachée grillée, oignons caramélisés, fromage, sauce burger' },
    { name: 'Sandwich Poulet (chauds)', price: 40, description: 'Émincé de poulet mariné, poivrons, fromage, oignons, sauce curry' }
  ],
  'pizza': [
    { name: 'Margarita', price: 35, description: 'Sauce tomate, mozzarella, origan, basilic frais' },
    { name: 'Vegeterienne', price: 45, description: 'Poivrons, champignons, oignons, olives noires, maïs, courgettes' },
    { name: 'Thon', price: 50, description: 'Thon, oignons, mozzarella, olives noires, origan' },
    { name: 'Quatre Fromages', price: 55, description: 'Mozzarella, fromage bleu, emmental, parmesan, crème fraîche' },
    { name: 'Viande Hachée', price: 55, description: 'Viande hachée, poivrons, mozzarella, sauce tomate' },
    { name: 'Fruit de mer', price: 65, description: 'Crevettes, calamars, ail, mozzarella, sauce tomate' }
  ],
  'plats-gourmands': [
    { name: 'Escaloppe de poulet à la crème', price: 75, description: 'Filet de poulet, sauce aux champignons, riz basmati ou frites' },
    { name: 'Emincé de boeuf', price: 85, description: 'Fines lamelles de bœuf sautées, poivrons, sauce soja, riz blanc' },
    { name: 'Cordon Bleu', price: 80, description: 'Blanc de poulet pané farci au fromage et jambon, frites et salade' }
  ],
  'pates': [
    { name: 'Bolognaise', price: 45, description: 'Sauce tomate maison, viande hachée, parmesan, basilic frais' },
    { name: 'Carbonara', price: 50, description: 'Crème fraîche, lardons fumés, jaune d’œuf, parmesan' },
    { name: 'Pesto', price: 45, description: 'Sauce pesto maison au basilic, pignons de pin, parmesan, huile d’olive' },
    { name: 'Fruits de mer', price: 60, description: 'Crevettes, calamars, moules, sauce tomate ou crème, ail et persil' }
  ],
  'crepes-desserts': [
    { name: 'Nature', price: 20, subSection: 'crepes_sucrees', description: 'Recette artisanale servie nature' },
    { name: 'Confiture', price: 25, subSection: 'crepes_sucrees', description: 'Confiture de fruits au choix' },
    { name: 'Nutella', price: 30, subSection: 'crepes_sucrees', description: 'Véritable chocolat Nutella' },
    { name: 'Nutella et Banane', price: 37, subSection: 'crepes_sucrees', description: 'Nutella, rondelles de banane fraîche' },
    { name: 'Miel & Noix', price: 35, subSection: 'crepes_sucrees', description: 'Miel d’oranger pur, cerneaux de noix croquants' },
    { name: 'Royal', price: 40, subSection: 'crepes_sucrees', description: 'Nutella, amandes grillées, boules de glace vanille' },
    { name: 'Exotique', price: 48, subSection: 'crepes_sucrees', description: 'Coulis de fruits mangue passion, morceaux d\'ananas frais' },
    { name: 'Brésilienne', price: 48, subSection: 'crepes_sucrees', description: 'Café, caramel au beurre salé, chantilly' },
    { name: 'Cappuccino7 Special', price: 52, subSection: 'crepes_sucrees', description: 'Nutella, Oreo concassé, Kinder Bueno, sauce chocolat' },
    { name: 'Fromage Mozerella', price: 42, subSection: 'crepes_salees', description: 'Mozzarella fondante, herbes de Provence' },
    { name: 'Dinde fumée', price: 48, subSection: 'crepes_salees', description: 'Jambon de dinde, fromage cheese, crème fraîche' },
    { name: 'Poulet Champignon', price: 54, subSection: 'crepes_salees', description: 'Émincé de poulet, sauce forestière, mozzarella' }
  ],
  'pancakes-gaufres': [
    { name: 'Classique', price: 35, description: 'Beurre et miel pur ou sirop d’érable' },
    { name: 'Choco-Noisette', price: 42, description: 'Nutella, noisettes concassées' },
    { name: 'Fraîcheur', price: 48, description: 'Fruits de saison, coulis de fruits rouges, chantilly' }
  ],
  'ice-cream': [
    { name: 'Sorbet Fruits Rouges', price: 35, description: 'Framboise, fraise, cerise' },
    { name: 'Glace Royale', price: 45, description: 'Vanille Bourbon, éclats de caramel, amandes effilées' }
  ],
  'afternoon-tea': [
    { name: 'Plateau de Pâtisseries Marocaines', price: 55, description: 'Assortiment de cornes de gazelle, ghriba, briouates au miel' },
    { name: 'Scones & Cream', price: 45, description: 'Scones anglais tièdes, crème épaisse (clotted cream), confiture maison' },
    { name: 'Macarons', price: 65, description: 'Coffret de 6 macarons artisanaux (parfums au choix)' }
  ],
  'healthy-food': [
    { name: 'Salade de Quinoa', price: 45, description: 'Quinoa, avocat, grenade, fêta, vinaigrette citronnée' },
    { name: 'Bowl Poulet Grillé', price: 55, description: 'Poulet grillé, riz brun, légumes vapeur, sauce légère' },
    { name: 'Smoothie Vert Détox', price: 35, description: 'Épinards, pomme verte, concombre, chia' }
  ],
  'extras': [
    { name: 'Frite', price: 15, description: 'Portion de frites croustillantes' },
    { name: 'Fromage', price: 5, description: 'Supplément tranche de fromage' },
    { name: 'Oeuf', price: 5, description: 'Supplément œuf au plat' },
    { name: 'Dinde', price: 7, description: 'Supplément jambon de dinde' },
    { name: 'Viande hachée', price: 10, description: 'Supplément viande hachée grillée' },
    { name: 'Poulet', price: 10, description: 'Supplément émincé de poulet' },
    { name: 'Champignon', price: 7, description: 'Supplément champignons frais' }
  ]
};

export interface MenuValidationError {
  type: 'duplicate_name' | 'missing_description' | 'wrong_category' | 'missing_price' | 'broken_image' | 'empty_field';
  message: string;
  item?: any;
  severity: 'error' | 'warning';
}

/**
 * Validates dynamic menu products and categories from Firebase against the strict centralized template
 * and standard sanity rules.
 */
export function validateMenu(dbProducts: any[], dbCategories: any[]): MenuValidationError[] {
  const errors: MenuValidationError[] = [];
  const nameSet = new Set<string>();

  // Helper to find expected reference product
  const findTemplateProduct = (name: string) => {
    for (const catId of Object.keys(PRODUCTS_DATA)) {
      const found = PRODUCTS_DATA[catId].find(p => p.name.toLowerCase() === name.toLowerCase());
      if (found) return { ...found, expectedCategoryId: catId };
    }
    return null;
  };

  dbProducts.forEach(prod => {
    const key = `${prod.categoryId}-${prod.name.toLowerCase()}`;
    
    // Check duplication (within same category)
    if (nameSet.has(key)) {
      errors.push({
        type: 'duplicate_name',
        message: `Duplicate item found: "${prod.name}" in selected category.`,
        item: prod,
        severity: 'error'
      });
    }
    nameSet.add(key);

    // Empty fields check
    if (!prod.name || prod.name.trim() === '') {
      errors.push({
        type: 'empty_field',
        message: `Product has an empty or invalid name field.`,
        item: prod,
        severity: 'error'
      });
    }

    // Missing description check
    if (!prod.description || prod.description.trim() === '') {
      errors.push({
        type: 'missing_description',
        message: `"${prod.name}" has no description.`,
        item: prod,
        severity: 'warning'
      });
    }

    // Missing price check
    if (prod.price === undefined || prod.price === null || Number(prod.price) <= 0) {
      errors.push({
        type: 'missing_price',
        message: `"${prod.name}" is missing a valid positive price. Current: ${prod.price}`,
        item: prod,
        severity: 'error'
      });
    }

    // Broken image check
    if (prod.image && prod.image.trim() !== '') {
      const isValidUrl = prod.image.startsWith('http://') || prod.image.startsWith('https://');
      if (!isValidUrl) {
        errors.push({
          type: 'broken_image',
          message: `"${prod.name}" has an invalid image URL format: "${prod.image.slice(0, 30)}..."`,
          item: prod,
          severity: 'warning'
        });
      }
    }

    // Check mismatch against verified master template source of truth
    const template = findTemplateProduct(prod.name);
    if (template) {
      // 1. Check description mismatch (French screenshots source of truth)
      if (prod.description && prod.description.trim() !== template.description.trim()) {
        errors.push({
          type: 'missing_description',
          message: `"${prod.name}" description deviates from official screenshots source of truth. Ensure exactly: "${template.description}"`,
          item: prod,
          severity: 'warning'
        });
      }

      // 2. Check category assignment mismatch
      if (prod.categoryId && prod.categoryId !== template.expectedCategoryId && !prod.categoryId.endsWith(template.expectedCategoryId)) {
        errors.push({
          type: 'wrong_category',
          message: `"${prod.name}" is assigned to category "${prod.categoryId}", expected "${template.expectedCategoryId}".`,
          item: prod,
          severity: 'warning'
        });
      }

      // 3. Check price mismatch
      if (Number(prod.price) !== template.price) {
        errors.push({
          type: 'missing_price',
          message: `"${prod.name}" price (${prod.price} DH) deviates from original price (${template.price} DH).`,
          item: prod,
          severity: 'warning'
        });
      }
    }
  });

  // Verify Categories
  dbCategories.forEach(cat => {
    if (!cat.name || cat.name.trim() === '') {
      errors.push({
        type: 'empty_field',
        message: `Category has an empty or missing name.`,
        item: cat,
        severity: 'error'
      });
    }
  });

  return errors;
}
