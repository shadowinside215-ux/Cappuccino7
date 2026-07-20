import fs from 'fs';
let content = fs.readFileSync('src/i18n.ts', 'utf8');

const translations = {
  en: {
    inside_and_outside: "Inside & Outside",
    inside_zone_a: "Inside (Zone A)",
    outside_zone_b: "Outside (Zone B)",
    select_zone: "Select Zone",
    inside_a: "Inside (A)",
    outside_b: "Outside (B)",
    both_zones: "Both",
    inside_tables: "Inside Tables (Zone A)",
    outside_tables: "Outside Tables (Zone B)",
    inside_requests: "Inside Requests (Zone A)",
    outside_requests: "Outside Requests (Zone B)",
  },
  fr: {
    inside_and_outside: "Intérieur & Extérieur",
    inside_zone_a: "Intérieur (Zone A)",
    outside_zone_b: "Extérieur (Zone B)",
    select_zone: "Sélectionner la Zone",
    inside_a: "Intérieur (A)",
    outside_b: "Extérieur (B)",
    both_zones: "Les deux",
    inside_tables: "Tables Intérieures (Zone A)",
    outside_tables: "Tables Extérieures (Zone B)",
    inside_requests: "Demandes Intérieures (Zone A)",
    outside_requests: "Demandes Extérieures (Zone B)",
  },
  ar: {
    inside_and_outside: "الداخل والخارج",
    inside_zone_a: "الداخل (المنطقة أ)",
    outside_zone_b: "الخارج (المنطقة ب)",
    select_zone: "اختر المنطقة",
    inside_a: "الداخل (أ)",
    outside_b: "الخارج (ب)",
    both_zones: "كلاهما",
    inside_tables: "الطاولات الداخلية (المنطقة أ)",
    outside_tables: "الطاولات الخارجية (المنطقة ب)",
    inside_requests: "الطلبات الداخلية (المنطقة أ)",
    outside_requests: "الطلبات الخارجية (المنطقة ب)",
  }
};

function insertTranslation(lang, obj) {
  const marker = '"' + lang + '": {\n    translation: {';
  const entries = Object.entries(obj).map(([k, v]) => '      "' + k + '": "' + v + '",').join('\n');
  content = content.replace(marker, marker + '\n' + entries);
}

insertTranslation('en', translations.en);
insertTranslation('fr', translations.fr);
insertTranslation('ar', translations.ar);

fs.writeFileSync('src/i18n.ts', content);
