import type { ContactInfo } from "@/hooks/useContact";
import type { PaymentMethod, Receipt } from "@/hooks/useReceipts";
import { receiptGrandTotal, receiptSubtotal, receiptTax } from "@/hooks/useReceipts";
import { printHtmlDocument } from "@/lib/printDocument";
import logoAsset from "@/assets/logo.png";

const money = (n: number) =>
  `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Absolute URL for the site logo (works in preview). */
export const receiptLogoUrl =
  typeof window !== "undefined"
    ? new URL(logoAsset, window.location.origin).href
    : logoAsset;

/** Embed logo as data URL so print/PDF still shows it in a blank window. */
async function logoAsDataUrl(): Promise<string> {
  try {
    const res = await fetch(logoAsset);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return receiptLogoUrl;
  }
}

export type ReceiptPrintLabels = {
  companyName: string;
  invoice: string;
  invoiceTo: string;
  invoiceDate: string;
  description: string;
  price: string;
  qty: string;
  total: string;
  subtotal: string;
  tax: string;
  grandTotal: string;
  carInfo: string;
  year: string;
  make: string;
  model: string;
  paymentInfo: string;
  bankName: string;
  accountNo: string;
  contactUs: string;
  paymentMethods: Record<PaymentMethod, string>;
  /** legacy keys still used by callers */
  title: string;
  receiptNo: string;
  date: string;
  customer: string;
  phone: string;
  payment: string;
  item: string;
  code: string;
  amount: string;
  notes: string;
  customerSign: string;
  companySign: string;
  thanks: string;
};

const INVOICE_CSS = `
  @page {
    size: A4 portrait;
    margin: 12mm;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    background: #fff;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  body {
    font-family: Arial, Helvetica, "Segoe UI", sans-serif;
    color: #1a1a1a;
    font-size: 12px;
    line-height: 1.4;
  }
  .invoice {
    width: 100%;
    max-width: 190mm;
    margin: 0 auto;
    color: #1a1a1a;
  }
  .blue { color: #2b579a; }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 16px;
  }
  .company {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin: 0 0 2px;
  }
  .doc-type {
    font-size: 16px;
    font-weight: 700;
    color: #2b579a;
    text-transform: uppercase;
    margin: 0 0 6px;
  }
  .company-meta {
    font-size: 11px;
    color: #444;
  }
  .logo-box {
    text-align: center;
    min-width: 72px;
  }
  .logo-box img.logo {
    width: 64px;
    height: 64px;
    object-fit: contain;
    display: block;
    margin: 0 auto 2px;
    border-radius: 8px;
  }
  .logo-mark {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
  }
  .party {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 14px;
  }
  .party-label {
    color: #2b579a;
    font-weight: 700;
    font-size: 12px;
  }
  .party-value {
    font-size: 15px;
    font-weight: 600;
    font-style: italic;
    margin-top: 2px;
  }
  .party-date { font-size: 12px; font-weight: 600; margin-top: 2px; }
  .items {
    background: #ececec;
    padding: 0 0 10px;
    margin-bottom: 0;
  }
  .items table {
    width: 100%;
    border-collapse: collapse;
  }
  .items thead th {
    background: #cfcfcf;
    text-align: left;
    padding: 8px 10px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    border: none;
  }
  .items thead th.right,
  .items td.right { text-align: right; }
  .items tbody td {
    padding: 9px 10px;
    border-bottom: 1px solid #d0d0d0;
    font-size: 12px;
    background: #ececec;
  }
  .items tbody tr:last-child td { border-bottom: none; }
  .totals {
    background: #ececec;
    padding: 2px 10px 12px;
    text-align: right;
  }
  .totals-row {
    display: flex;
    justify-content: flex-end;
    gap: 24px;
    padding: 2px 0;
    font-size: 12px;
  }
  .totals-row.grand {
    font-size: 14px;
    font-weight: 800;
    color: #2b579a;
    margin-top: 2px;
  }
  .car-bar {
    background: #111;
    color: #fff;
    text-align: center;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 7px 10px;
    margin-top: 0;
  }
  .car-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    background: #e8e8e8;
    padding: 10px 12px;
    margin-bottom: 14px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .bottom {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 12px;
    align-items: stretch;
    min-height: 110px;
  }
  .pay-box { padding: 6px 2px; }
  .pay-title {
    color: #2b579a;
    font-weight: 800;
    font-size: 12px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .pay-line { font-size: 12px; margin: 3px 0; }
  .contact-box {
    background: #c5d4ea;
    padding: 14px 12px;
    text-align: center;
  }
  .contact-inner { position: relative; z-index: 1; }
  .contact-brand {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .contact-cta {
    color: #2b579a;
    font-weight: 800;
    font-size: 12px;
    margin: 4px 0;
    text-transform: uppercase;
  }
  .contact-phone {
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.02em;
  }
  @media print {
    html, body {
      width: 210mm;
      background: #fff !important;
    }
    .invoice {
      max-width: none;
      width: 100%;
    }
    .contact-box, .items, .items thead th, .items tbody td, .totals, .car-bar, .car-grid {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`;

const carSvgFallback = `
<svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M18 38c2-10 10-18 22-20h28c8 0 16 4 22 12l10 8h8v8H18v-8z" stroke="#2b579a" stroke-width="4" fill="none"/>
  <circle cx="34" cy="46" r="7" stroke="#2b579a" stroke-width="4" fill="#fff"/>
  <circle cx="88" cy="46" r="7" stroke="#2b579a" stroke-width="4" fill="#fff"/>
  <path d="M42 18h24l8 12H36l6-12z" stroke="#2b579a" stroke-width="3" fill="none"/>
</svg>
`;

export function buildReceiptPrintHtml(
  receipt: Receipt,
  contact: ContactInfo,
  labels: ReceiptPrintLabels,
  logoSrc?: string
): string {
  const dateStr = new Date(receipt.issued_at).toLocaleDateString();
  const description = receipt.description || receipt.car_name || "—";
  const price = Number(receipt.unit_price) || receiptSubtotal(receipt);
  const qty = Number(receipt.qty) || 1;
  const lineTotal = price * qty;
  const sub = receiptSubtotal(receipt);
  const tax = receiptTax(receipt);
  const grand = receiptGrandTotal(receipt);
  const taxLabel = `${labels.tax}${receipt.tax_rate ? ` (${receipt.tax_rate}%)` : ""}`;
  const site = contact.facebook?.replace(/^https?:\/\//, "") || "carplus";
  const address = contact.address || "";
  const bank = receipt.bank_name || "ABA Bank";
  const account = receipt.account_no || contact.phone || "—";
  const phone = contact.phone || receipt.phone || "";
  const logoHtml = logoSrc
    ? `<img class="logo" src="${esc(logoSrc)}" alt="Car Plus" />`
    : carSvgFallback;

  return `
  <div class="invoice">
    <div class="top">
      <div>
        <h1 class="company">${esc(labels.companyName)}</h1>
        <div class="doc-type">${esc(labels.invoice)}</div>
        <div class="company-meta">${esc(site)}${address ? ` | ${esc(address)}` : ""}</div>
      </div>
      <div class="logo-box">
        ${logoHtml}
        <div class="logo-mark">C.P</div>
      </div>
    </div>

    <div class="party">
      <div>
        <div class="party-label">${esc(labels.invoiceTo)}</div>
        <div class="party-value">${esc(receipt.customer_name)}</div>
      </div>
      <div style="text-align:right">
        <div class="party-label">${esc(labels.invoiceDate)}</div>
        <div class="party-date">${esc(dateStr)}</div>
      </div>
    </div>

    <div class="items">
      <table>
        <thead>
          <tr>
            <th>${esc(labels.description)}</th>
            <th class="right">${esc(labels.price)}</th>
            <th class="right">${esc(labels.qty)}</th>
            <th class="right">${esc(labels.total)}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${esc(description)}</td>
            <td class="right">${money(price)}</td>
            <td class="right">${qty}</td>
            <td class="right">${money(lineTotal)}</td>
          </tr>
        </tbody>
      </table>
      <div class="totals">
        <div class="totals-row"><span>${esc(labels.subtotal)}</span><span>${money(sub)}</span></div>
        <div class="totals-row"><span>${esc(taxLabel)}</span><span>${money(tax)}</span></div>
        <div class="totals-row grand"><span>${esc(labels.grandTotal)}</span><span>${money(grand)}</span></div>
      </div>
    </div>

    <div class="car-bar">${esc(labels.carInfo)}</div>
    <div class="car-grid">
      <div>${esc(labels.year)}: ${esc(receipt.year || "—")}</div>
      <div>${esc(labels.make)}: ${esc(receipt.make || "—")}</div>
      <div>${esc(labels.model)}: ${esc(receipt.model || "—")}</div>
    </div>

    <div class="bottom">
      <div class="pay-box">
        <div class="pay-title">${esc(labels.paymentInfo)}</div>
        <div class="pay-line">${esc(labels.bankName)}: ${esc(bank)}</div>
        <div class="pay-line">${esc(labels.accountNo)}: ${esc(account)}</div>
        <div class="pay-line">${esc(labels.payment)}: ${esc(labels.paymentMethods[receipt.payment_method] || receipt.payment_method)}</div>
      </div>
      <div class="contact-box">
        <div class="contact-inner">
          <div class="contact-brand">${esc(labels.companyName)}</div>
          <div class="contact-cta">${esc(labels.contactUs)}</div>
          <div class="contact-phone">${esc(phone)}</div>
        </div>
      </div>
    </div>
  </div>
  `;
}

export async function printReceipt(
  receipt: Receipt,
  contact: ContactInfo,
  labels: ReceiptPrintLabels
) {
  const logoSrc = await logoAsDataUrl();
  const html = buildReceiptPrintHtml(receipt, contact, labels, logoSrc);
  // Title becomes the default PDF filename in many browsers / Acrobat print dialogs.
  const fileTitle = `CarPlus-Invoice-${receipt.receipt_no}`;
  await printHtmlDocument(fileTitle, html, INVOICE_CSS);
}
