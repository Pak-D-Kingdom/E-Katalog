import { prisma } from "@/lib/prisma";

const LIMIT_PRODUK_UNGGULAN = 4;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

// Mengurutkan penjualan terbesar ke terkecil.
// Produk dengan jumlah penjualan sama diacak.
function sortBySales<T>(
  items: T[],
  getSales: (item: T) => number
): T[] {
  const groups = new Map<number, T[]>();

  for (const item of items) {
    const score = getSales(item);
    const group = groups.get(score) ?? [];

    group.push(item);
    groups.set(score, group);
  }

  const scores = [...groups.keys()].sort((a, b) => b - a);

  return scores.flatMap((score) =>
    shuffle(groups.get(score) ?? [])
  );
}

export async function getProdukUnggulanPerKategori() {
  // Mengambil penjualan lunas, seluruh kategori,
  // dan produk yang masih tersedia.
  const [penjualan, kategoriList, semuaProduk] = await Promise.all([
    prisma.detail_pesanan.groupBy({
      by: ["produk_id"],
      where: {
        produk_id: {
          not: null,
        },
        pesanan: {
          is: {
            status_pembayaran: "lunas",
            status_pesanan: {
              not: "dibatalkan",
            },
          },
        },
      },
      _sum: {
        jumlah: true,
      },
    }),

    prisma.kategori.findMany({
      orderBy: {
        nama_kategori: "asc",
      },
      select: {
        id: true,
        nama_kategori: true,
      },
    }),

    prisma.produk.findMany({
      where: {
        tersedia: true,
        kategori_id: {
          not: null,
        },
      },
      include: {
        kategori: true,
        subkategori: true,
      },
    }),
  ]);

  // Membuat peta total unit terjual berdasarkan ID produk.
  const totalTerjualMap = new Map<number, number>();

  for (const item of penjualan) {
    if (item.produk_id !== null) {
      totalTerjualMap.set(
        item.produk_id,
        item._sum.jumlah ?? 0
      );
    }
  }

  // Mengelompokkan produk berdasarkan kategori.
  const produkPerKategori = new Map<
    number,
    typeof semuaProduk
  >();

  for (const produk of semuaProduk) {
    if (produk.kategori_id === null) continue;

    const daftar = produkPerKategori.get(produk.kategori_id) ?? [];

    daftar.push(produk);
    produkPerKategori.set(produk.kategori_id, daftar);
  }

  // Menentukan maksimal empat produk unggulan untuk setiap kategori.
  const kategoriUnggulan = kategoriList
    .map((kategori) => {
      const daftarProduk =
        produkPerKategori.get(kategori.id) ?? [];

      // Produk yang sudah memiliki penjualan lunas.
      const produkTerjual = daftarProduk.filter(
        (produk) => (totalTerjualMap.get(produk.id) ?? 0) > 0
      );

      const produkTerurut = sortBySales(
        produkTerjual,
        (produk) => totalTerjualMap.get(produk.id) ?? 0
      );

      // Mengambil maksimal empat produk dengan penjualan tertinggi.
      const produkPilihan = produkTerurut.slice(
        0,
        LIMIT_PRODUK_UNGGULAN
      );

      // Jika slot masih kosong, isi dengan produk yang belum terjual.
      const jumlahSlotKosong =
        LIMIT_PRODUK_UNGGULAN - produkPilihan.length;

      if (jumlahSlotKosong > 0) {
        const produkBelumTerjual = daftarProduk.filter(
          (produk) => (totalTerjualMap.get(produk.id) ?? 0) === 0
        );

        produkPilihan.push(
          ...shuffle(produkBelumTerjual).slice(0, jumlahSlotKosong)
        );
      }

      return {
        id: kategori.id,
        nama_kategori: kategori.nama_kategori,
        produk: produkPilihan,
        totalProdukUnggulan: produkPilihan.length,
      };
    })
    // Kategori tanpa produk tersedia tidak perlu ditampilkan.
    .filter((kategori) => kategori.produk.length > 0);

  return {
    kategori: kategoriUnggulan,
    totalProdukUnggulan: kategoriUnggulan.reduce(
      (total, kategori) => total + kategori.produk.length,
      0
    ),
  };
}