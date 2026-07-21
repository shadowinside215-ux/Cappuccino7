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
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Thermal Receipt</title>
          <style>
            @media print {
              @page {
                margin: 0;
                size: 80mm auto;
              }
              html, body {
                width: 80mm;
                margin: 0;
                padding: 0;
              }
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
              font-family: 'Courier New', Courier, monospace;
              text-align: left;
            }
            .receipt-container {
              width: 72mm; /* standard printable area for 80mm paper */
              margin: 0 auto;
              padding: 4mm 0;
              font-size: 14px; /* adjusted to fit ~32 columns in 72mm */
              line-height: 1.2;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">${receipt}</div>
        </body>
      </html>
    `);
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
    alert("Receipt generated! Check console. Please allow popups for printing.");
  }
}
