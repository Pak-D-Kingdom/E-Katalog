# E-Katalog MBG

Aplikasi web full-stack untuk mengelola katalog Makan Bergizi Gratis (MBG), menampilkan menu kepada pengunjung, dan mencatat pesanan yang dikirim melalui WhatsApp.

## Fitur

- **Katalog publik:** pencarian, filter kategori, detail produk, informasi gizi, dan unduhan pricelist PDF sesuai filter yang aktif.
- **Keranjang belanja:** tersimpan di `localStorage`, dengan subtotal otomatis.
- **Checkout WhatsApp:** data pesanan disimpan beserta snapshot harga dan nama produk sebelum WhatsApp dibuka.
- **Dashboard admin:** autentikasi dan pengelolaan produk, kategori, riwayat pesanan, serta pengaturan katalog.
- **Upload foto produk:** gambar JPG, PNG, WebP, atau AVIF hingga 5 MB ke `public/uploads`.

## Teknologi

- Next.js App Router, React, dan TypeScript
- Tailwind CSS
- MySQL dan Prisma ORM
- Autentikasi JWT dengan cookie HTTP-only
- bcryptjs untuk hash kata sandi

## Persyaratan

- Node.js **20.9 atau lebih baru**
- MySQL **8 atau lebih baru**
- npm

## Instalasi dan menjalankan

### 1. Siapkan database

Pastikan MySQL aktif, lalu buat database:

```sql
CREATE DATABASE e_katalog_mbg
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 2. Atur environment

Di PowerShell, dari folder proyek:

```powershell
Copy-Item .env.example .env
```

Atur isi `.env` sesuai koneksi MySQL. Contoh untuk MySQL lokal tanpa kata sandi:

```env
DATABASE_URL="mysql://root@localhost:3306/e_katalog_mbg"
AUTH_SECRET="isi-dengan-secret-acak-minimal-32-karakter"
SERPAPI_API_KEY="isi-dengan-api-key-serpapi"
```

`SERPAPI_API_KEY` diperlukan untuk menggunakan fitur Image Finder. Tanpanya, pencarian gambar dan informasi kuota tidak tersedia.

Jika MySQL menggunakan kata sandi:

```env
DATABASE_URL="mysql://root:KATA_SANDI@localhost:3306/e_katalog_mbg"
```

Buat nilai acak untuk `AUTH_SECRET` menggunakan:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Simpan hasilnya di `.env` dan jangan bagikan atau commit file `.env`.

### 3. Instal dependensi dan siapkan tabel

```powershell
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

Jalankan `npm run db:push` lagi setelah memperbarui kode yang menambahkan perubahan skema. Ini membuat tabel Image Finder yang dibutuhkan aplikasi.

### 4. Jalankan aplikasi

Untuk pengembangan:

```powershell
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Untuk produksi, buat build lalu jalankan server standalone:

```powershell
npm run build
npm run start
```

Proses build juga menyalin aset `public` dan `.next/static` ke folder standalone agar halaman dan stylesheet tersaji saat server dijalankan.

## Akun admin awal

Setelah menjalankan seed:

| Kolom | Nilai |
|---|---|
| Email | `admin@mbg.local` |
| Kata sandi | `Admin123!` |
| Halaman login | [http://localhost:3000/admin/login](http://localhost:3000/admin/login) |

Segera ganti kata sandi awal sebelum aplikasi digunakan secara publik.

## Halaman dan API

| Kegunaan | Rute |
|---|---|
| Beranda | `/` |
| Katalog publik | `/katalog` |
| Login admin | `/admin/login` |
| Dashboard admin | `/admin` |
| Produk admin | `/admin/produk` |
| Kategori admin | `/admin/kategori` |
| Riwayat pesanan | `/admin/pesanan` |
| Pengaturan katalog | `/admin/pengaturan` |
| Produk API | `GET, POST /api/produk`; `PUT, DELETE /api/produk/:id` |
| Kategori API | `GET, POST /api/kategori`; `PUT, DELETE /api/kategori/:id` |
| Pengaturan API | `GET, PUT /api/pengaturan` |
| Pesanan API | `POST /api/pesanan`; daftar admin `GET /api/pesanan` |
| Upload foto | `POST /api/upload` |
| Autentikasi | `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` |

Operasi admin pada API memerlukan sesi login. Endpoint pesanan menghitung ulang harga dan memeriksa ketersediaan produk dari database.

## Perintah npm

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Menjalankan server pengembangan |
| `npm run build` | Membuat build produksi |
| `npm run start` | Menjalankan server standalone dari build produksi |
| `npm run lint` | Menjalankan ESLint |
| `npm run db:generate` | Membuat Prisma Client |
| `npm run db:push` | Menyelaraskan skema ke database |
| `npm run db:seed` | Mengisi akun admin dan data contoh |

## Struktur proyek

```text
prisma/
  schema.prisma          Skema database
  seed.ts                Data awal
public/
  uploads/               Foto produk yang diunggah
src/
  app/
    admin/               Login dan halaman dashboard
    api/                 Route handlers API
    katalog/             Halaman katalog publik
    globals.css          Gaya global
    layout.tsx           Layout dan metadata aplikasi
    page.tsx             Beranda
  components/            Komponen katalog dan dashboard
  lib/                   Prisma, autentikasi, validasi, dan tipe
```
