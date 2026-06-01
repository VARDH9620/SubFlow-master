// ============================================================
// SubFlow — Premium Invoice PDF Generator
// Generates highly professional, styled invoice PDFs
// ============================================================

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice, Payment } from '../types';

// Brand colors (RGB tuples)
const PRIMARY: [number, number, number] = [79, 70, 229]; // Indigo 600
const PRIMARY_DARK: [number, number, number] = [49, 46, 129]; // Indigo 900
const DARK: [number, number, number] = [15, 23, 42]; // Slate 900
const GRAY: [number, number, number] = [100, 116, 139]; // Slate 500
const LIGHT_GRAY: [number, number, number] = [241, 245, 249]; // Slate 100
const WHITE: [number, number, number] = [255, 255, 255];
const BORDER: [number, number, number] = [226, 232, 240]; // Slate 200

export function generateInvoicePDF(
  invoice: Invoice,
  payment?: Payment | null,
  options?: { mode?: 'invoice' | 'receipt' }
) {
  const mode = options?.mode || (invoice.status === 'paid' ? 'receipt' : 'invoice');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ---- Helper functions ----
  const addText = (text: string, x: number, yPos: number, opts?: { size?: number; color?: number[]; style?: 'normal' | 'bold' | 'italic'; align?: 'left' | 'center' | 'right' }) => {
    const size = opts?.size || 10;
    const color = opts?.color || DARK;
    const style = opts?.style || 'normal';
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    if (style === 'bold') {
      doc.setFont('helvetica', 'bold');
    } else if (style === 'italic') {
      doc.setFont('helvetica', 'italic');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    const align = opts?.align || 'left';
    if (align === 'center') {
      doc.text(text, pageWidth / 2, yPos, { align: 'center' });
    } else if (align === 'right') {
      doc.text(text, x, yPos, { align: 'right' });
    } else {
      doc.text(text, x, yPos);
    }
  };

  const drawRect = (x: number, yPos: number, w: number, h: number, fillColor: number[]) => {
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    doc.rect(x, yPos, w, h, 'F');
  };

  // Styled modern logo (Geometric intersecting shapes)
  const drawPremiumLogo = (x: number, yPos: number) => {
    // Left shape
    doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.roundedRect(x, yPos, 8, 12, 3, 3, 'F');
    // Right shape overlay
    doc.setFillColor(PRIMARY_DARK[0], PRIMARY_DARK[1], PRIMARY_DARK[2]);
    doc.roundedRect(x + 5, yPos + 4, 8, 12, 3, 3, 'F');
    
    // Add text next to it
    addText('SubFlow', x + 18, yPos + 10, { size: 22, style: 'bold', color: DARK });
    addText('INC.', x + 53, yPos + 10, { size: 10, style: 'bold', color: PRIMARY });
  };

  // Modern pill status
  const drawStatusBadge = (status: string, x: number, yPos: number) => {
    let bg: [number, number, number] = [241, 245, 249];
    let fg: [number, number, number] = [71, 85, 105];
    
    if (status === 'paid') {
      bg = [220, 252, 231];
      fg = [21, 128, 61];
    } else if (status === 'pending') {
      bg = [254, 243, 199];
      fg = [180, 83, 9];
    } else if (status === 'refunded') {
      bg = [243, 232, 255];
      fg = [109, 40, 217];
    } else if (status === 'failed') {
      bg = [254, 226, 226];
      fg = [185, 28, 28];
    }

    const label = status.toUpperCase();
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const textWidth = doc.getTextWidth(label);
    const pillW = textWidth + 12;
    const pillH = 7;
    
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.roundedRect(x - pillW, yPos - 5, pillW, pillH, 3.5, 3.5, 'F');
    
    doc.setTextColor(fg[0], fg[1], fg[2]);
    doc.text(label, x - pillW + 6, yPos - 0.2);
  };

  // ================================================================
  // BACKGROUND ACCENT
  // ================================================================
  // Very light geometric shape in background for premium feel
  doc.setFillColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
  doc.rect(pageWidth - 80, 0, 80, pageHeight, 'F');

  // ================================================================
  // HEADER
  // ================================================================

  y = 25;
  drawPremiumLogo(margin, y);
  
  const titleText = mode === 'receipt' ? 'RECEIPT' : 'INVOICE';
  addText(titleText, pageWidth - margin, y + 5, { size: 28, style: 'bold', color: DARK, align: 'right' });
  drawStatusBadge(invoice.status, pageWidth - margin, y + 15);

  y += 20;

  // Company Info vs Customer Info
  const col1 = margin;
  const col2 = pageWidth / 2;

  addText('FROM:', col1, y, { size: 8, style: 'bold', color: GRAY });
  addText('BILL TO:', col2 - 10, y, { size: 8, style: 'bold', color: GRAY });
  
  y += 5;
  addText('SubFlow Inc.', col1, y, { size: 10, style: 'bold' });
  addText(payment?.card_holder || invoice.user_email?.split('@')[0] || 'Valued Customer', col2 - 10, y, { size: 10, style: 'bold' });
  
  y += 5;
  addText('123 Innovation Drive', col1, y, { size: 9, color: GRAY });
  addText(invoice.user_email || 'customer@email.com', col2 - 10, y, { size: 9, color: GRAY });
  
  y += 5;
  addText('San Francisco, CA 94107', col1, y, { size: 9, color: GRAY });
  if (payment?.billing_address) {
    addText(payment.billing_address, col2 - 10, y, { size: 9, color: GRAY });
    y += 5;
    addText(`${payment.billing_city}, ${payment.billing_state} ${payment.billing_zip}`, col2 - 10, y, { size: 9, color: GRAY });
  }

  y += 15;

  // ================================================================
  // INVOICE METADATA STRIP
  // ================================================================
  
  const stripH = 20;
  drawRect(margin, y, contentWidth, stripH, [248, 250, 252]);
  doc.setDrawColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.setLineWidth(1);
  doc.line(margin, y, margin, y + stripH);

  const mData = [
    { label: 'Invoice No.', val: invoice.invoice_number?.slice(0, 10) || 'INV-000000' },
    { label: 'Issue Date', val: formatDate(invoice.created_at) },
    { label: 'Due Date', val: invoice.due_date },
    { label: 'Total Due', val: `$${invoice.total.toFixed(2)}` }
  ];

  let mx = margin + 8;
  mData.forEach((item, idx) => {
    addText(item.label, mx, y + 8, { size: 8, color: GRAY });
    addText(item.val, mx, y + 14, { size: 10, style: 'bold', color: idx === 3 ? PRIMARY : DARK });
    mx += contentWidth / 4.5;
  });

  y += stripH + 15;

  // ================================================================
  // TABLE
  // ================================================================

  const isAnnual = invoice.plan_name?.toLowerCase().includes('annual') || invoice.plan_name?.toLowerCase().includes('yr');
  const billingPeriod = isAnnual ? 'Annual' : 'Monthly';

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 10,
      textColor: DARK,
      lineColor: WHITE,
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: PRIMARY,
      textColor: WHITE,
      fontStyle: 'bold',
      cellPadding: { top: 6, bottom: 6, left: 4, right: 4 },
    },
    bodyStyles: {
      fillColor: [248, 250, 252],
      cellPadding: { top: 6, bottom: 6, left: 4, right: 4 },
    },
    alternateRowStyles: {
      fillColor: WHITE,
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.45 },
      1: { cellWidth: contentWidth * 0.2, halign: 'center' },
      2: { cellWidth: contentWidth * 0.15, halign: 'center' },
      3: { cellWidth: contentWidth * 0.2, halign: 'right' },
    },
    head: [['Description', 'Billing Period', 'Qty', 'Amount']],
    body: [
      [
        `${invoice.service_name || 'Service'} — ${invoice.plan_name || 'Plan'}`,
        billingPeriod,
        '1',
        `$${invoice.amount.toFixed(2)}`,
      ],
    ],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 15;

  // ================================================================
  // TOTALS
  // ================================================================

  const totalsX = pageWidth - margin - 60;
  const valueX = pageWidth - margin;

  const totals = [
    ['Subtotal', `$${invoice.amount.toFixed(2)}`],
    [`Tax (18%)`, `$${invoice.tax.toFixed(2)}`],
    ...(invoice.discount > 0 ? [['Discount', `-$${invoice.discount.toFixed(2)}`]] : []),
  ];

  totals.forEach(([label, value]) => {
    addText(label, totalsX, y, { size: 10, color: GRAY, align: 'right' });
    addText(value, valueX, y, { size: 10, align: 'right' });
    y += 7;
  });

  y += 2;
  const totalBoxW = 75;
  const totalBoxH = 12;
  const totalBoxX = pageWidth - margin - totalBoxW;
  
  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.roundedRect(totalBoxX, y - 2, totalBoxW, totalBoxH, 2, 2, 'F');

  const totalLabel = invoice.status === 'paid' ? 'TOTAL PAID' : 'TOTAL DUE';
  addText(totalLabel, totalBoxX + 5, y + 5.5, { size: 11, style: 'bold', color: WHITE });
  addText(`$${invoice.total.toFixed(2)}`, valueX - 5, y + 5.5, { size: 12, style: 'bold', color: WHITE, align: 'right' });
  
  y += totalBoxH + 15;

  // ================================================================
  // PAYMENT CONFIRMATION (If Receipt)
  // ================================================================

  if (mode === 'receipt' && payment) {
    addText('PAYMENT DETAILS', margin, y, { size: 10, style: 'bold', color: PRIMARY });
    y += 6;
    
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, y, contentWidth + margin, y);
    y += 6;

    const pmMethod = payment.method_type === 'card' && payment.card_brand
      ? `${capitalize(payment.card_brand)} Card (•••• ${payment.card_last4})`
      : payment.method;

    addText(`Transaction ID: ${payment.transaction_id}`, margin, y, { size: 9, color: GRAY }); y += 5;
    addText(`Payment Method: ${pmMethod}`, margin, y, { size: 9, color: GRAY }); y += 5;
    addText(`Date Paid: ${formatDate(payment.paid_at)}`, margin, y, { size: 9, color: GRAY }); y += 10;
  }

  // ================================================================
  // FOOTER & TERMS
  // ================================================================

  const footerY = pageHeight - 35;
  
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, contentWidth + margin, footerY);

  addText('TERMS & CONDITIONS', margin, footerY + 8, { size: 8, style: 'bold', color: DARK });
  addText('Payment is due within 7 days. Late payments subject to 1.5% interest. All amounts in USD.', margin, footerY + 13, { size: 8, color: GRAY });
  
  addText('support@subflow.io | +1 (800) 555-0199 | www.subflow.io', pageWidth / 2, footerY + 22, { size: 8, color: PRIMARY, align: 'center' });

  // ================================================================
  // SAVE
  // ================================================================

  const filename = mode === 'receipt'
    ? `SubFlow_Receipt_${invoice.invoice_number?.slice(0, 16) || invoice.id.slice(0, 8)}.pdf`
    : `SubFlow_Invoice_${invoice.invoice_number?.slice(0, 16) || invoice.id.slice(0, 8)}.pdf`;

  doc.save(filename);

  return filename;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function capitalize(str: string | null | undefined): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}