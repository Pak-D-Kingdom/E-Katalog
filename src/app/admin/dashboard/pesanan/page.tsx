
"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import {
  Eye,
  Search,
  MessageCircle,
  RefreshCw,
  Package,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { api, rupiah } from "@/lib/types";

type StatusPesanan =
  | "menunggu_konfirmasi"
  | "dikonfirmasi"
  | "diproses"
  | "dikirim"
  | "selesai"
  | "dibatalkan";

type StatusPembayaran =
  | "belum_dibayar"
  | "menunggu_verifikasi"
  | "lunas"
  | "ditolak"
  | "dikembalikan";

type Detail = {
  id: number;
  nama_produk: string;
  jumlah: number;
  harga_satuan: string | number;
  harga_satuan_max: string | number | null;
  subtotal: string | number;
  subtotal_max: string | number | null;
};

type Order = {
  id: number;
  kode_pesanan: string;
  nama_pemesan: string;
  nama_sekolah: string | null;
  telepon_pemesan: string | null;
  catatan: string | null;
  total_harga: string | number;
  total_harga_max: string | number | null;
  dibuat_pada: string;
  status_pesanan: StatusPesanan;
  status_pembayaran: StatusPembayaran;
  detail_pesanan: Detail[];
};

type StatusUpdate = Partial<
  Pick<Order, "status_pesanan" | "status_pembayaran">
>;

const paymentLabels: Record<StatusPembayaran, string> = {
  belum_dibayar: "Belum Dibayar",
  menunggu_verifikasi: "Menunggu Verifikasi",
  lunas: "Lunas",
  ditolak: "Ditolak",
  dikembalikan: "Dikembalikan",
};

