"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { api, rupiah } from "@/lib/types";

type Detail = { id:number; nama_produk:string; jumlah:number; harga_satuan:string|number; subtotal:string|number };
type Order = { id:number; kode_pesanan:string; nama_pemesan:string; nama_sekolah:string|null; telepon_pemesan:string|null; catatan:string|null; total_harga:string|number; dibuat_pada:string; detail_pesanan:Detail[] };

export default function OrdersPage() {
  const [orders,setOrders]=useState<Order[]>([]);
  const [query,setQuery]=useState("");
  const [error,setError]=useState("");
  const [expanded,setExpanded]=useState<number|null>(null);
  const [loading,setLoading]=useState(false);
  const load=useCallback(async(search:string)=>{setLoading(true);setError("");try{setOrders((await api<{pesanan:Order[]}>(`/api/pesanan${search?`?q=${encodeURIComponent(search)}`:""}`)).pesanan);}catch(e){setError((e as Error).message);}finally{setLoading(false);}},[]);
  useEffect(()=>{void load("");},[load]);
  return <div>
    <div className="mb-5"><h2 className="text-xl font-black">Riwayat pesanan</h2><p className="mt-1 text-sm text-slate-500">Log pesanan yang masuk melalui checkout WhatsApp.</p></div>
    {error&&<div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <section className="card overflow-hidden">
      <form className="flex gap-2 border-b p-4" onSubmit={(e)=>{e.preventDefault();void load(query);}}><label className="relative block w-full max-w-sm"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="field py-2.5 pl-10" placeholder="Cari kode pesanan..." value={query} onChange={(e)=>setQuery(e.target.value)}/></label><button className="btn-primary py-2">Cari</button></form>
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Kode pesanan</th><th className="px-5 py-3">Pemesan</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Tanggal</th><th className="px-5 py-3"></th></tr></thead><tbody className="divide-y">
        {orders.map((order)=><><tr key={order.id}><td className="px-5 py-4 font-bold text-forest-700">{order.kode_pesanan}</td><td className="px-5 py-4"><b>{order.nama_pemesan}</b><small className="mt-1 block text-slate-500">{order.nama_sekolah||"—"}</small></td><td className="px-5 py-4 font-bold">{rupiah(order.total_harga)}</td><td className="px-5 py-4 text-slate-500">{new Date(order.dibuat_pada).toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"})}</td><td className="px-5 py-4 text-right"><button className="btn-secondary px-2.5 py-2" onClick={()=>setExpanded(expanded===order.id?null:order.id)}>{expanded===order.id?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</button></td></tr>
          {expanded===order.id&&<tr key={`${order.id}-detail`}><td colSpan={5} className="bg-slate-50 px-5 py-4"><div className="grid gap-4 md:grid-cols-2"><div><b className="text-xs uppercase tracking-wide text-slate-500">Item pesanan</b><div className="mt-2 space-y-2">{order.detail_pesanan.map((item)=><div key={item.id} className="flex justify-between gap-4"><span>{item.nama_produk} × {item.jumlah} <small className="text-slate-400">({rupiah(item.harga_satuan)}/item)</small></span><b>{rupiah(item.subtotal)}</b></div>)}</div></div><div><b className="text-xs uppercase tracking-wide text-slate-500">Informasi pemesan</b><p className="mt-2">Telepon: {order.telepon_pemesan||"—"}</p><p className="mt-1">Catatan: {order.catatan||"—"}</p></div></div></td></tr>}</>)}
        {!orders.length&&<tr><td colSpan={5} className="p-10 text-center text-slate-500">{loading?"Memuat pesanan...":"Belum ada pesanan."}</td></tr>}
      </tbody></table></div>
    </section>
  </div>;
}
