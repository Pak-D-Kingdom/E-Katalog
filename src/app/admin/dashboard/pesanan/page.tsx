
"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Search,
  MessageCircle,
  RefreshCw,
  Package,
  CheckCircle2,
} from "lucide-react";
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

const selectClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-orange-700";

function formatPriceRange(min: string | number, max: string | number | null) {
  const minimum = rupiah(min);
  return max == null
    ? minimum
    : `${minimum} – ${rupiah(max)} (estimasi)`;
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<number | null>(null);

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

  const totalLunas = orders.filter(
    (order) => order.status_pembayaran === "lunas"
      && order.status_pesanan !== "dibatalkan"
  ).length;

  const waitingOrders = orders.filter(
    (order) => order.status_pesanan === "menunggu_konfirmasi"
  ).length;

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

      {/* SUMMARY */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">
            Pesanan Ditampilkan
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {orders.length}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Maksimal 200 pesanan terbaru
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">
            Menunggu Konfirmasi
          </p>
          <p className="mt-2 text-2xl font-black text-amber-600">
            {waitingOrders}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Perlu ditindaklanjuti Admin
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">
            Pembayaran Lunas
          </p>
          <p className="mt-2 text-2xl font-black text-green-700">
            {totalLunas}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Pesanan tidak dibatalkan
          </p>
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

      {/* ORDER TABLE */}
      <section className="card overflow-hidden">
        <form
          className="flex flex-wrap gap-2 border-b p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void load(query);
            setExpanded(null);
          }}
        >
          <label className="relative block w-full max-w-sm">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="field field-with-icon py-2.5"
              placeholder="Cari kode pesanan..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
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
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3">Kode Pesanan</th>
                <th className="px-3 py-3">Pemesan</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">Pembayaran</th>
                <th className="px-3 py-3">Status Pesanan</th>
                <th className="px-3 py-3">Tanggal</th>
                <th className="px-3 py-3 text-right">Detail</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {orders.map((order) => (
                <Fragment key={order.id}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-bold text-forest-700">
                      {order.kode_pesanan}
                    </td>

                    <td className="px-5 py-4">
                      <b>{order.nama_pemesan}</b>
                      <small className="mt-1 block text-slate-500">
                        {order.nama_sekolah || "—"}
                      </small>
                    </td>

                    <td className="px-5 py-4 font-bold">
                      {formatPriceRange(order.total_harga, order.total_harga_max)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold ${paymentColors[order.status_pembayaran]}`}
                      >
                        {paymentLabels[order.status_pembayaran]}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold ${orderColors[order.status_pesanan]}`}
                      >
                        {orderLabels[order.status_pesanan]}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500">
                      {new Date(order.dibuat_pada).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded(
                            expanded === order.id ? null : order.id
                          )
                        }
                        className="btn-secondary flex items-center gap-1 px-3 py-2 text-xs"
                      >
                        {expanded === order.id ? (
                          <ChevronUp size={15} />
                        ) : (
                          <ChevronDown size={15} />
                        )}
                        Detail
                      </button>
                    </td>
                  </tr>


                  {expanded === order.id && (
                    <tr>
                      <td colSpan={7} className="bg-slate-50 p-4 sm:p-5">
                        <div className="space-y-4">

                          {/* RINCIAN PRODUK DAN INFORMASI PEMESAN */}
                          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">

                            {/* RINCIAN PRODUK */}
                            <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
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
                                    className="rounded-lg border border-slate-100 bg-white p-3 sm:p-4"
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
                                          {formatPriceRange(
                                            item.subtotal,
                                            item.subtotal_max
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* TOTAL PESANAN */}
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
                                  {formatPriceRange(
                                    order.total_harga,
                                    order.total_harga_max
                                  )}
                                </p>
                              </div>
                            </section>

                            {/* INFORMASI PEMESAN */}
                            <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                              <div className="border-b border-slate-100 pb-3">
                                <h3 className="text-sm font-bold text-slate-800">
                                  Informasi Pemesan
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                  Identitas dan kontak pelanggan
                                </p>
                              </div>

                              {/* NAMA PEMESAN */}
                              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                  Nama Pemesan
                                </p>
                                <p className="mt-1 break-words text-sm font-bold text-slate-800">
                                  {order.nama_pemesan}
                                </p>
                              </div>

                              {/* INSTANSI DAN TELEPON */}
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

                              {/* CATATAN */}
                              <div className="mt-3 rounded-lg border border-slate-100 p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                  Catatan Pesanan
                                </p>
                                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                                  {order.catatan || "Tidak ada catatan dari pemesan."}
                                </p>
                              </div>

                              {/* WHATSAPP */}
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

                          {/* PENGATURAN STATUS */}
                          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                              <div>
                                <h3 className="text-sm font-bold text-slate-800">
                                  Pengaturan Status Pesanan
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                  Perubahan status langsung disimpan setelah dipilih.
                                </p>
                              </div>

                              {updatingOrder === order.id && (
                                <span className="text-xs font-medium text-blue-600">
                                  Menyimpan perubahan...
                                </span>
                              )}
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-2">

                              {/* STATUS PEMBAYARAN */}
                              <div>
                                <label className="mb-2 block text-xs font-bold text-slate-700">
                                  Status Pembayaran
                                </label>

                                <select
                                  className={selectClass}
                                  value={order.status_pembayaran}
                                  disabled={updatingOrder === order.id}
                                  onChange={(e) =>
                                    void updateStatus(order.id, {
                                      status_pembayaran: e.target.value as StatusPembayaran,
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

                              {/* STATUS PESANAN */}
                              <div>
                                <label className="mb-2 block text-xs font-bold text-slate-700">
                                  Status Proses Pesanan
                                </label>

                                <select
                                  className={selectClass}
                                  value={order.status_pesanan}
                                  disabled={updatingOrder === order.id}
                                  onChange={(e) =>
                                    void updateStatus(order.id, {
                                      status_pesanan: e.target.value as StatusPesanan,
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
                      </td>
                    </tr>
                  )}

                </Fragment>
              ))}

              {!orders.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-slate-500"
                  >
                    {loading
                      ? "Memuat pesanan..."
                      : "Belum ada pesanan."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-4 py-4">
          <p className="text-xs text-slate-500">
            Menampilkan <b className="text-slate-800">{orders.length}</b> pesanan
          </p>
        </div>
      </section>
    </div>
  );
}
