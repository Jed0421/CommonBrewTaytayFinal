import React, { useState, useEffect } from 'react';
import { Printer, Download, Copy, Check, X, Coffee } from 'lucide-react';
import { getAddonPrice } from '../data/commonbrewData';

export interface ReceiptItem {
  name: string;
  qty: number;
  price?: number;
  originalPrice?: number;
  upsizePrice?: number | null;
  isUpsize?: boolean;
  addons?: string[];
}

export interface ThermalReceiptData {
  ref: string;
  date: string;
  items: ReceiptItem[];
  totalAmount: number;
  paymentMethod: string;
  cashTendered: number;
  changeAmount: number;
  cashierName?: string;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}

interface ThermalReceiptModalProps {
  receipt: ThermalReceiptData;
  onClose: () => void;
  autoPrint?: boolean;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  receipt,
  onClose,
  autoPrint = true
}) => {
  const [copied, setCopied] = useState(false);
  const [printStatus, setPrintStatus] = useState<string>('Receipt Generated');
  const [paperSize, setPaperSize] = useState<'80mm' | '58mm' | 'letter'>('80mm');

  const storeName = receipt.storeName || 'COMMONBREW COFFEE TAYTAY';
  const storeAddress = receipt.storeAddress || 'Manila East Road, Brgy. San Juan, Taytay, Rizal';
  const storePhone = receipt.storePhone || '0947-496-0778';
  const cashierName = receipt.cashierName || 'Maria Cashier';

  // Tax calculations (Philippine 12% EVAT standard)
  const vatableSales = receipt.totalAmount / 1.12;
  const vatAmount = receipt.totalAmount - vatableSales;

  // Calculate unit price including addons & upsize for item
  const calculateItemPrice = (item: ReceiptItem) => {
    let base = item.isUpsize && item.upsizePrice ? item.upsizePrice : (item.originalPrice || item.price || 0);
    if (item.addons && Array.isArray(item.addons)) {
      item.addons.forEach(addon => {
        base += getAddonPrice(addon);
      });
    }
    return base;
  };

  // Generate plain text receipt for copy and txt download
  const generatePlainTextReceipt = () => {
    const line = '='.repeat(40);
    const dash = '-'.repeat(40);

    let text = '';
    text += `${line}\n`;
    text += `       ${storeName}\n`;
    text += `   Handcrafted Drinks & Fresh Brews\n`;
    text += ` ${storeAddress}\n`;
    text += `         Tel: ${storePhone}\n`;
    text += `      VAT Reg TIN: 432-871-902-00000\n`;
    text += `      POS Terminal ID: POS-01 (Taytay)\n`;
    text += `${line}\n`;
    text += `OFFICIAL RECEIPT: ${receipt.ref}\n`;
    text += `DATE: ${receipt.date}\n`;
    text += `CASHIER: ${cashierName}\n`;
    text += `PAYMENT: ${receipt.paymentMethod.toUpperCase()}\n`;
    text += `${dash}\n`;
    text += `QTY  ITEM DESCRIPTION             AMOUNT\n`;
    text += `${dash}\n`;

    receipt.items.forEach(it => {
      const unitP = calculateItemPrice(it);
      const lineTotal = unitP * it.qty;
      const itemName = `${it.qty}x ${it.name}${it.isUpsize ? ' (22oz)' : ''}`;
      const priceStr = `₱${lineTotal.toFixed(2)}`;
      const padding = Math.max(1, 38 - itemName.length - priceStr.length);
      text += `${itemName}${' '.repeat(padding)}${priceStr}\n`;

      if (it.addons && it.addons.length > 0) {
        it.addons.forEach(add => {
          const addPrice = getAddonPrice(add);
          const addStr = `   + ${add} (+₱${addPrice.toFixed(2)})`;
          text += `${addStr}\n`;
        });
      }
    });

    text += `${dash}\n`;
    text += `Subtotal:                          ₱${receipt.totalAmount.toFixed(2)}\n`;
    text += `Vatable Sales (12%):               ₱${vatableSales.toFixed(2)}\n`;
    text += `12% EVAT:                          ₱${vatAmount.toFixed(2)}\n`;
    text += `VAT-Exempt Sales:                  ₱0.00\n`;
    text += `${line}\n`;
    text += `TOTAL AMOUNT DUE:                  ₱${receipt.totalAmount.toFixed(2)}\n`;
    text += `${line}\n`;
    text += `Payment Method:                    ${receipt.paymentMethod}\n`;
    text += `Cash Tendered:                     ₱${receipt.cashTendered.toFixed(2)}\n`;
    text += `Change Due:                        ₱${receipt.changeAmount.toFixed(2)}\n`;
    text += `${dash}\n`;
    text += `Ref: *${receipt.ref}*\n`;
    text += `${line}\n`;
    text += `    THIS SERVES AS YOUR OFFICIAL RECEIPT\n`;
    text += `       Thank you for brewing with us!\n`;
    text += `    Wi-Fi: CommonBrew_Guest | Pass: brewlife\n`;
    text += `${line}\n`;
    return text;
  };

  // Fallback print directly via main window with dynamic page size injection
  const triggerParentPrintFallback = () => {
    let parentStyle = document.getElementById('pos-print-page-style') as HTMLStyleElement;
    if (!parentStyle) {
      parentStyle = document.createElement('style');
      parentStyle.id = 'pos-print-page-style';
      document.head.appendChild(parentStyle);
    }

    const paperWidth = paperSize === '58mm' ? 58 : (paperSize === 'letter' ? 215.9 : 80);
    const receiptEl = document.getElementById('printable-pos-receipt');
    const scrollHeightPx = receiptEl ? receiptEl.scrollHeight : 500;
    const measuredHeightMm = Math.max(90, Math.ceil(scrollHeightPx * 0.264583) + 4);

    if (paperSize === 'letter') {
      parentStyle.innerHTML = `
        @media print {
          @page {
            size: letter portrait !important;
            margin: 0.5in !important;
          }
          #printable-pos-receipt {
            margin: 0 auto !important;
            width: 80mm !important;
            max-width: 80mm !important;
          }
        }
      `;
    } else {
      parentStyle.innerHTML = `
        @media print {
          @page {
            size: ${paperWidth}mm ${measuredHeightMm}mm !important;
            margin: 0mm !important;
          }
          html, body {
            width: ${paperWidth}mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          #printable-pos-receipt {
            width: ${paperWidth}mm !important;
            max-width: ${paperWidth}mm !important;
            margin: 0 !important;
            padding: 4mm ${paperSize === '58mm' ? '2.5mm' : '4mm'} !important;
            box-sizing: border-box !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `;
    }

    window.print();
    setPrintStatus('Receipt sent to printer!');
  };

  // Trigger print via dedicated hidden thermal iframe with dynamic auto-sizing
  const executePrint = () => {
    setPrintStatus('Sending to printer...');
    let iframe = document.getElementById('pos-thermal-print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'pos-thermal-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.zIndex = '-99999';
      document.body.appendChild(iframe);
    }

    const paperWidth = paperSize === '58mm' ? 58 : (paperSize === 'letter' ? 215.9 : 80);
    const receiptEl = document.getElementById('printable-pos-receipt');
    const scrollHeightPx = receiptEl ? receiptEl.scrollHeight : 520;
    const initialHeightMm = Math.max(90, Math.ceil(scrollHeightPx * 0.264583) + 4);

    const itemsHtml = receipt.items.map(it => {
      const unitP = calculateItemPrice(it);
      const lineTotal = unitP * it.qty;
      const addonsHtml = it.addons && it.addons.length > 0
        ? it.addons.map(a => `<div style="font-size: ${paperSize === '58mm' ? '9px' : '10px'}; color: #444; padding-left: 6px;">+ ${a} (+₱${getAddonPrice(a).toFixed(2)})</div>`).join('')
        : '';
      return `
        <div style="margin-bottom: 4px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span style="flex: 1; padding-right: 4px;">${it.qty}x ${it.name}${it.isUpsize ? ' (22oz)' : ''}</span>
            <span>₱${lineTotal.toFixed(2)}</span>
          </div>
          ${addonsHtml}
        </div>
      `;
    }).join('');

    const printDocContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${receipt.ref}</title>
  <style id="dynamic-page-style">
    @page {
      size: ${paperSize === 'letter' ? 'letter portrait' : `${paperWidth}mm ${initialHeightMm}mm`};
      margin: 0mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      width: ${paperSize === 'letter' ? '100%' : `${paperWidth}mm`} !important;
    }
    #receipt-container {
      width: ${paperSize === 'letter' ? '80mm' : `${paperWidth}mm`};
      max-width: 100%;
      margin: 0 auto;
      padding: 3mm ${paperSize === '58mm' ? '2.5mm' : '4mm'} 6mm ${paperSize === '58mm' ? '2.5mm' : '4mm'};
      font-family: 'Courier New', Courier, monospace;
      font-size: ${paperSize === '58mm' ? '10px' : '11.5px'};
      line-height: 1.28;
      color: #000000;
      background: #ffffff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .divider-dash { border-top: 1px dashed #000; margin: 5px 0; }
    .divider-solid { border-top: 2px solid #000; margin: 5px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .barcode-box { text-align: center; margin: 8px 0 4px; }
  </style>
</head>
<body>
  <div id="receipt-container">
    <div class="text-center bold" style="font-size: ${paperSize === '58mm' ? '12px' : '13.5px'}; margin-bottom: 2px;">${storeName}</div>
    <div class="text-center" style="font-size: ${paperSize === '58mm' ? '9.5px' : '11px'};">Handcrafted Drinks & Fresh Brews</div>
    <div class="text-center" style="font-size: ${paperSize === '58mm' ? '9px' : '10px'};">${storeAddress}</div>
    <div class="text-center" style="font-size: ${paperSize === '58mm' ? '9px' : '10px'};">Tel: ${storePhone}</div>
    <div class="text-center" style="font-size: ${paperSize === '58mm' ? '9px' : '10px'};">VAT Reg TIN: 432-871-902-00000</div>
    <div class="text-center" style="font-size: ${paperSize === '58mm' ? '9px' : '10px'};">POS Terminal: POS-01 (Taytay)</div>

    <div class="divider-solid"></div>

    <div class="row"><span>OR No:</span><span class="bold">${receipt.ref}</span></div>
    <div class="row"><span>Date:</span><span>${receipt.date}</span></div>
    <div class="row"><span>Cashier:</span><span>${cashierName}</span></div>
    <div class="row"><span>Payment:</span><span class="bold">${receipt.paymentMethod}</span></div>

    <div class="divider-dash"></div>
    <div style="font-weight: bold; margin-bottom: 3px; display: flex; justify-content: space-between;">
      <span>QTY / ITEM</span>
      <span>TOTAL</span>
    </div>
    <div class="divider-dash"></div>

    ${itemsHtml}

    <div class="divider-dash"></div>

    <div class="row"><span>Subtotal:</span><span>₱${receipt.totalAmount.toFixed(2)}</span></div>
    <div class="row"><span>Vatable Sales (12%):</span><span>₱${vatableSales.toFixed(2)}</span></div>
    <div class="row"><span>12% EVAT:</span><span>₱${vatAmount.toFixed(2)}</span></div>
    <div class="row"><span>VAT-Exempt:</span><span>₱0.00</span></div>

    <div class="divider-solid"></div>

    <div class="row bold" style="font-size: ${paperSize === '58mm' ? '12px' : '13.5px'};">
      <span>TOTAL AMOUNT:</span>
      <span>₱${receipt.totalAmount.toFixed(2)}</span>
    </div>

    <div class="divider-solid"></div>

    <div class="row"><span>Payment Method:</span><span>${receipt.paymentMethod}</span></div>
    <div class="row"><span>Cash Tendered:</span><span>₱${receipt.cashTendered.toFixed(2)}</span></div>
    <div class="row bold"><span>Change:</span><span>₱${receipt.changeAmount.toFixed(2)}</span></div>

    <div class="divider-dash"></div>

    <!-- Barcode Representation -->
    <div class="barcode-box">
      <svg width="${paperSize === '58mm' ? '140' : '180'}" height="32" viewBox="0 0 180 36" style="display: block; margin: 0 auto;">
        ${generateBarcodeLines(receipt.ref)}
      </svg>
      <div style="font-size: 9.5px; letter-spacing: 1.5px; margin-top: 2px;">*${receipt.ref}*</div>
    </div>

    <div class="divider-solid"></div>

    <div class="text-center bold" style="font-size: 9.5px;">THIS SERVES AS YOUR OFFICIAL RECEIPT</div>
    <div class="text-center" style="font-size: 10.5px; margin-top: 3px;">Thank you for brewing with us! ☕</div>
    <div class="text-center" style="font-size: 8.5px; color: #444; margin-top: 2px;">Wi-Fi: CommonBrew_Guest | Pass: brewlife</div>
    <div style="height: 10px;"></div>
  </div>
</body>
</html>
    `;

    const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(printDocContent);
      frameDoc.close();

      setTimeout(() => {
        try {
          const doc = iframe.contentWindow?.document || iframe.contentDocument;
          const container = doc?.getElementById('receipt-container');
          if (container && paperSize !== 'letter') {
            const actualPx = container.scrollHeight || container.offsetHeight;
            const actualMm = Math.max(85, Math.ceil(actualPx * 0.264583) + 4);
            const styleEl = doc?.getElementById('dynamic-page-style');
            if (styleEl) {
              styleEl.innerHTML = `@page { size: ${paperWidth}mm ${actualMm}mm; margin: 0mm; } html, body { margin: 0; padding: 0; width: ${paperWidth}mm; }`;
            }
          }

          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setPrintStatus('Receipt sent to printer!');
        } catch (e) {
          console.warn('Iframe print restricted, falling back to window.print()', e);
          triggerParentPrintFallback();
        }
      }, 250);
    } else {
      triggerParentPrintFallback();
    }
  };

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        executePrint();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, paperSize]);

  const handleDownloadTxt = () => {
    const content = generatePlainTextReceipt();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CommonBrew-Receipt-${receipt.ref}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyText = () => {
    const content = generatePlainTextReceipt();
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1300,
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        maxWidth: '430px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '94vh',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header Bar */}
        <div style={{
          padding: '1rem 1.25rem',
          background: '#2c1810',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Printer size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Official POS Receipt
              </h3>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#fed7aa', fontWeight: 600 }}>
                {printStatus} • Ref: {receipt.ref}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Action Bar */}
        <div style={{
          padding: '0.65rem 1rem',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={executePrint}
            style={{
              flex: '1 1 auto',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.75rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: '#ea580c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(234, 88, 12, 0.2)'
            }}
          >
            <Printer size={14} /> Print Receipt
          </button>

          <button
            onClick={handleDownloadTxt}
            style={{
              flex: '1 1 auto',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.75rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <Download size={14} /> Save TXT
          </button>

          <button
            onClick={handleCopyText}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.75rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              background: copied ? '#ecfdf5' : '#ffffff',
              color: copied ? '#059669' : '#334155',
              border: copied ? '1px solid #6ee7b7' : '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Paper Size & Auto-Fit Options Bar */}
        <div style={{
          padding: '0.45rem 1rem',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.4rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#475569', fontWeight: 700 }}>
            <span>Paper Format:</span>
            <span style={{ color: '#ea580c', background: '#fff7ed', padding: '1px 6px', borderRadius: '4px', border: '1px solid #fed7aa', fontSize: '0.67rem' }}>
              Auto-Sized (No Excess Margin)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              type="button"
              onClick={() => setPaperSize('80mm')}
              style={{
                padding: '0.24rem 0.55rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: paperSize === '80mm' ? '1.5px solid #ea580c' : '1px solid #cbd5e1',
                background: paperSize === '80mm' ? '#ea580c' : '#ffffff',
                color: paperSize === '80mm' ? '#ffffff' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🧾 80mm Roll (Auto-Fit)
            </button>
            <button
              type="button"
              onClick={() => setPaperSize('58mm')}
              style={{
                padding: '0.24rem 0.55rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: paperSize === '58mm' ? '1.5px solid #ea580c' : '1px solid #cbd5e1',
                background: paperSize === '58mm' ? '#ea580c' : '#ffffff',
                color: paperSize === '58mm' ? '#ffffff' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🧾 58mm Roll
            </button>
            <button
              type="button"
              onClick={() => setPaperSize('letter')}
              style={{
                padding: '0.24rem 0.55rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: paperSize === 'letter' ? '1.5px solid #ea580c' : '1px solid #cbd5e1',
                background: paperSize === 'letter' ? '#ea580c' : '#ffffff',
                color: paperSize === 'letter' ? '#ffffff' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              📄 Letter / A4
            </button>
          </div>
        </div>

        {/* Realistic Thermal Paper Container */}
        <div style={{
          padding: '1.25rem',
          background: '#f1f5f9',
          overflowY: 'auto',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div
            id="printable-pos-receipt"
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: paperSize === '58mm' ? '260px' : (paperSize === 'letter' ? '380px' : '330px'),
              padding: '1.25rem 1rem',
              fontFamily: "'Courier New', Courier, Monaco, monospace",
              color: '#0f172a',
              fontSize: paperSize === '58mm' ? '0.72rem' : '0.8rem',
              lineHeight: 1.4,
              boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
              borderRadius: '4px',
              border: '1px solid #e2e8f0',
              position: 'relative'
            }}
          >
            {/* Top Serrated Edge Graphic */}
            <div style={{
              position: 'absolute',
              top: '-6px',
              left: 0,
              right: 0,
              height: '6px',
              backgroundImage: 'radial-gradient(circle, transparent, transparent 50%, #fff 50%, #fff 100%)',
              backgroundSize: '12px 12px',
              display: 'none' // fallback
            }} />

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '2px' }}>
                <Coffee size={16} color="#ea580c" />
                <span style={{ fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.04em' }}>{storeName}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Handcrafted Drinks & Fresh Brews</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>{storeAddress}</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Tel: {storePhone}</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>VAT Reg TIN: 432-871-902-00000</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>MIN: 2409240832101 | POS Terminal #01</div>
            </div>

            <div style={{ borderTop: '2px solid #0f172a', margin: '0.65rem 0' }} />

            {/* Transaction Meta */}
            <div style={{ fontSize: '0.74rem', margin: '0.5rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>OFFICIAL RECEIPT:</span>
                <span style={{ fontWeight: 800 }}>{receipt.ref}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>DATE & TIME:</span>
                <span>{receipt.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>CASHIER:</span>
                <span>{cashierName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>PAYMENT METHOD:</span>
                <span style={{ fontWeight: 700 }}>{receipt.paymentMethod.toUpperCase()}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #94a3b8', margin: '0.65rem 0' }} />

            {/* Items Column Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.72rem', color: '#475569', marginBottom: '0.35rem' }}>
              <span>QTY / ITEM DESCRIPTION</span>
              <span>AMOUNT</span>
            </div>
            <div style={{ borderTop: '1px dashed #cbd5e1', marginBottom: '0.5rem' }} />

            {/* Line Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {receipt.items.map((it, idx) => {
                const unitP = calculateItemPrice(it);
                const lineTotal = unitP * it.qty;
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 700, flex: 1, paddingRight: '0.5rem' }}>
                        {it.qty}x {it.name}
                        {it.isUpsize && <span style={{ color: '#ea580c', marginLeft: '4px', fontSize: '0.7rem' }}>(22oz)</span>}
                      </span>
                      <span style={{ fontWeight: 700 }}>₱{lineTotal.toFixed(2)}</span>
                    </div>

                    {/* Add-ons List */}
                    {it.addons && it.addons.length > 0 && (
                      <div style={{ paddingLeft: '0.75rem', marginTop: '1px', fontSize: '0.7rem', color: '#475569' }}>
                        {it.addons.map((addon, aIdx) => (
                          <div key={aIdx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>+ {addon}</span>
                            <span>+₱{getAddonPrice(addon).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px dashed #94a3b8', margin: '0.65rem 0' }} />

            {/* Financial Breakdown */}
            <div style={{ fontSize: '0.74rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Subtotal:</span>
                <span>₱{receipt.totalAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Vatable Sales (12%):</span>
                <span>₱{vatableSales.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>12% EVAT:</span>
                <span>₱{vatAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>VAT-Exempt Sales:</span>
                <span>₱0.00</span>
              </div>
            </div>

            <div style={{ borderTop: '2px solid #0f172a', margin: '0.65rem 0' }} />

            {/* Total Amount Due */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', fontWeight: 900 }}>
              <span>TOTAL AMOUNT:</span>
              <span>₱{receipt.totalAmount.toFixed(2)}</span>
            </div>

            <div style={{ borderTop: '2px solid #0f172a', margin: '0.65rem 0' }} />

            {/* Payment & Change */}
            <div style={{ fontSize: '0.74rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Payment Mode:</span>
                <span style={{ fontWeight: 700 }}>{receipt.paymentMethod}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Cash Tendered:</span>
                <span>₱{receipt.cashTendered.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                <span>Change:</span>
                <span style={{ color: '#15803d' }}>₱{receipt.changeAmount.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #94a3b8', margin: '0.75rem 0 0.5rem' }} />

            {/* Barcode Graphic */}
            <div style={{ textAlign: 'center', margin: '0.6rem 0' }}>
              <svg width="180" height="36" viewBox="0 0 180 36" style={{ display: 'block', margin: '0 auto' }}>
                {generateBarcodeData(receipt.ref).map((b, i) => (
                  <rect key={i} x={b.x} y="2" width={b.width} height="32" fill="#000" />
                ))}
              </svg>
              <div style={{ fontSize: '0.68rem', letterSpacing: '2px', color: '#475569', marginTop: '2px' }}>
                *{receipt.ref}*
              </div>
            </div>

            <div style={{ borderTop: '2px solid #0f172a', margin: '0.65rem 0' }} />

            {/* Receipt Footer */}
            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#475569' }}>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                THIS SERVES AS YOUR OFFICIAL RECEIPT
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', margin: '4px 0' }}>
                <span>Thank you for brewing with us!</span>
                <Coffee size={12} color="#ea580c" />
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                Free Wi-Fi: CommonBrew_Guest • Pass: brewlife2026
              </div>
              <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '2px' }}>
                Please check your order and change before leaving counter.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Done button */}
        <div style={{
          padding: '0.75rem 1.25rem',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.55rem 1.5rem',
              background: '#2c1810',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Done / Next Order
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper to generate barcode line positions
function generateBarcodeData(ref: string): { x: number; width: number }[] {
  const bars: { x: number; width: number }[] = [];
  let x = 8;
  const hash = ref.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  for (let i = 0; i < 38; i++) {
    const isThick = ((hash + i * 7) % 3 === 0);
    const width = isThick ? 3 : 1.5;
    bars.push({ x, width });
    x += width + (((hash + i * 11) % 2 === 0) ? 2 : 1.5);
    if (x > 170) break;
  }
  return bars;
}

function generateBarcodeLines(ref: string): string {
  return generateBarcodeData(ref)
    .map(b => `<rect x="${b.x}" y="2" width="${b.width}" height="32" fill="#000" />`)
    .join('');
}

