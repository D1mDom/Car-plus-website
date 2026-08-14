import type { Car } from "@/hooks/useCars";
import { printHtmlDocument } from "@/lib/printDocument";

export type DashboardExportLabels = {
  title: string;
  exportedAt: string;
  totalCars: string;
  ready: string;
  luxury: string;
  totalValue: string;
  colCode: string;
  colName: string;
  colModel: string;
  colYear: string;
  colPrice: string;
  colStatus: string;
  colVisible: string;
  yes: string;
  no: string;
};

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const money = (n: number) => `$${Number(n).toLocaleString()}`;

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export type DashboardStats = {
  total: number;
  ready: number;
  luxury: number;
  totalValue: number;
};

export function exportDashboardExcel(cars: Car[], filename: string) {
  const header = ["Code", "Name", "Model", "Year", "Price", "Status", "Visible"];
  const rows = cars.map((c) => [
    c.code,
    c.name,
    c.model,
    String(c.year),
    String(c.price),
    c.status,
    c.isActive !== false ? "Yes" : "No",
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, filename);
}

export async function exportDashboardPdf(
  cars: Car[],
  stats: DashboardStats,
  labels: DashboardExportLabels,
) {
  const dateStr = new Date().toLocaleString();

  const tableRows = cars
    .map(
      (c) => `<tr>
        <td>${esc(c.code)}</td>
        <td>${esc(c.name)}</td>
        <td>${esc(c.model)}</td>
        <td>${c.year}</td>
        <td>${money(c.price)}</td>
        <td>${esc(c.status)}</td>
        <td>${c.isActive !== false ? esc(labels.yes) : esc(labels.no)}</td>
      </tr>`,
    )
    .join("");

  const bodyHtml = `
    <div class="report">
      <h1>${esc(labels.title)}</h1>
      <p class="meta">${esc(labels.exportedAt)}: ${esc(dateStr)}</p>
      <div class="stats">
        <div class="stat"><strong>${stats.total}</strong><span>${esc(labels.totalCars)}</span></div>
        <div class="stat"><strong>${stats.ready}</strong><span>${esc(labels.ready)}</span></div>
        <div class="stat"><strong>${stats.luxury}</strong><span>${esc(labels.luxury)}</span></div>
        <div class="stat"><strong>${money(stats.totalValue)}</strong><span>${esc(labels.totalValue)}</span></div>
      </div>
      <table>
        <thead>
          <tr>
            <th>${esc(labels.colCode)}</th>
            <th>${esc(labels.colName)}</th>
            <th>${esc(labels.colModel)}</th>
            <th>${esc(labels.colYear)}</th>
            <th>${esc(labels.colPrice)}</th>
            <th>${esc(labels.colStatus)}</th>
            <th>${esc(labels.colVisible)}</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>`;

  const css = `
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; color: #0f172a; margin: 24px; }
    .report h1 { color: #174080; font-size: 22px; margin: 0 0 4px; }
    .meta { color: #64748b; font-size: 12px; margin: 0 0 20px; }
    .stats { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
    .stat { background: #f1f5f9; border-radius: 10px; padding: 12px 16px; min-width: 120px; }
    .stat strong { display: block; font-size: 18px; color: #174080; }
    .stat span { font-size: 11px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
    th { background: #174080; color: #fff; font-weight: 600; }
    tr:nth-child(even) td { background: #f8fafc; }
    @media print { body { margin: 12px; } }
  `;

  await printHtmlDocument(labels.title, bodyHtml, css);
}
