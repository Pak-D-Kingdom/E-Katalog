import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categoryData = [
  { key: "equipment", nama_kategori: "Peralatan", slug: "peralatan", previousSlug: "peralatan-dapur" },
  { key: "supply", nama_kategori: "Bahan Baku", slug: "bahan-baku", previousSlug: "bahan-baku-food-supplies" },
  { key: "legal", nama_kategori: "Perizinan", slug: "perizinan", previousSlug: "perizinan-legalitas" },
  { key: "maintenance", nama_kategori: "Perawatan", slug: "perawatan", previousSlug: "perawatan-maintenance" }
] as const;

const productData = [
  { category: "equipment", code: "DK-RNG-4BOV", name: "Heavy Duty 4-Burner Range with Oven", slug: "heavy-duty-4-burner-range-oven", description: "Dirancang untuk dapur komersial bertekanan tinggi dengan 4 tungku api, oven terintegrasi, dan konstruksi stainless steel heavy duty.", price: 32500000, unit: "unit" },
  { category: "equipment", code: "DK-DFY-E24L", name: "Double Tank Electric Deep Fryer 12L+12L", slug: "double-tank-electric-deep-fryer-24l", description: "Dua reservoir independen dengan sistem kontrol termostat digital presisi, drain valve, dan kapasitas produksi tinggi.", price: 8900000, unit: "unit" },
  { category: "equipment", code: "DK-REF-UP4D", name: "Upright Chiller 4-Door SS304 1000L", slug: "upright-chiller-4-door-1000l", description: "Kulkas komersial tegak 4 pintu bervolume 1000 liter dengan kompresor Embraco untuk menjaga kesegaran bahan baku.", price: 26500000, unit: "unit" },
  { category: "equipment", code: "DK-MIX-PL20", name: "Planetary Mixer 20L Heavy Duty", slug: "planetary-mixer-20l-heavy-duty", description: "Mixer adonan roti dan pastry kapasitas bowl 20 liter, dilengkapi 3 variasi pengaduk untuk kebutuhan produksi.", price: 11200000, unit: "unit" },
  { category: "equipment", code: "DK-EXH-BF24", name: "Hood Exhaust Stainless Steel + Baffle Filter 240cm", slug: "hood-exhaust-stainless-baffle-filter-240cm", description: "Kap penghisap asap komersial panjang 2,4 m dengan baffle filter, panel stainless steel, dan sistem ducting.", price: 15800000, unit: "unit" },
  { category: "supply", code: "DK-FOD-BSM58", name: "Beras Premium Basmati & Pandan Wangi 50Kg", slug: "beras-premium-basmati-pandan-wangi-50kg", description: "Karung beras kemasan bulk horeca beras pulen aromatik higienis tanpa pemutih dan pestisida.", price: 820000, unit: "karung 50 kg" },
  { category: "supply", code: "DK-FOD-MYK18", name: "Minyak Goreng Kelapa Sawit Jerigen 18L", slug: "minyak-goreng-kelapa-sawit-18l", description: "Minyak goreng kelapa sawit bermutu tinggi dengan tingkat asap (smoke point) optimal untuk operasional dapur.", price: 340000, unit: "jerigen" },
  { category: "supply", code: "DK-FOD-AYN10", name: "Ayam Broiler Karkas Frozen 1.0-1.2kg (Per Dus 10kg)", slug: "ayam-broiler-karkas-frozen-10kg", description: "Daging ayam karkas utuh beku sistem blast freezing -40°C tanpa pengeras, higienis dan terjaga rantai dinginnya.", price: 380000, unit: "dus 10 kg" },
  { category: "supply", code: "DK-SUP-BX500", name: "Food Grade Biodegradable Meal Box 500pcs", slug: "food-grade-biodegradable-meal-box-500pcs", description: "Kemasan bento dan take-away ramah lingkungan berbasis serat tebu (bagasse), aman untuk makanan dan mudah terurai.", price: 450000, unit: "pak" },
  { category: "supply", code: "DK-SUP-GLV100", name: "Nitrile Food Prep Gloves Powder-Free (Box 100)", slug: "nitrile-food-prep-gloves-powder-free-100", description: "Sarung tangan nitril food grade tebal bebas serbuk, tidak berbau, berekstensi food-safe dan nyaman dipakai.", price: 95000, unit: "box" },
  { category: "legal", code: "DK-SRV-SLHS1", name: "Pengurusan Sertifikat Laik Higiene Sanitasi (SLHS)", slug: "pengurusan-sertifikat-laik-higiene-sanitasi", description: "Jasa asistensi lengkap audit sanitasi dapur restoran, uji lab sampel makanan dan air, serta pendampingan dokumen SLHS.", price: 8500000, unit: "layanan" },
  { category: "legal", code: "DK-SRV-HACCP", name: "Penyusunan HACCP Plan & Validasi Keamanan Dapur", slug: "penyusunan-haccp-plan-validasi-keamanan", description: "Penyusunan 12 langkah HACCP, identifikasi bahaya kritis (CCP), pembuatan flow chart proses, dan validasi ahli.", price: 16000000, unit: "layanan" },
  { category: "legal", code: "DK-SRV-IPAL3", name: "Konsultasi & Pengolahan Limbah IPAL Komersial", slug: "konsultasi-pengolahan-limbah-ipal-komersial", description: "Perancangan teknis Instalasi Pengolahan Air Limbah (IPAL) dapur restoran dan pengurusan persetujuan lingkungan.", price: 22500000, unit: "layanan" },
  { category: "legal", code: "DK-SRV-ERL18", name: "Audit Uji Emisi & Ducting Exhaust Dapur Restoran", slug: "audit-uji-emisi-ducting-exhaust", description: "Pengujian laju air udara cerobong, emisi partikulat gas buang, kebisingan blower, dan evaluasi instalasi exhaust.", price: 7500000, unit: "layanan" },
  { category: "maintenance", code: "DK-MNT-PEST4", name: "Paket Pest Control Dapur Bulanan (4x Kunjungan)", slug: "paket-pest-control-dapur-bulanan", description: "Pembasmian kecoa, germat, lalat, dan tikus menggunakan gel baiting food-safe serta perangkap UV.", price: 2800000, unit: "bulan" },
  { category: "maintenance", code: "DK-MNT-GAS01", name: "Preventive Maintenance Kompor & Pipa Gas Sentral", slug: "preventive-maintenance-kompor-pipa-gas", description: "Servis berkala pembersihan spuyer burner, kalibrasi regulator manifold, deteksi kebocoran, dan uji tekanan gas.", price: 1500000, unit: "kunjungan" },
  { category: "maintenance", code: "DK-MNT-GRS92", name: "Hydro Jetting & Grease Trap Cleaning Service", slug: "hydro-jetting-grease-trap-cleaning", description: "Penyedotan dan pengerukan lemak pekat bak grease trap disertai pembersihan pipa saluran dapur.", price: 1950000, unit: "layanan" },
  { category: "maintenance", code: "DK-MNT-REF34", name: "Service Re-Gassing & Chiller Overhaul", slug: "service-regassing-chiller-overhaul", description: "Perbaikan sistem pendingin komersial meliputi pembersihan kondenser, flushing, dan pengisian refrigerant.", price: 2200000, unit: "layanan" }
] as const;

