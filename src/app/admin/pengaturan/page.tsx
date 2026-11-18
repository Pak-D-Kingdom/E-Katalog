"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, MessageCircle, Save } from "lucide-react";
import { api } from "@/lib/types";

type Settings = { nama_instansi:string; nomor_whatsapp:string; alamat:string|null; template_pesan:string };
const initial:Settings={nama_instansi:"",nomor_whatsapp:"",alamat:"",template_pesan:"Halo {nama_instansi}, saya {nama_pemesan} dari {nama_sekolah} ingin memesan:\n{daftar_pesanan}\nTotal: {total_harga}\nCatatan: {catatan}\nKode pesanan: {kode_pesanan}"};
const variables=["{nama_instansi}","{nama_pemesan}","{nama_sekolah}","{telepon_pemesan}","{daftar_pesanan}","{total_harga}","{catatan}","{kode_pesanan}"];

export default function SettingsPage() {
  const [form,setForm]=useState<Settings>(initial);
  const [error,setError]=useState("");const [message,setMessage]=useState("");const [loading,setLoading]=useState(false);
  useEffect(()=>{api<{pengaturan:Settings|null}>("/api/pengaturan").then(({pengaturan})=>{if(pengaturan)setForm(pengaturan);}).catch((e:Error)=>setError(e.message));},[]);
  async function submit(e:FormEvent){e.preventDefault();setError("");setMessage("");setLoading(true);try{const result=await api<{pengaturan:Settings}>("/api/pengaturan",{method:"PUT",body:JSON.stringify(form)});setForm(result.pengaturan);setMessage("Pengaturan berhasil disimpan.");}catch(e){setError((e as Error).message);}finally{setLoading(false);}}
  return <div>
    <div className="mb-5"><h2 className="text-xl font-black">Pengaturan katalog</h2><p className="mt-1 text-sm text-slate-500">Informasi instansi dan format pesan saat pemesanan.</p></div>
    <form onSubmit={submit} className="card max-w-3xl space-y-5 p-5 sm:p-7">
      <div><label className="label">Nama instansi</label><input required maxLength={191} className="field" value={form.nama_instansi} onChange={(e)=>setForm({...form,nama_instansi:e.target.value})}/></div>
      <div><label className="label">Nomor WhatsApp tujuan</label><input required type="tel" className="field" placeholder="6281234567890" value={form.nomor_whatsapp} onChange={(e)=>setForm({...form,nomor_whatsapp:e.target.value})}/><small className="mt-1 block text-slate-400">Gunakan kode negara, misalnya 62 untuk Indonesia.</small></div>
      <div><label className="label">Alamat (opsional)</label><textarea className="field min-h-20" value={form.alamat||""} onChange={(e)=>setForm({...form,alamat:e.target.value||null})}/></div>
      <div><label className="label">Template pesan WhatsApp</label><textarea required className="field min-h-48 font-mono text-sm" value={form.template_pesan} onChange={(e)=>setForm({...form,template_pesan:e.target.value})}/><div className="mt-3"><small className="font-bold text-slate-500">Variabel yang tersedia:</small><div className="mt-2 flex flex-wrap gap-2">{variables.map(v=><code key={v} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-forest-700">{v}</code>)}</div></div></div>
      {error&&<div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}{message&&<div role="status" className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700"><Check size={17}/>{message}</div>}
      <div className="rounded-xl bg-forest-50 p-4 text-sm text-forest-900"><div className="flex items-center gap-2 font-bold"><MessageCircle size={17}/>Format pesan bisa dipersonalisasi</div><p className="mt-1 text-forest-800/75">Pesan berisi item, total, dan kode pesanan yang tercatat di sistem.</p></div>
      <div className="flex justify-end"><button disabled={loading} className="btn-primary"><Save size={17}/>{loading?"Menyimpan...":"Simpan pengaturan"}</button></div>
    </form>
  </div>;
}
