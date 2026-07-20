import fs from 'fs';
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const declarations = `
  const navigate = useNavigate();
  const [isLocating, setIsLocating] = useState(false);
  const isDrinkCategory = (categoryId: string) => ['boissons-chaudes', 'boissons-froides', 'jus'].includes(categoryId);
  const isFlavoredMilk = (name: string) => name.toLowerCase().includes('aromatisé');
`;

content = content.replace(
  /const showGeoPrompt = false;/,
  declarations + '\n  const showGeoPrompt = false;'
);

// Fix the Expected 0 arguments but got 1 for setShowGeoPrompt
content = content.replace(
  /const setShowGeoPrompt = \(\) => \{\};/,
  'const setShowGeoPrompt = (val: boolean) => {};'
);

fs.writeFileSync('src/pages/Home.tsx', content);