async function main() {
  const kataSandi = await bcrypt.hash("Admin123!", 12);
  await prisma.admin.upsert({
    where: { email: "admin@mbg.local" },
    update: {},
    create: { nama: "Administrator DapurKita", email: "admin@mbg.local", kata_sandi: kataSandi }
  });

  const categories = new Map<string, number>();
  for (const item of categoryData) {
    const existingCategory = await prisma.kategori.findUnique({ where: { slug: item.slug } })
      ?? await prisma.kategori.findUnique({ where: { slug: item.previousSlug } });
    const category = existingCategory
      ? await prisma.kategori.update({
        where: { id: existingCategory.id },
        data: { nama_kategori: item.nama_kategori, slug: item.slug }
      })
      : await prisma.kategori.create({
        data: { nama_kategori: item.nama_kategori, slug: item.slug }
      });
    categories.set(item.key, category.id);
  }

  for (const item of productData) {
    await prisma.produk.upsert({
      where: { kode_produk: item.code },
      update: {},
      create: {
        kategori_id: categories.get(item.category)!,
        kode_produk: item.code,
        nama_produk: item.name,
        slug: item.slug,
        deskripsi: item.description,
        informasi_gizi: { kalori: 0, protein: 0, karbohidrat: 0, lemak: 0 },
        harga: item.price,
        satuan: item.unit
      }
    });
  }

  await prisma.pengaturan_katalog.upsert({
    where: { id: 1 },
    update: {
      nama_instansi: "DapurKita",
      nomor_whatsapp: "622155578900",
      alamat: "Kawasan SCBD Lot 8, Jl. Jendral Sudirman, Jakarta Selatan 12190",
      template_pesan: "Halo DapurKita, saya {nama_pemesan} dari {nama_sekolah} ingin meminta penawaran:\n{daftar_pesanan}\nTotal estimasi: {total_harga}\nCatatan: {catatan}\nKode permintaan: {kode_pesanan}"
    },
    create: {
      id: 1,
      nama_instansi: "DapurKita",
      nomor_whatsapp: "622155578900",
      alamat: "Kawasan SCBD Lot 8, Jl. Jendral Sudirman, Jakarta Selatan 12190",
      template_pesan: "Halo DapurKita, saya {nama_pemesan} dari {nama_sekolah} ingin meminta penawaran:\n{daftar_pesanan}\nTotal estimasi: {total_harga}\nCatatan: {catatan}\nKode permintaan: {kode_pesanan}"
    }
  });

  console.log("Seed selesai. Login admin: admin@mbg.local / Admin123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
