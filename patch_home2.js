import fs from 'fs';
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const oldFunc = `  const handleAutoLocate = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not supported");
      setShowGeoPrompt(false);
      return;
    }

    setIsLocating(true);
    
        localStorage.setItem('geo_prompted', 'true');
        setIsLocating(false);
        setShowGeoPrompt(false);
        toast.success(t('location_captured'));
      },
      (error) => {
        console.error("GPS Error:", error);
        localStorage.setItem('geo_prompted', 'true');
        setIsLocating(false);
        setShowGeoPrompt(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };`;

const newFunc = `  const handleAutoLocate = () => {
    toast.error("GPS disabled");
  };`;

if (content.includes(oldFunc)) {
  content = content.replace(oldFunc, newFunc);
} else {
  // Try regex
  content = content.replace(/const handleAutoLocate = \(\) => \{[\s\S]*?maximumAge: 0 \}\n    \);\n  \};/, newFunc);
}

fs.writeFileSync('src/pages/Home.tsx', content);
