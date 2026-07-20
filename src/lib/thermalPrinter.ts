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
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(`
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
          ${receipt}
        </body>
      </html>
    `);
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
}
