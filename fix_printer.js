import fs from 'fs';

let content = fs.readFileSync('src/lib/thermalPrinter.ts', 'utf8');

content = content.replace(
  /export function printToThermalPrinter\(receipt: string\) \{[\s\S]*\}\s*\} else \{\s*console\.log\(receipt\);\s*alert\("Receipt generated! Check console\."\);\s*\}\s*\}/g,
  `export function printToThermalPrinter(receipt: string) {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(\`
      <html>
        <head>
          <title>Thermal Receipt</title>
          <style>
            @page {
              margin: 0;
              size: 80mm auto; /* Thermal printer width */
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 100%;
              margin: 0;
              padding: 0;
              background: white;
              color: black;
              white-space: pre-wrap;
              font-size: 12px;
              line-height: 1.2;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>\${receipt}</body>
      </html>
    \`);
    printWindow.document.close();
    
    // Wait for the window to load before printing
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        console.error("Print failed", e);
      }
    }, 250);
  } else {
    console.log(receipt);
    alert("Receipt generated! Check console.");
  }
}`
);

fs.writeFileSync('src/lib/thermalPrinter.ts', content);
