import fs from 'fs';
let content = fs.readFileSync('src/lib/thermalPrinter.ts', 'utf8');

const oldPrint = `export function printToThermalPrinter(receipt: string) {
  // In a real browser environment, we'd use the Web Serial API or a hidden iframe
  // For this AI Studio preview, we will simulate by opening a clean window with mono font
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(\`
      <html>
        <head>
          <title>Thermal Receipt</title>
          <style>
            @font-face {
              font-family: 'ReceiptFont';
              src: url('https://fonts.cdnfonts.com/s/16061/Merchant\\ Copy.woff') format('woff');
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 300px;
              margin: 0;
              padding: 20px;
              background: white;
              color: black;
              white-space: pre-wrap;
              font-size: 14px;
              line-height: 1.2;
            }
            @media print {
              body { padding: 0; width: 100%; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          \${receipt}
        </body>
      </html>
    \`);
    printWindow.document.close();
  } else {
    // Fallback if popup blocked
    console.log(receipt);
    alert("Receipt generated! Check console (popup was blocked).");
  }
}`;

const newPrint = `export function printToThermalPrinter(receipt: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(\`
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
              padding: 5mm;
              background: white;
              color: black;
              white-space: pre-wrap;
              font-size: 12px;
              line-height: 1.2;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          \${receipt}
        </body>
      </html>
    \`);
    doc.close();

    // Wait for the iframe to load before printing
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Print failed", e);
      }
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  } else {
    console.log(receipt);
    alert("Receipt generated! Check console.");
  }
}`;

content = content.replace(oldPrint, newPrint);
fs.writeFileSync('src/lib/thermalPrinter.ts', content);
