import { Order, OrderItem } from '../types';
import { format } from 'date-fns';

export interface ReceiptData {
  restaurantName: string;
  orderId: string;
  items: OrderItem[];
  total: number;
  cashierName: string;
  paymentMethod: string;
  date: Date;
  deliveryType: string;
  customerName?: string;
  customerPhone?: string;
}

export function generateThermalReceipt(data: ReceiptData): string {
  const line = "--------------------------------";
  const doubleLine = "================================";
  const maxWidth = 32;

  const center = (text: string) => {
    const spaces = Math.max(0, Math.floor((maxWidth - text.length) / 2));
    return " ".repeat(spaces) + text;
  };

  const justify = (left: string, right: string) => {
    const spaces = Math.max(0, maxWidth - (left.length + right.length));
    return left + " ".repeat(spaces) + right;
  };

  let receipt = "";
  
  // Header
  receipt += center(data.restaurantName.toUpperCase()) + "\n";
  receipt += center("POS TERMINAL #01") + "\n";
  receipt += line + "\n";
  
  // Order Info
  receipt += justify("DATE:", format(data.date, 'dd/MM/yyyy HH:mm')) + "\n";
  receipt += justify("ORDER ID:", data.orderId.slice(-8).toUpperCase()) + "\n";
  receipt += justify("CASHIER:", data.cashierName.toUpperCase()) + "\n";
  receipt += justify("TYPE:", data.deliveryType.toUpperCase()) + "\n";
  
  if (data.customerName) {
    receipt += justify("CUSTOMER:", data.customerName.toUpperCase()) + "\n";
  }
  
  receipt += line + "\n";
  receipt += center("ITEMS") + "\n";
  receipt += line + "\n";

  // Items
  data.items.forEach(item => {
    const nameLine = `${item.quantity}x ${item.name}`;
    const priceText = `${(item.price * item.quantity).toFixed(0)} MAD`;
    
    if (nameLine.length + priceText.length + 1 > maxWidth) {
      receipt += nameLine + "\n";
      receipt += " ".repeat(maxWidth - priceText.length) + priceText + "\n";
    } else {
      receipt += justify(nameLine, priceText) + "\n";
    }
    
    if (item.customization) {
      receipt += `  * ${item.customization}\n`;
    }
  });

  // Footer
  receipt += line + "\n";
  receipt += justify("TOTAL:", `${data.total.toFixed(0)} MAD`) + "\n";
  receipt += justify("PAYMENT:", data.paymentMethod.toUpperCase()) + "\n";
  receipt += doubleLine + "\n";
  receipt += center("THANK YOU FOR YOUR VISIT") + "\n";
  receipt += center("CAPPUCCINO7 - EST. 2024") + "\n";
  receipt += "\n\n\n"; // Space for tearing

  return receipt;
}

export function printToThermalPrinter(receipt: string) {
  // In a real browser environment, we'd use the Web Serial API or a hidden iframe
  // For this AI Studio preview, we will simulate by opening a clean window with mono font
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Thermal Receipt</title>
          <style>
            @font-face {
              font-family: 'ReceiptFont';
              src: url('https://fonts.cdnfonts.com/s/16061/Merchant\ Copy.woff') format('woff');
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
          ${receipt}
        </body>
      </html>
    `);
    printWindow.document.close();
  } else {
    // Fallback if popup blocked
    console.log(receipt);
    alert("Receipt generated! Check console (popup was blocked).");
  }
}
