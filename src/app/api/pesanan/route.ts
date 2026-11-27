import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const pesananSchema = z.object({
  nama_pemesan: z.string().trim().min(2).max(160),
  nama_sekolah: z.string().trim().max(191).optional().default(""),
  telepon_pemesan: z.string().trim().max(30).optional().default(""),
  catatan: z.string().trim().max(2000).optional().default(""),
  items: z.array(z.object({ produk_id: z.number().int().positive(), jumlah: z.number().int().min(1).max(500) })).min(1).max(100)
});

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    const pesanan = await prisma.riwayat_pesanan.findMany({
      where: query
        ? {
            OR: [
              { kode_pesanan: { contains: query } },
              { nama_pemesan: { contains: query } },
            ],
          }
        : {},
      include: { detail_pesanan: true },
      orderBy: { dibuat_pada: "desc" },
      take: 200
    });
    return NextResponse.json({ pesanan });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    throw error;
  }
}

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export async function POST(request: Request) {
  const parsed = pesananSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data pesanan tidak valid." }, { status: 400 });

  const consolidated = new Map<number, number>();
  for (const item of parsed.data.items) {
    const jumlah = (consolidated.get(item.produk_id) ?? 0) + item.jumlah;
    if (jumlah > 500) return NextResponse.json({ error: "Jumlah produk maksimal 500 per item." }, { status: 400 });
    consolidated.set(item.produk_id, jumlah);
  }
  const requested = Array.from(consolidated, ([produk_id, jumlah]) => ({ produk_id, jumlah }));
  const products = await prisma.produk.findMany({ where: { id: { in: requested.map((item) => item.produk_id) }, tersedia: true } });
  if (products.length !== requested.length) return NextResponse.json({ error: "Ada produk yang sudah tidak dapat dipesan. Muat ulang katalog." }, { status: 409 });
  const invalidRangeProducts = products.filter((product) => {
    if (product.jenis_harga !== "rentang") return false;
    const min = Number(product.harga_min);
    const max = Number(product.harga_max);
    return (
      product.harga_min == null ||
      product.harga_max == null ||
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      min <= 0 ||
      max < min
    );
  });

  if (invalidRangeProducts.length > 0) {
    return NextResponse.json(
      {
        error: "Ada produk dengan rentang harga yang belum valid.",
        products: invalidRangeProducts.map((product) => product.nama_produk),
      },
      { status: 400 }
    );
  }

  const invalidPriceProducts = products.filter(
    (product) =>
      product.jenis_harga !== "rentang" &&
      (product.harga == null ||
        Number(product.harga) <= 0 ||
        !Number.isFinite(Number(product.harga)))
  );

  if (invalidPriceProducts.length > 0) {
    return NextResponse.json(
      {
        error: "Ada produk yang belum memiliki harga tetap yang valid.",
        products: invalidPriceProducts.map((product) => product.nama_produk),
      },
      { status: 400 }
    );
  }
  const byId = new Map(products.map((product) => [product.id, product]));
  const items = requested.map((item) => {
    const product = byId.get(item.produk_id)!;
    const isRange = product.jenis_harga === "rentang";
    const minPrice = isRange
      ? Number(product.harga_min)
      : Number(product.harga);
    const maxPrice = isRange
      ? Number(product.harga_max)
      : minPrice;
    return {
      ...item,
      nama_produk: product.nama_produk,
      harga_satuan: minPrice,
      harga_satuan_max: isRange ? maxPrice : null,
      subtotal: minPrice * item.jumlah,
      subtotal_max: isRange ? maxPrice * item.jumlah : null,
    };
  });
  const hasRange = items.some((item) => item.harga_satuan_max !== null);
  const totalMinCents = items.reduce(
    (sum, item) => sum + Math.round(item.subtotal * 100),
    0
  );
  const totalMaxCents = items.reduce(
    (sum, item) =>
      sum + Math.round((item.subtotal_max ?? item.subtotal) * 100),
    0
  );
  const totalMin = totalMinCents / 100;
  const totalMax = totalMaxCents / 100;
  if (
    !Number.isFinite(totalMin) ||
    totalMin <= 0 ||
    !Number.isFinite(totalMax) ||
    totalMax < totalMin
  ) {
    return NextResponse.json(
      { error: "Total pesanan tidak valid." },
      { status: 400 }
    );
  }
  const totalLabel = hasRange
    ? `${rupiah(totalMin)} – ${rupiah(totalMax)} (estimasi)`
    : rupiah(totalMin);
  const settings = await prisma.pengaturan_katalog.findFirst({ orderBy: { id: "asc" } });
  if (!settings) return NextResponse.json({ error: "Pengaturan katalog belum siap." }, { status: 503 });

  const now = new Date();
  const tanggal = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  let order;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const count = await prisma.riwayat_pesanan.count({ where: { kode_pesanan: { startsWith: `MBG-${tanggal}-` } } });
    const kode_pesanan = `MBG-${tanggal}-${String(count + 1 + attempt).padStart(3, "0")}`;
    try {
      order = await prisma.riwayat_pesanan.create({
        data: {
          kode_pesanan,
          nama_pemesan: parsed.data.nama_pemesan,
          nama_sekolah: parsed.data.nama_sekolah || null,
          telepon_pemesan: parsed.data.telepon_pemesan || null,
          catatan: parsed.data.catatan || null,
          total_harga: totalMin,
          total_harga_max: hasRange ? totalMax : null,
          detail_pesanan: {
            create: items.map((item) => ({
              produk_id: item.produk_id,
              nama_produk: item.nama_produk,
              harga_satuan: item.harga_satuan,
              harga_satuan_max: item.harga_satuan_max,
              jumlah: item.jumlah,
              subtotal: item.subtotal,
              subtotal_max: item.subtotal_max,
            }))
          }
        }
      });
      break;
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "P2002")) throw error;
    }
  }
  if (!order) return NextResponse.json({ error: "Tidak dapat membuat kode pesanan. Silakan coba kembali." }, { status: 503 });

  const daftar_pesanan = items.map((item) => {
    const unitPrice = item.harga_satuan_max == null
      ? rupiah(item.harga_satuan)
      : `${rupiah(item.harga_satuan)} – ${rupiah(item.harga_satuan_max)}`;
    const subtotal = item.subtotal_max == null
      ? rupiah(item.subtotal)
      : `${rupiah(item.subtotal)} – ${rupiah(item.subtotal_max)}`;
    return `- ${item.nama_produk} x${item.jumlah} (${unitPrice}/unit; estimasi ${subtotal})`;
  }).join("\n");
  const values: Record<string, string> = {
    nama_instansi: settings.nama_instansi,
    nama_pemesan: order.nama_pemesan,
    nama_sekolah: order.nama_sekolah ?? "-",
    telepon_pemesan: order.telepon_pemesan ?? "-",
    daftar_pesanan,
    total_harga: totalLabel,
    catatan: order.catatan || "-",
    kode_pesanan: order.kode_pesanan
  };
  const text = settings.template_pesan.replace(/\{([a-z_]+)\}/g, (token, key: string) => values[key] ?? token);
  const nomor = settings.nomor_whatsapp.replace(/\D/g, "");
  const whatsapp_url = `https://wa.me/${nomor}?text=${encodeURIComponent(text)}`;
  return NextResponse.json({ kode_pesanan: order.kode_pesanan, whatsapp_url }, { status: 201 });
}
