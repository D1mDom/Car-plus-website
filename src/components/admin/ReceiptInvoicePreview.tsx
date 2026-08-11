import type { ContactInfo } from "@/hooks/useContact";
import type { Receipt } from "@/hooks/useReceipts";
import { receiptGrandTotal, receiptSubtotal, receiptTax } from "@/hooks/useReceipts";
import type { ReceiptPrintLabels } from "@/components/admin/receiptPrint";
import logo from "@/assets/logo.png";

const money = (n: number) =>
  `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

type Props = {
  receipt: Receipt;
  contact: ContactInfo;
  labels: ReceiptPrintLabels;
};

/** Compact on-screen invoice preview (screen only — print uses its own HTML). */
const ReceiptInvoicePreview = ({ receipt, contact, labels }: Props) => {
  const dateStr = new Date(receipt.issued_at).toLocaleDateString();
  const description = receipt.description || receipt.car_name || "—";
  const price = Number(receipt.unit_price) || receiptSubtotal(receipt);
  const qty = Number(receipt.qty) || 1;
  const lineTotal = price * qty;
  const sub = receiptSubtotal(receipt);
  const tax = receiptTax(receipt);
  const grand = receiptGrandTotal(receipt);
  const site = contact.facebook?.replace(/^https?:\/\//, "") || "carplus";
  const bank = receipt.bank_name || "ABA Bank";
  const account = receipt.account_no || contact.phone || "—";
  const phone = contact.phone || receipt.phone || "";

  return (
    <div className="mx-auto w-full max-w-[520px] overflow-hidden rounded border border-[#ddd] bg-white text-[#1a1a1a] shadow-sm">
      <div className="p-3 sm:p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold uppercase tracking-wide sm:text-lg">
              {labels.companyName}
            </h2>
            <p className="text-sm font-bold uppercase text-[#2b579a]">{labels.invoice}</p>
            <p className="mt-0.5 truncate text-[10px] text-[#444]">
              {site}
              {contact.address ? ` | ${contact.address}` : ""}
            </p>
          </div>
          <div className="shrink-0 text-center">
            <img
              src={logo}
              alt="Car Plus"
              className="mx-auto h-12 w-12 rounded-md object-contain sm:h-14 sm:w-14"
            />
            <p className="mt-0.5 text-[10px] font-extrabold tracking-widest">C.P</p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold text-[#2b579a]">{labels.invoiceTo}</p>
            <p className="text-sm font-semibold italic">{receipt.customer_name}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-[#2b579a]">{labels.invoiceDate}</p>
            <p className="text-xs font-semibold">{dateStr}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#ececec]">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#cfcfcf] text-left text-[10px] font-extrabold uppercase tracking-wide">
              <th className="px-2.5 py-1.5">{labels.description}</th>
              <th className="px-2.5 py-1.5 text-right">{labels.price}</th>
              <th className="px-2.5 py-1.5 text-right">{labels.qty}</th>
              <th className="px-2.5 py-1.5 text-right">{labels.total}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#d0d0d0]">
              <td className="px-2.5 py-2">{description}</td>
              <td className="px-2.5 py-2 text-right">{money(price)}</td>
              <td className="px-2.5 py-2 text-right">{qty}</td>
              <td className="px-2.5 py-2 text-right">{money(lineTotal)}</td>
            </tr>
          </tbody>
        </table>
        <div className="space-y-0.5 px-2.5 pb-3 pt-1 text-right text-[11px]">
          <div className="flex justify-end gap-4">
            <span>{labels.subtotal}</span>
            <span className="min-w-[3.5rem]">{money(sub)}</span>
          </div>
          <div className="flex justify-end gap-4">
            <span>
              {labels.tax}
              {receipt.tax_rate ? ` (${receipt.tax_rate}%)` : ""}
            </span>
            <span className="min-w-[3.5rem]">{money(tax)}</span>
          </div>
          <div className="flex justify-end gap-4 text-xs font-extrabold text-[#2b579a]">
            <span>{labels.grandTotal}</span>
            <span className="min-w-[3.5rem]">{money(grand)}</span>
          </div>
        </div>
      </div>

      <div className="bg-black px-2 py-1.5 text-center text-[10px] font-extrabold uppercase tracking-[0.12em] text-white">
        {labels.carInfo}
      </div>
      <div className="mb-3 grid grid-cols-3 gap-1 bg-[#e8e8e8] px-2.5 py-2 text-[10px] font-bold uppercase">
        <div>
          {labels.year}: {receipt.year || "—"}
        </div>
        <div>
          {labels.make}: {receipt.make || "—"}
        </div>
        <div>
          {labels.model}: {receipt.model || "—"}
        </div>
      </div>

      <div className="grid gap-2 px-3 pb-3 sm:grid-cols-2">
        <div className="py-1">
          <p className="mb-1 text-[11px] font-extrabold uppercase text-[#2b579a]">{labels.paymentInfo}</p>
          <p className="text-[11px]">
            {labels.bankName}: {bank}
          </p>
          <p className="text-[11px]">
            {labels.accountNo}: {account}
          </p>
          <p className="text-[11px]">
            {labels.payment}: {labels.paymentMethods[receipt.payment_method]}
          </p>
        </div>
        <div className="bg-gradient-to-br from-[#dfe7f2] via-[#c5d4ea] to-[#b7c8e0] px-2.5 py-3 text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-wide">{labels.companyName}</p>
          <p className="my-0.5 text-[10px] font-extrabold uppercase text-[#2b579a]">{labels.contactUs}</p>
          <p className="text-sm font-extrabold tracking-wide">{phone}</p>
        </div>
      </div>
    </div>
  );
};

export default ReceiptInvoicePreview;
