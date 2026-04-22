import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "app_name": "Cappuccino7",
      "menu": "Menu",
      "cart": "Cart",
      "orders": "Orders",
      "profile": "Profile",
      "admin": "Admin",
      "login": "Log In",
      "logout": "Log Out",
      "view_menu": "View Menu",
      "quick_order": "Quick Order",
      "reward_points": "pts",
      "total_paid": "Total Paid",
      "delivery_point": "Delivery Point",
      "loyalty_perk": "Loyalty Perk",
      "confirm_order": "Confirm Order",
      "my_account": "My Account",
      "total_points": "Total Points",
      "reward_earned": "Reward Earned",
      "units_collected": "Units Collected",
      "admin_access": "Site Administrator Access",
      "empty_cart": "Your cart is empty",
      "browse_menu": "Browse Menu",
      "search_placeholder": "Search address or use GPS...",
      "live_orders": "Live Orders",
      "dashboard": "Dashboard",
      "menu_designer": "Menu Designer",
      "add_item": "Add Item",
      "setup_required": "Setup Required",
      "run_setup": "Run Setup",
      "categories": {
        "breakfast": "Breakfast",
        "brunch": "Brunch",
        "drinks": "Drinks & Juices",
        "fast_food": "Fast Food",
        "healthy": "Healthy Meals",
        "desserts": "Desserts",
        "ice_cream": "Ice Cream",
        "signature": "Signature Menu",
        "extras": "THE EXTRA'S"
      }
    }
  },
  fr: {
    translation: {
      "app_name": "Cappuccino7",
      "menu": "Menu",
      "cart": "Panier",
      "orders": "Commandes",
      "profile": "Profil",
      "admin": "Admin",
      "login": "Connexion",
      "logout": "Déconnexion",
      "view_menu": "Voir le Menu",
      "quick_order": "Commande Rapide",
      "reward_points": "pts",
      "total_paid": "Total Payé",
      "delivery_point": "Point de Livraison",
      "loyalty_perk": "Avantage Fidélité",
      "confirm_order": "Confirmer la Commande",
      "my_account": "Mon Compte",
      "total_points": "Total Points",
      "reward_earned": "Récompense Gagnée",
      "units_collected": "Unités Collectées",
      "admin_access": "Accès Administrateur Site",
      "empty_cart": "Votre panier est vide",
      "browse_menu": "Parcourir le Menu",
      "search_placeholder": "Chercher une adresse ou GPS...",
      "live_orders": "Commandes en Direct",
      "dashboard": "Tableau de Bord",
      "menu_designer": "Designer de Menu",
      "add_item": "Ajouter Article",
      "setup_required": "Installation Requise",
      "run_setup": "Lancer l'installation",
      "categories": {
        "breakfast": "Petit-déjeuner",
        "brunch": "Brunch",
        "drinks": "Boissons & Jus",
        "fast_food": "Fast Food",
        "healthy": "Plats Équilibrés",
        "desserts": "Desserts",
        "ice_cream": "Glaces",
        "signature": "Menu Signature",
        "extras": "LES SUPPLÉMENTS"
      }
    }
  },
  ar: {
    translation: {
      "app_name": "كابتشينو7",
      "menu": "القائمة",
      "cart": "السلة",
      "orders": "الطلبات",
      "profile": "الحساب",
      "admin": "المدير",
      "login": "تسجيل الدخول",
      "logout": "تسجيل الخروج",
      "view_menu": "عرض القائمة",
      "quick_order": "طلب سريع",
      "reward_points": "نقطة",
      "total_paid": "المبلغ الإجمالي",
      "delivery_point": "نقطة التسليم",
      "loyalty_perk": "مزايا الولاء",
      "confirm_order": "تأكيد الطلب",
      "my_account": "حسابي",
      "total_points": "مجموع النقاط",
      "reward_earned": "تم الحصول على المكافأة",
      "units_collected": "وحدات تم جمعها",
      "admin_access": "دخول مدير الموقع",
      "empty_cart": "سلتك فارغة",
      "browse_menu": "تصفح القائمة",
      "search_placeholder": "بحث عن عنوان أو GPS...",
      "live_orders": "الطلبات المباشرة",
      "dashboard": "لوحة التحكم",
      "menu_designer": "مصمم القائمة",
      "add_item": "إضافة صنف",
      "setup_required": "الإعداد مطلوب",
      "run_setup": "تشغيل الإعداد",
      "categories": {
        "breakfast": "الإفطار",
        "brunch": "برنش",
        "drinks": "المشروبات والعصائر",
        "fast_food": "الوجبات السريعة",
        "healthy": "وجبات صحية",
        "desserts": "حلويات",
        "ice_cream": "آيس كريم",
        "signature": "قائمة التوقيع",
        "extras": "الإضافات"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

export default i18n;
