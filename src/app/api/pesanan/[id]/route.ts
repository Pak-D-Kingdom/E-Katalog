
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { zodErrorMessage } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

const updatePesananSchema = z.object({
  status_pesanan: z.enum([
    "menunggu_konfirmasi",
    "dikonfirmasi",
    "diproses",
    "dikirim",
    "selesai",
    "dibatalkan",
  ]).optional(),

  status_pembayaran: z.enum([
    "belum_dibayar",
    "menunggu_verifikasi",
    "lunas",
    "ditolak",
    "dikembalikan",
  ]).optional(),
}).refine(
  (data) =>
    data.status_pesanan !== undefined ||
    data.status_pembayaran !== undefined,
  {
    message: "Tidak ada status yang diperbarui.",
  }
);

function getPrismaCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    return String(error.code);
  }

  return undefined;
}

// GET: Mengambil detail satu pesanan
export async function GET(
  _request: Request,
  { params }: Context
) {
  try {
    await requireAdmin();

    const id = Number((await params).id);

    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { error: "ID pesanan tidak valid." },
        { status: 400 }
      );
    }

    const pesanan = await prisma.riwayat_pesanan.findUnique({
      where: { id },
      include: {
        detail_pesanan: {
          include: {
            produk: {
              select: {
                id: true,
                kode_produk: true,
                nama_produk: true,
                foto_url: true,
              },
            },
          },
        },
      },
    });

    if (!pesanan) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ pesanan });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { error: "Tidak berizin." },
        { status: 401 }
      );
    }

    console.error("Get detail pesanan error:", error);

    return NextResponse.json(
      { error: "Gagal mengambil detail pesanan." },
      { status: 500 }
    );
  }
}

// PUT: Memperbarui status pesanan dan pembayaran
export async function PUT(
  request: Request,
  { params }: Context
) {
  try {
    await requireAdmin();

    const id = Number((await params).id);

    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { error: "ID pesanan tidak valid." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = updatePesananSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: zodErrorMessage(parsed.error),
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existing = await prisma.riwayat_pesanan.findUnique({
      where: { id },
      select: {
        id: true,
        status_pesanan: true,
        status_pembayaran: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    const nextStatusPesanan =
      parsed.data.status_pesanan ?? existing.status_pesanan;

    const nextStatusPembayaran =
      parsed.data.status_pembayaran ?? existing.status_pembayaran;

    // Pesanan yang dibatalkan tidak boleh tetap berstatus lunas.
    if (
      nextStatusPesanan === "dibatalkan" &&
      nextStatusPembayaran === "lunas"
    ) {
      return NextResponse.json(
        {
          error:
            "Pembayaran harus dikembalikan terlebih dahulu sebelum pesanan lunas dibatalkan.",
        },
        { status: 400 }
      );
    }

    // Pesanan yang sudah dibatalkan tidak bisa langsung dilunasi.
    if (
      existing.status_pesanan === "dibatalkan" &&
      nextStatusPembayaran === "lunas"
    ) {
      return NextResponse.json(
        {
          error:
            "Pesanan sudah dibatalkan dan tidak dapat ditandai lunas.",
        },
        { status: 400 }
      );
    }

    const pesanan = await prisma.riwayat_pesanan.update({
      where: { id },
      data: parsed.data,
      include: {
        detail_pesanan: true,
      },
    });

    return NextResponse.json({
      message: "Status pesanan berhasil diperbarui.",
      pesanan,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { error: "Tidak berizin." },
        { status: 401 }
      );
    }

    const code = getPrismaCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    console.error("Update pesanan error:", error);

    return NextResponse.json(
      { error: "Gagal memperbarui status pesanan." },
      { status: 500 }
    );
  }
}