const orderLabels: Record<StatusPesanan, string> = {
  menunggu_konfirmasi: "Menunggu Konfirmasi",
  dikonfirmasi: "Dikonfirmasi",
  diproses: "Diproses",
  dikirim: "Dikirim",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

const paymentColors: Record<StatusPembayaran, string> = {
  belum_dibayar: "bg-amber-50 text-amber-700",
  menunggu_verifikasi: "bg-blue-50 text-blue-700",
  lunas: "bg-green-50 text-green-700",
  ditolak: "bg-red-50 text-red-700",
  dikembalikan: "bg-slate-100 text-slate-600",
};

const orderColors: Record<StatusPesanan, string> = {
  menunggu_konfirmasi: "bg-amber-50 text-amber-700",
  dikonfirmasi: "bg-blue-50 text-blue-700",
  diproses: "bg-indigo-50 text-indigo-700",
  dikirim: "bg-purple-50 text-purple-700",
  selesai: "bg-green-50 text-green-700",
  dibatalkan: "bg-red-50 text-red-700",
};

const orderStatuses = Object.keys(orderLabels) as StatusPesanan[];
const paymentStatuses = Object.keys(paymentLabels) as StatusPembayaran[];

const selectClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-orange-700";

function formatPriceRange(min: string | number, max: string | number | null) {
  const minimum = rupiah(min);
  return max == null
    ? minimum
    : `${minimum} – ${rupiah(max)} (estimasi)`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function buildOrdersPdfHtml(orders: Order[], date: string) {
  const sections = orders
    .map((order) => {
      const rows = order.detail_pesanan
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.nama_produk)}</td>
              <td class="number">${escapeHtml(item.jumlah)}</td>
              <td class="number">${escapeHtml(formatPriceRange(item.harga_satuan, item.harga_satuan_max))}</td>
              <td class="number">${escapeHtml(formatPriceRange(item.subtotal, item.subtotal_max))}</td>
            </tr>
          `
        )
        .join("");

      return `
        <section class="order">
          <div class="order-heading">
            <div>
              <strong>${escapeHtml(order.kode_pesanan)}</strong>
              <span>${escapeHtml(order.nama_pemesan)}</span>
            </div>
            <div class="statuses">
              <span>${escapeHtml(orderLabels[order.status_pesanan])}</span>
              <span>${escapeHtml(paymentLabels[order.status_pembayaran])}</span>
            </div>
          </div>
          <p class="meta">
            ${escapeHtml(order.nama_sekolah || "Instansi tidak diisi")}
            ${order.telepon_pemesan ? ` · ${escapeHtml(order.telepon_pemesan)}` : ""}
            · ${escapeHtml(new Date(order.dibuat_pada).toLocaleString("id-ID"))}
          </p>
          <table>
            <thead>
              <tr><th>Produk</th><th>Jumlah</th><th>Harga Satuan</th><th>Subtotal</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p class="total">Total pesanan: ${escapeHtml(formatPriceRange(order.total_harga, order.total_harga_max))}</p>
          ${order.catatan ? `<p class="note"><strong>Catatan:</strong> ${escapeHtml(order.catatan)}</p>` : ""}
        </section>
      `;
    })
    .join("");

  return `<!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Data Pesanan</title>
        <style>
          * { box-sizing: border-box; }
          body { color: #172b4d; font: 12px Arial, sans-serif; margin: 24px; }
          h1 { font-size: 22px; margin: 0 0 6px; }
          .report-meta { color: #64748b; margin: 0 0 20px; }
          .toolbar { margin-bottom: 18px; }
          .toolbar button { background: #a83d00; border: 0; border-radius: 6px; color: white; cursor: pointer; padding: 10px 14px; }
          .order { border: 1px solid #dce4f0; border-radius: 8px; margin-bottom: 16px; padding: 12px; break-inside: avoid; }
          .order-heading { align-items: flex-start; display: flex; justify-content: space-between; gap: 12px; }
          .order-heading strong { color: #a83d00; margin-right: 10px; }
          .statuses { color: #475569; display: flex; flex-wrap: wrap; gap: 6px; }
          .statuses span { background: #f1f5f9; border-radius: 12px; padding: 4px 8px; }
          .meta, .note { color: #64748b; margin: 8px 0; }
          table { border-collapse: collapse; margin-top: 10px; width: 100%; }
          th, td { border: 1px solid #dce4f0; padding: 7px; text-align: left; }
          th { background: #f1f5f9; }
          .number { text-align: right; white-space: nowrap; }
          .total { color: #a83d00; font-size: 14px; font-weight: bold; margin: 10px 0 0; text-align: right; }
          @page { size: A4 landscape; margin: 12mm; }
          @media print {
            body { margin: 0; }
            .toolbar { display: none; }
            thead { display: table-header-group; }
            tr { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="toolbar"><button onclick="window.print()">Cetak / Simpan sebagai PDF</button></div>
        <h1>Laporan Data Pesanan</h1>
        <p class="report-meta">Tanggal ekspor: ${escapeHtml(date)} · Jumlah pesanan: ${orders.length}</p>
        ${sections || "<p>Tidak ada pesanan untuk diekspor.</p>"}
        <script>window.addEventListener("load", () => setTimeout(() => window.print(), 500));</script>
      </body>
    </html>
  `;
}

function whatsappLink(phone: string | null, code: string) {
  if (!phone) return "";

  let number = phone.replace(/\D/g, "");

  if (number.startsWith("0")) {
    number = `62${number.slice(1)}`;
  }

  const message = `Halo, saya Admin DapurKita. Saya ingin menghubungi Anda terkait pesanan ${code}.`;

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

type OrderDetailsModalProps = {
  order: Order;
  updating: boolean;
  onClose: () => void;
  onUpdate: (id: number, changes: StatusUpdate) => Promise<void>;
};

function OrderDetailsModal({
  order,
  updating,
  onClose,
  onUpdate,
}: OrderDetailsModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      id="order-details-dialog"
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-[1px] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-details-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative my-auto max-h-[calc(100vh-1.5rem)] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100vh-3rem)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div className="min-w-0">
            <span className="inline-block rounded-md bg-orange-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#A83D00]">
              {order.kode_pesanan}
            </span>
            <h2
              id="order-details-title"
              className="mt-2 text-lg font-bold text-slate-900"
            >
              Detail Pesanan
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Rincian produk, informasi pemesan, dan status pesanan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail pesanan"
            className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-xl border border-slate-200 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Rincian Produk
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Daftar produk dalam pesanan ini
                  </p>
                </div>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#A83D00]">
                  {order.detail_pesanan.length} jenis produk
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {order.detail_pesanan.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-100 p-3 sm:p-4"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-bold text-slate-800">
                          {item.nama_produk}
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-slate-500">
                            Jumlah: {item.jumlah} unit
                          </p>
                          <p className="text-xs text-slate-500">
                            Harga satuan:{" "}
                            {formatPriceRange(
                              item.harga_satuan,
                              item.harga_satuan_max
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 sm:text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Subtotal
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {formatPriceRange(item.subtotal, item.subtotal_max)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-orange-50 p-4">
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Total Pesanan
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Akumulasi seluruh produk yang dipesan
                  </p>
                </div>
                <p className="text-lg font-black text-[#A83D00]">
                  {formatPriceRange(order.total_harga, order.total_harga_max)}
                </p>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 p-4 sm:p-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  Informasi Pemesan
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Identitas dan kontak pelanggan
                </p>
              </div>

              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Nama Pemesan
                </p>
                <p className="mt-1 break-words text-sm font-bold text-slate-800">
                  {order.nama_pemesan}
                </p>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Instansi / Sekolah
                  </p>
                  <p className="mt-1 break-words text-sm font-medium text-slate-700">
                    {order.nama_sekolah || "Belum diisi"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Nomor Telepon
                  </p>
                  <p className="mt-1 break-words text-sm font-medium text-slate-700">
                    {order.telepon_pemesan || "Belum diisi"}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-slate-100 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Catatan Pesanan
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                  {order.catatan || "Tidak ada catatan dari pemesan."}
                </p>
              </div>

              {order.telepon_pemesan && (
                <a
                  href={whatsappLink(
                    order.telepon_pemesan,
                    order.kode_pesanan
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700"
                >
                  <MessageCircle size={17} />
                  Hubungi Pemesan melalui WhatsApp
                </a>
              )}
            </section>
          </div>

          <section className="rounded-xl border border-slate-200 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Pengaturan Status Pesanan
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Perubahan status akan langsung disimpan setelah dipilih.
                </p>
              </div>
              {updating && (
                <span className="text-xs font-medium text-blue-600">
                  Menyimpan perubahan...
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="modal-payment-status"
                  className="mb-2 block text-xs font-bold text-slate-700"
                >
                  Status Pembayaran
                </label>
                <select
                  id="modal-payment-status"
                  className={selectClass}
                  value={order.status_pembayaran}
                  disabled={updating}
                  onChange={(event) =>
                    void onUpdate(order.id, {
                      status_pembayaran: event.target.value as StatusPembayaran,
                    })
                  }
                >
                  {Object.entries(paymentLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="modal-order-status"
                  className="mb-2 block text-xs font-bold text-slate-700"
                >
                  Status Proses Pesanan
                </label>
                <select
                  id="modal-order-status"
                  className={selectClass}
                  value={order.status_pesanan}
                  disabled={updating}
                  onChange={(event) =>
                    void onUpdate(order.id, {
                      status_pesanan: event.target.value as StatusPesanan,
                    })
                  }
                >
                  {Object.entries(orderLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    "all" | StatusPesanan
  >("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<
    "all" | StatusPembayaran
  >("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [exportError, setExportError] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportOrderStatus, setExportOrderStatus] =
    useState<"all" | StatusPesanan>("all");
  const [exportPaymentStatus, setExportPaymentStatus] =
    useState<"all" | StatusPembayaran>("all");
  const [exportFormat, setExportFormat] =
    useState<"xlsx" | "csv" | "pdf">("xlsx");
  const [updatingOrder, setUpdatingOrder] = useState<number | null>(null);
  const closeOrderDetails = useCallback(() => setSelectedOrderId(null), []);

  const load = useCallback(async (search: string) => {
    setLoading(true);
    setError("");

    try {
      const result = await api<{ pesanan: Order[] }>(
        `/api/pesanan${search ? `?q=${encodeURIComponent(search)}` : ""}`
      );

      setOrders(result.pesanan);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("");
  }, [load]);

  useEffect(() => {
    if (!exportDialogOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setExportDialogOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [exportDialogOpen]);

  async function updateStatus(id: number, changes: StatusUpdate) {
    setUpdatingOrder(id);
    setError("");
    setMessage("");

    try {
      const result = await api<{ pesanan: Order }>(
        `/api/pesanan/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(changes),
        }
      );

      setOrders((current) =>
        current.map((order) =>
          order.id === id
            ? { ...order, ...result.pesanan }
            : order
        )
      );

      setMessage(
        `Status pesanan ${result.pesanan.kode_pesanan} berhasil diperbarui.`
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUpdatingOrder(null);
    }
  }

  const totalItems = orders.reduce(
    (total, order) => total + order.detail_pesanan.length,
    0
  );

  const orderStatusCounts = orderStatuses.map((status) => ({
    status,
    count: orders.filter((order) => order.status_pesanan === status).length,
  }));
  const paymentStatusCounts = paymentStatuses.map((status) => ({
    status,
    count: orders.filter((order) => order.status_pembayaran === status).length,
  }));
  const filteredOrders = orders.filter((order) => {
    const matchesOrderStatus =
      orderStatusFilter === "all" ||
      order.status_pesanan === orderStatusFilter;
    const matchesPaymentStatus =
      paymentStatusFilter === "all" ||
      order.status_pembayaran === paymentStatusFilter;

    return matchesOrderStatus && matchesPaymentStatus;
  });

  const exportableOrders = orders.filter((order) => {
    const matchesOrderStatus =
      exportOrderStatus === "all" ||
      order.status_pesanan === exportOrderStatus;
    const matchesPaymentStatus =
      exportPaymentStatus === "all" ||
      order.status_pembayaran === exportPaymentStatus;

    return matchesOrderStatus && matchesPaymentStatus;
  });

  function openExportDialog() {
    setExportOrderStatus(orderStatusFilter);
    setExportPaymentStatus(paymentStatusFilter);
    setExportFormat("xlsx");
    setExportError("");
    setExportDialogOpen(true);
  }

  async function downloadOrders() {
    if (!exportableOrders.length) return;

    setExporting(true);
    setExportError("");
    setMessage("");
    let printWindow: Window | null = null;

    try {
      const date = new Date().toISOString().slice(0, 10);
      if (exportFormat === "pdf") {
        printWindow = window.open("", "_blank");
        if (!printWindow) {
          throw new Error(
            "Jendela cetak diblokir browser. Izinkan pop-up untuk menyimpan PDF."
          );
        }

        printWindow.document.open();
        printWindow.document.write(buildOrdersPdfHtml(exportableOrders, date));
        printWindow.document.close();
      } else {
        const XLSX = await import("xlsx");
        const orderRows = exportableOrders.map((order) => ({
          "Kode Pesanan": order.kode_pesanan,
          "Tanggal Pesanan": new Date(order.dibuat_pada).toLocaleString("id-ID"),
          "Nama Pemesan": order.nama_pemesan,
          "Instansi / Sekolah": order.nama_sekolah || "",
          "Nomor Telepon": order.telepon_pemesan || "",
          "Status Pesanan": orderLabels[order.status_pesanan],
          "Status Pembayaran": paymentLabels[order.status_pembayaran],
          "Total Minimum": Number(order.total_harga),
          "Total Maksimum":
            order.total_harga_max == null
              ? ""
              : Number(order.total_harga_max),
          Catatan: order.catatan || "",
        }));
        const productRows = exportableOrders.flatMap((order) =>
          order.detail_pesanan.map((item) => ({
            "Kode Pesanan": order.kode_pesanan,
            "Nama Pemesan": order.nama_pemesan,
            "Instansi / Sekolah": order.nama_sekolah || "",
            "Nomor Telepon": order.telepon_pemesan || "",
            "Tanggal Pesanan": new Date(order.dibuat_pada).toLocaleString("id-ID"),
            "Status Pesanan": orderLabels[order.status_pesanan],
            "Status Pembayaran": paymentLabels[order.status_pembayaran],
            "Nama Produk": item.nama_produk,
            Jumlah: item.jumlah,
            "Harga Satuan Minimum": Number(item.harga_satuan),
            "Harga Satuan Maksimum":
              item.harga_satuan_max == null
                ? ""
                : Number(item.harga_satuan_max),
            "Subtotal Minimum": Number(item.subtotal),
            "Subtotal Maksimum":
              item.subtotal_max == null ? "" : Number(item.subtotal_max),
          }))
        );

        if (exportFormat === "xlsx") {
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(
            workbook,
            XLSX.utils.json_to_sheet(orderRows),
            "Pesanan"
          );
          XLSX.utils.book_append_sheet(
            workbook,
            XLSX.utils.json_to_sheet(productRows),
            "Rincian Produk"
          );
          XLSX.writeFile(workbook, `data-pesanan-${date}.xlsx`);
        } else {
          const csvRows = exportableOrders.flatMap((order) =>
            (order.detail_pesanan.length ? order.detail_pesanan : [null]).map(
              (item) => ({
                "Kode Pesanan": order.kode_pesanan,
                "Tanggal Pesanan": new Date(order.dibuat_pada).toLocaleString("id-ID"),
                "Nama Pemesan": order.nama_pemesan,
                "Instansi / Sekolah": order.nama_sekolah || "",
                "Nomor Telepon": order.telepon_pemesan || "",
                "Status Pesanan": orderLabels[order.status_pesanan],
                "Status Pembayaran": paymentLabels[order.status_pembayaran],
                "Total Minimum": Number(order.total_harga),
                "Total Maksimum":
                  order.total_harga_max == null
                    ? ""
                    : Number(order.total_harga_max),
                "Nama Produk": item?.nama_produk || "",
                Jumlah: item?.jumlah ?? "",
                "Harga Satuan Minimum":
                  item == null ? "" : Number(item.harga_satuan),
                "Harga Satuan Maksimum":
                  item?.harga_satuan_max == null
                    ? ""
                    : Number(item.harga_satuan_max),
                "Subtotal Minimum": item == null ? "" : Number(item.subtotal),
                "Subtotal Maksimum":
                  item?.subtotal_max == null ? "" : Number(item.subtotal_max),
                Catatan: order.catatan || "",
              })
            )
          );
          const csv = XLSX.utils.sheet_to_csv(
            XLSX.utils.json_to_sheet(csvRows)
          );
          const url = URL.createObjectURL(
            new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" })
          );
          const link = document.createElement("a");
          link.href = url;
          link.download = `data-pesanan-${date}.csv`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
      }

      setMessage(
        exportFormat === "pdf"
          ? `Laporan ${exportableOrders.length} pesanan dibuka untuk dicetak atau disimpan sebagai PDF.`
          : `Berhasil mengekspor ${exportableOrders.length} pesanan ke ${exportFormat.toUpperCase()}.`
      );
      setExportDialogOpen(false);
    } catch (e) {
      printWindow?.close();
      setExportError((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  function applyOrderStatusFilter(status: "all" | StatusPesanan) {
    setOrderStatusFilter(status);
    setPaymentStatusFilter("all");
    setSelectedOrderId(null);
  }

  function applyPaymentStatusFilter(status: "all" | StatusPembayaran) {
    setOrderStatusFilter("all");
    setPaymentStatusFilter(status);
    setSelectedOrderId(null);
  }

  return (
    <div className="min-h-screen space-y-5 bg-[#F2F5FC] p-4 sm:p-6 lg:p-7">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Manajemen Pesanan
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Kelola permintaan penawaran, pembayaran, dan proses pesanan pelanggan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load(query)}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Muat Ulang
        </button>
      </div>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Jumlah per Status Pesanan</h3>
          <p className="mt-1 text-xs text-slate-500">
            Klik kotak untuk memfilter daftar pesanan.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {orderStatusCounts.map(({ status, count }) => {
            const active =
              orderStatusFilter === status &&
              paymentStatusFilter === "all";

            return (
              <button
                key={status}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  applyOrderStatusFilter(active ? "all" : status)
                }
                className={`rounded-xl border bg-white p-4 text-left transition ${
                  active
                    ? "border-[#A83D00] ring-2 ring-[#A83D00]/15"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${orderColors[status]}`}>
                  {orderLabels[status]}
                </span>
                <span className="mt-3 block text-2xl font-black text-slate-900">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Jumlah per Status Pembayaran</h3>
          <p className="mt-1 text-xs text-slate-500">
            Jumlah dihitung dari pesanan terbaru yang sedang ditampilkan.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {paymentStatusCounts.map(({ status, count }) => {
            const active =
              paymentStatusFilter === status &&
              orderStatusFilter === "all";

            return (
              <button
                key={status}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  applyPaymentStatusFilter(active ? "all" : status)
                }
                className={`rounded-xl border bg-white p-4 text-left transition ${
                  active
                    ? "border-[#A83D00] ring-2 ring-[#A83D00]/15"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${paymentColors[status]}`}>
                  {paymentLabels[status]}
                </span>
                <span className="mt-3 block text-2xl font-black text-slate-900">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* NOTIFICATION */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          <CheckCircle2 size={17} />
          {message}
        </div>
      )}

      <section className="flex flex-col gap-4 rounded-xl border border-[#E5EAF3] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F0FF] text-[#172B4D]">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172B4D]">
              Export Data Pesanan / Rekap
            </h3>
            <p className="mt-1 text-xs text-[#64748B]">
              Unduh data pesanan beserta rincian produk dalam file Excel.
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Mengikuti pencarian dan filter aktif, maksimal 200 pesanan terbaru.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <button
            type="button"
            onClick={openExportDialog}
            disabled={loading || exporting}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#A83D00] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#8F3400] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileSpreadsheet size={16} />
            Atur Export
          </button>
          <span className="text-[10px] text-slate-400">
            Format .xlsx, .csv, atau PDF · {filteredOrders.length} pesanan
          </span>
        </div>
      </section>

      {/* ORDER TABLE */}
      <section className="card overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Daftar Pesanan</h3>
            <p className="mt-1 text-xs text-slate-500">
              Rincian dari {totalItems} produk pada {orders.length} pesanan terbaru.
            </p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
            Menampilkan {filteredOrders.length} dari {orders.length}
          </span>
        </div>

        <form
          className="flex flex-wrap items-end gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void load(query);
            setSelectedOrderId(null);
          }}
        >
          <label className="relative block w-full max-w-sm">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="field field-with-icon py-2.5"
              placeholder="Cari kode pesanan atau nama pemesan..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <label className="block min-w-48 text-[11px] font-semibold text-slate-600">
            Status Pesanan
            <select
              className={`${selectClass} mt-1`}
              value={orderStatusFilter}
              onChange={(event) => {
                setOrderStatusFilter(event.target.value as "all" | StatusPesanan);
                setSelectedOrderId(null);
              }}
            >
              <option value="all">Semua Status Pesanan</option>
              {Object.entries(orderLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="block min-w-48 text-[11px] font-semibold text-slate-600">
            Status Pembayaran
            <select
              className={`${selectClass} mt-1`}
              value={paymentStatusFilter}
              onChange={(event) => {
                setPaymentStatusFilter(
                  event.target.value as "all" | StatusPembayaran
                );
                setSelectedOrderId(null);
              }}
            >
              <option value="all">Semua Status Pembayaran</option>
              {Object.entries(paymentLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary py-2"
          >
            Cari
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col className="w-[16%]" />
              <col className="w-[17%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[15%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="px-4 py-4">Kode Pesanan</th>
                <th className="px-4 py-4">Pemesan</th>
                <th className="px-4 py-4">Total</th>
                <th className="px-4 py-4">Pembayaran</th>
                <th className="px-4 py-4">Status Pesanan</th>
                <th className="px-4 py-4">Tanggal</th>
                <th className="px-4 py-4 text-right">Detail</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <Fragment key={order.id}>
                  <tr className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-4">
                      <span className="inline-block whitespace-nowrap rounded-md bg-orange-50 px-2.5 py-1.5 text-[11px] font-bold tracking-wide text-[#A83D00]">
                        {order.kode_pesanan}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <p className="truncate font-bold text-slate-800">
                        {order.nama_pemesan}
                      </p>
                      <small className="mt-1 block truncate text-xs text-slate-500">
                        {order.nama_sekolah || "—"}
                      </small>
                    </td>

                    <td className="px-4 py-4">
                      <span className="block whitespace-normal text-xs font-extrabold leading-5 text-slate-900">
                        {formatPriceRange(order.total_harga, order.total_harga_max)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold ${paymentColors[order.status_pembayaran]}`}
                      >
                        {paymentLabels[order.status_pembayaran]}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold ${orderColors[order.status_pesanan]}`}
                      >
                        {orderLabels[order.status_pesanan]}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <p className="whitespace-nowrap text-xs font-medium text-slate-700">
                        {new Date(order.dibuat_pada).toLocaleDateString("id-ID", {
                          dateStyle: "medium",
                        })}
                      </p>
                      <p className="mt-1 whitespace-nowrap text-[10px] text-slate-400">
                        {new Date(order.dibuat_pada).toLocaleTimeString("id-ID", {
                          timeStyle: "short",
                        })}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        aria-haspopup="dialog"
                        aria-controls="order-details-dialog"
                        onClick={() => setSelectedOrderId(order.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#A83D00]"
                      >
                        <Eye size={15} />
                        Detail
                      </button>
                    </td>
                  </tr>

                  {selectedOrderId === order.id && (
                    <OrderDetailsModal
                      order={order}
                      updating={updatingOrder === order.id}
                      onClose={closeOrderDetails}
                      onUpdate={updateStatus}
                    />
                  )}
                </Fragment>
              ))}

              {!filteredOrders.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        {loading ? (
                          <RefreshCw size={20} className="animate-spin" />
                        ) : (
                          <Package size={21} />
                        )}
                      </span>
                      <p className="text-sm font-semibold text-slate-700">
                        {loading
                          ? "Memuat pesanan..."
                          : orders.length
                            ? "Tidak ada pesanan yang cocok dengan filter."
                            : "Belum ada pesanan."}
                      </p>
                      {!loading && orders.length > 0 && (
                        <p className="mt-1 text-xs text-slate-500">
                          Coba ubah status pesanan, pembayaran, atau pencarian.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
          <p className="text-xs text-slate-500">
            Menampilkan <b className="text-slate-800">{filteredOrders.length}</b>
            {" "}dari <b className="text-slate-800">{orders.length}</b> pesanan
          </p>
          <p className="text-[11px] text-slate-400">
            Maksimal 200 pesanan terbaru
          </p>
        </div>
      </section>

      {exportDialogOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-[1px] sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-export-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !exporting) {
              setExportDialogOpen(false);
            }
          }}
        >
          <div className="relative my-auto w-full max-w-2xl rounded-xl border border-[#E5EAF3] bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2
                  id="order-export-title"
                  className="text-lg font-bold text-[#172B4D]"
                >
                  Pengaturan Export Pesanan
                </h2>
                <p className="mt-1 text-xs text-[#64748B]">
                  Pilih status dan format data yang ingin diunduh.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExportDialogOpen(false)}
                disabled={exporting}
                aria-label="Tutup pengaturan export pesanan"
                className="rounded-md p-2 text-[#64748B] transition hover:bg-[#EEF3FF] disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-bold text-[#172B4D]">
                Status Pesanan
                <select
                  className={`${selectClass} mt-2`}
                  value={exportOrderStatus}
                  disabled={exporting}
                  onChange={(event) =>
                    setExportOrderStatus(
                      event.target.value as "all" | StatusPesanan
                    )
                  }
                >
                  <option value="all">Semua Status Pesanan</option>
                  {Object.entries(orderLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-bold text-[#172B4D]">
                Status Pembayaran
                <select
                  className={`${selectClass} mt-2`}
                  value={exportPaymentStatus}
                  disabled={exporting}
                  onChange={(event) =>
                    setExportPaymentStatus(
                      event.target.value as "all" | StatusPembayaran
                    )
                  }
                >
                  <option value="all">Semua Status Pembayaran</option>
                  {Object.entries(paymentLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-bold text-[#172B4D] sm:col-span-2">
                Format File
                <select
                  className={`${selectClass} mt-2`}
                  value={exportFormat}
                  disabled={exporting}
                  onChange={(event) =>
                    setExportFormat(
                      event.target.value as "xlsx" | "csv" | "pdf"
                    )
                  }
                >
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                  <option value="pdf">PDF (Cetak / Simpan sebagai PDF)</option>
                </select>
              </label>
            </div>

            {exportError && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              >
                {exportError}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 border-t border-[#EAF0F8] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#64748B]">
                {exportableOrders.length} pesanan akan diekspor.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setExportDialogOpen(false)}
                  disabled={exporting}
                  className="rounded-md bg-[#E5EDFF] px-4 py-3 text-xs font-bold text-[#172B4D] transition hover:bg-[#D5E2FA] disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => void downloadOrders()}
                  disabled={exporting || exportableOrders.length === 0}
                  className="inline-flex items-center gap-2 rounded-md bg-[#A83D00] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#8F3400] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download size={15} />
                  {exporting ? "Menyiapkan..." : "Unduh Data"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
