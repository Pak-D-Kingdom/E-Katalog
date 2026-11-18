"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ImagePlus, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { api, Category, Product, rupiah, slugify } from "@/lib/types";

type FormData = {
  kategori_id: string; kode_produk: string; nama_produk: string; slug: string; deskripsi: string;
  kalori: string; protein: string; karbohidrat: string; lemak: string; harga: string;
  satuan: string; foto_url: string; tersedia: boolean;
};
const empty: FormData = { kategori_id: "", kode_produk: "", nama_produk: "", slug: "", deskripsi: "", kalori: "0", protein: "0", karbohidrat: "0", lemak: "0", harga: "", satuan: "porsi", foto_url: "", tersedia: true };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormData>(empty);
  const [editing, setEditing] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const [p, c] = await Promise.all([api<{produk:Product[]}>("/api/produk"), api<{kategori:Category[]}>("/api/kategori")]);
    setProducts(p.produk); setCategories(c.kategori);
  }
  useEffect(() => { load().catch((e: Error) => setError(e.message)); }, []);

  function startEdit(product?: Product) {
    if (product) {
      setEditing(product.id);
      setForm({
        kategori_id: product.kategori_id ? String(product.kategori_id) : "",
        kode_produk: product.kode_produk, nama_produk: product.nama_produk, slug: product.slug, deskripsi: product.deskripsi,
        kalori: String(product.informasi_gizi.kalori), protein: String(product.informasi_gizi.protein),
        karbohidrat: String(product.informasi_gizi.karbohidrat), lemak: String(product.informasi_gizi.lemak),
        harga: String(product.harga), satuan: product.satuan, foto_url: product.foto_url || "", tersedia: product.tersedia
      });
    } else { setEditing(null); setForm(empty); }
    setError(""); setOpen(true);
  }
  function changeName(value: string) {
    setForm((current) => ({ ...current, nama_produk: value, ...(editing ? {} : { slug: slugify(value) }) }));
  }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData(); body.append("file", file);
    try { const result = await api<{foto_url:string}>("/api/upload", { method:"POST", body }); setForm((f) => ({...f,foto_url:result.foto_url})); }
    catch(e) { setError((e as Error).message); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    const payload = {
      kategori_id: form.kategori_id ? Number(form.kategori_id) : null,
      kode_produk: form.kode_produk, nama_produk: form.nama_produk, slug: form.slug, deskripsi: form.deskripsi,
      informasi_gizi: { kalori: Number(form.kalori), protein: Number(form.protein), karbohidrat: Number(form.karbohidrat), lemak: Number(form.lemak) },
      harga: Number(form.harga), satuan: form.satuan, foto_url: form.foto_url || null, tersedia: form.tersedia
    };
    try {
      await api(editing ? `/api/produk/${editing}` : "/api/produk", { method: editing ? "PUT" : "POST", body: JSON.stringify(payload) });
      setOpen(false); await load();
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  async function remove(id: number) {
    if (!window.confirm("Hapus produk ini? Riwayat pesanan tetap menyimpan snapshot item.")) return;
    try { await api(`/api/produk/${id}`, {method:"DELETE"}); await load(); }
    catch (e) { setError((e as Error).message); }
  }
  const filtered = products.filter((p) => `${p.nama_produk} ${p.kode_produk}`.toLowerCase().includes(query.toLowerCase()));

  return <div>
    <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-xl font-black">Daftar produk</h2><p className="mt-1 text-sm text-slate-500">Atur menu dan informasi gizi untuk katalog publik.</p></div><button onClick={() => startEdit()} className="btn-primary"><Plus size={18}/>Tambah produk</button></div>
    {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="card overflow-hidden"><div className="border-b p-4"><label className="relative block max-w-sm"><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="field field-with-icon py-2.5" placeholder="Cari nama atau kode produk..." value={query} onChange={(e)=>setQuery(e.target.value)}/></label></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Produk</th><th className="px-5 py-3">Kategori</th><th className="px-5 py-3">Harga</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Aksi</th></tr></thead><tbody className="divide-y">
        {filtered.map((p)=><tr key={p.id}><td className="px-5 py-4"><b>{p.nama_produk}</b><small className="mt-1 block text-slate-500">{p.kode_produk}</small></td><td className="px-5 py-4">{p.kategori?.nama_kategori||"Tanpa kategori"}</td><td className="px-5 py-4 font-bold">{rupiah(p.harga)}<small className="ml-1 font-normal text-slate-400">/{p.satuan}</small></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.tersedia?"bg-green-50 text-green-700":"bg-slate-100 text-slate-500"}`}>{p.tersedia?"Tersedia":"Nonaktif"}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={()=>startEdit(p)} className="btn-secondary px-2.5 py-2" aria-label="Edit"><Pencil size={16}/></button><button onClick={()=>remove(p.id)} className="btn-danger" aria-label="Hapus"><Trash2 size={16}/></button></div></td></tr>)}
        {!filtered.length && <tr><td colSpan={5} className="p-10 text-center text-slate-500">Belum ada produk yang cocok.</td></tr>}
      </tbody></table></div>
    </div>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(e)=>e.target===e.currentTarget&&setOpen(false)}><div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 sm:p-7">
      <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black">{editing?"Edit produk":"Tambah produk"}</h2><p className="text-sm text-slate-500">Lengkapi detail menu MBG.</p></div><button onClick={()=>setOpen(false)} className="rounded-full bg-slate-100 p-2"><X size={18}/></button></div>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Nama produk</label><input required className="field" value={form.nama_produk} onChange={(e)=>changeName(e.target.value)}/></div>
        <div><label className="label">Kode produk</label><input required className="field" value={form.kode_produk} onChange={(e)=>setForm({...form,kode_produk:e.target.value})}/></div>
        <div><label className="label">Slug URL</label><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="field" value={form.slug} onChange={(e)=>setForm({...form,slug:e.target.value})}/></div>
        <div><label className="label">Kategori</label><select className="field" value={form.kategori_id} onChange={(e)=>setForm({...form,kategori_id:e.target.value})}><option value="">Tanpa kategori</option>{categories.map((c)=><option key={c.id} value={c.id}>{c.nama_kategori}</option>)}</select></div>
        <div className="sm:col-span-2"><label className="label">Deskripsi</label><textarea required className="field min-h-24" value={form.deskripsi} onChange={(e)=>setForm({...form,deskripsi:e.target.value})}/></div>
        <div><label className="label">Harga (Rp)</label><input required type="number" min="1" step="1" className="field" value={form.harga} onChange={(e)=>setForm({...form,harga:e.target.value})}/></div>
        <div><label className="label">Satuan</label><input required className="field" value={form.satuan} onChange={(e)=>setForm({...form,satuan:e.target.value})}/></div>
        <div className="sm:col-span-2"><label className="label">Informasi gizi</label><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{(["kalori","protein","karbohidrat","lemak"] as const).map((key)=><div key={key}><small className="mb-1 block capitalize text-slate-500">{key}</small><input type="number" min="0" step="0.1" required className="field" value={form[key]} onChange={(e)=>setForm({...form,[key]:e.target.value})}/></div>)}</div><small className="mt-1 block text-slate-400">Kalori dalam kkal; protein, karbohidrat, dan lemak dalam gram.</small></div>
        <div className="sm:col-span-2"><label className="label">Foto produk</label><div className="flex flex-col gap-2 sm:flex-row"><input className="field" placeholder="URL gambar (opsional)" value={form.foto_url} onChange={(e)=>setForm({...form,foto_url:e.target.value})}/><label className="btn-secondary shrink-0"><ImagePlus size={17}/>Upload<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={upload}/></label></div></div>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.tersedia} onChange={(e)=>setForm({...form,tersedia:e.target.checked})} className="h-4 w-4 accent-forest-600"/>Tampilkan sebagai tersedia</label>
        {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error}</div>}
        <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={()=>setOpen(false)} className="btn-secondary">Batal</button><button disabled={loading} className="btn-primary">{loading?"Menyimpan...":editing?"Simpan perubahan":"Simpan produk"}</button></div>
      </form>
    </div></div>}
  </div>;
}
