"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { api, Category, slugify } from "@/lib/types";

export default function CategoriesPage() {
  const [categories,setCategories]=useState<Category[]>([]);
  const [name,setName]=useState(""); const [slug,setSlug]=useState(""); const [icon,setIcon]=useState("");
  const [editing,setEditing]=useState<number|null>(null); const [open,setOpen]=useState(false); const [error,setError]=useState("");
  async function load(){setCategories((await api<{kategori:Category[]}>("/api/kategori")).kategori);}
  useEffect(()=>{load().catch((e:Error)=>setError(e.message));},[]);
  function start(category?:Category){setEditing(category?.id??null);setName(category?.nama_kategori??"");setSlug(category?.slug??"");setIcon(category?.ikon_url??"");setError("");setOpen(true);}
  async function submit(e:FormEvent){e.preventDefault();setError("");try{await api(editing?`/api/kategori/${editing}`:"/api/kategori",{method:editing?"PUT":"POST",body:JSON.stringify({nama_kategori:name,slug,ikon_url:icon||null})});setOpen(false);await load();}catch(e){setError((e as Error).message);}}
  async function remove(id:number){if(!window.confirm("Hapus kategori ini? Produk terkait akan tetap ada tanpa kategori."))return;try{await api(`/api/kategori/${id}`,{method:"DELETE"});await load();}catch(e){setError((e as Error).message);}}
  return <div>
    <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-xl font-black">Kategori menu</h2><p className="mt-1 text-sm text-slate-500">Kelompokkan produk agar mudah ditemukan.</p></div><button onClick={()=>start()} className="btn-primary"><Plus size={18}/>Tambah kategori</button></div>
    {error&&!open&&<div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category)=><div key={category.id} className="card flex items-center gap-4 p-5"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-forest-50 text-forest-700">{category.ikon_url?<img src={category.ikon_url} alt="" className="h-full w-full object-cover"/>:<Tags size={20}/>}</div><div className="min-w-0 flex-1"><b className="block truncate">{category.nama_kategori}</b><small className="text-slate-400">{category.slug}</small></div><button className="btn-secondary p-2" onClick={()=>start(category)} aria-label="Edit"><Pencil size={15}/></button><button className="btn-danger p-2" onClick={()=>remove(category.id)} aria-label="Hapus"><Trash2 size={15}/></button></div>)}{!categories.length&&<div className="card p-10 text-center text-slate-500 sm:col-span-2 lg:col-span-3">Belum ada kategori.</div>}</div>
    {open&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(e)=>e.target===e.currentTarget&&setOpen(false)}><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-black">{editing?"Edit kategori":"Kategori baru"}</h2><button type="button" onClick={()=>setOpen(false)} className="rounded-full bg-slate-100 p-2"><X size={18}/></button></div><div><label className="label">Nama kategori</label><input required className="field" value={name} onChange={(e)=>{setName(e.target.value);if(!editing)setSlug(slugify(e.target.value));}}/></div><div><label className="label">Slug</label><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="field" value={slug} onChange={(e)=>setSlug(e.target.value)}/></div><div><label className="label">URL ikon (opsional)</label><input className="field" value={icon} onChange={(e)=>setIcon(e.target.value)}/></div>{error&&<div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={()=>setOpen(false)}>Batal</button><button className="btn-primary">Simpan</button></div></form></div>}
  </div>;
}
