
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
  subtotal: string | number;
};

type Order = {
  id: number;
  kode_pesanan: string;
  nama_pemesan: string;
  nama_sekolah: string | null;
  telepon_pemesan: string | null;
  catatan: string | null;
  total_harga: string | number;
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
    <div className="space-y-5">
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
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Kode Pesanan</th>
                <th className="px-5 py-3">Pemesan</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Pembayaran</th>
                <th className="px-5 py-3">Status Pesanan</th>
                <th className="px-5 py-3">Tanggal</th>
                <th className="px-5 py-3">Detail</th>
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
                      {rupiah(order.total_harga)}
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
                      <td colSpan={7} className="bg-slate-50 px-5 py-5">
                        <div className="grid gap-5 lg:grid-cols-2">
                          {/* ITEM */}
                          <div>
                            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                              <Package size={15} />
                              Rincian Produk
                            </h3>

                            <div className="mt-3 space-y-3">
                              {order.detail_pesanan.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between gap-4 border-b border-slate-200 pb-3"
                                >
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                      {item.nama_produk}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {item.jumlah} × {rupiah(item.harga_satuan)}
                                    </p>
                                  </div>

                                  <b className="text-sm text-slate-800">
                                    {rupiah(item.subtotal)}
                                  </b>
                                </div>
                              ))}
                            </div>

                            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3">
                              <b>Total Pesanan</b>
                              <b className="text-[#A83D00]">
                                {rupiah(order.total_harga)}
                              </b>
                            </div>
                          </div>

                          {/* CUSTOMER AND STATUS */}
                          <div className="space-y-5">
                            <div>
                              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Informasi Pemesan
                              </h3>

                              <p className="mt-2 text-sm font-semibold text-slate-800">
                                {order.nama_pemesan}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Instansi: {order.nama_sekolah || "—"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Telepon: {order.telepon_pemesan || "—"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Catatan: {order.catatan || "—"}
                              </p>

                              {order.telepon_pemesan && (
                                <a
                                  href={whatsappLink(
                                    order.telepon_pemesan,
                                    order.kode_pesanan
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700"
                                >
                                  <MessageCircle size={15} />
                                  Hubungi melalui WhatsApp
                                </a>
                              )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
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
                                  {Object.entries(paymentLabels).map(
                                    ([value, label]) => (
                                      <option key={value} value={value}>
                                        {label}
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>

                              <div>
                                <label className="mb-2 block text-xs font-bold text-slate-700">
                                  Status Pesanan
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
                                  {Object.entries(orderLabels).map(
                                    ([value, label]) => (
                                      <option key={value} value={value}>
                                        {label}
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>
                            </div>

                            {updatingOrder === order.id && (
                              <p className="text-xs text-blue-600">
                                Menyimpan perubahan status...
                              </p>
                            )}
                          </div>
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
      </section>
    </div>
  );
}
