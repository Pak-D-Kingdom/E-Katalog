import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const kataSandi = await bcrypt.hash("Admin123!", 12);
  await prisma.admin.upsert({
    where: { email: "admin@mbg.local" },
    update: {},
    create: { nama: "Administrator MBG", email: "admin@mbg.local", kata_sandi: kataSandi }
  });

  const makanSiang = await prisma.kategori.upsert({
    where: { slug: "paket-makan-siang" },
    update: {},
    create: { nama_kategori: "Paket Makan Siang", slug: "paket-makan-siang" }
  });
  const kudapan = await prisma.kategori.upsert({
    where: { slug: "kudapan-sehat" },
    update: {},
    create: { nama_kategori: "Kudapan Sehat", slug: "kudapan-sehat" }
  });
  await prisma.produk.upsert({
    where: { kode_produk: "MBG-001" },
    update: {},
    create: {
      kategori_id: makanSiang.id,
      kode_produk: "MBG-001",
      nama_produk: "Nasi Ayam Sehat",
      slug: "nasi-ayam-sehat",
      deskripsi: "Nasi, ayam panggang, sayuran segar, dan buah pilihan untuk menu makan siang seimbang.",
      informasi_gizi: { kalori: 520, protein: 28, karbohidrat: 64, lemak: 16 },
      harga: 15000,
      satuan: "porsi"
    }
  });
  await prisma.produk.upsert({
    where: { kode_produk: "MBG-002" },
    update: {},
    create: {
      kategori_id: kudapan.id,
      kode_produk: "MBG-002",
      nama_produk: "Paket Susu & Pisang",
      slug: "paket-susu-pisang",
      deskripsi: "Susu pasteurisasi dan pisang sebagai kudapan praktis yang bernutrisi.",
      informasi_gizi: { kalori: 210, protein: 8, karbohidrat: 38, lemak: 4 },
      harga: 7000,
      satuan: "paket"
    }
  });
  await prisma.pengaturan_katalog.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nama_instansi: "E-Katalog MBG",
      nomor_whatsapp: "6281234567890",
      alamat: null,
      template_pesan:
        "Halo {nama_instansi}, saya {nama_pemesan} dari {nama_sekolah} ingin memesan:\n{daftar_pesanan}\nTotal: {total_harga}\nCatatan: {catatan}\nKode pesanan: {kode_pesanan}"
    }
  });
  console.log("Seed selesai. Login: admin@mbg.local / Admin123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
