import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function csvCell(value: unknown): string {
    let text = String(value ?? "");

    // Mencegah formula injection ketika dibuka di Excel.
    if (/^[=+\-@\t\r]/.test(text)) {
        text = `'${text}`;
    }

    return `"${text.replace(/"/g, '""')}"`;
}

function escapeHtml(value: unknown): string {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
        const entities: Record<string, string> = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };

        return entities[char];
    });
}

function formatRupiah(value: unknown): string {
    if (value == null) return "-";

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value));
}

export async function GET(request: Request) {
    try {
        await requireAdmin();

        const url = new URL(request.url);
        const format = url.searchParams.get("format") || "csv";
        const kategoriParam = url.searchParams.get("kategoriId");

        // Validasi format ekspor.
        if (!["csv", "xlsx", "pdf"].includes(format)) {
            return NextResponse.json(
                { error: "Format export tidak valid." },
                { status: 400 }
            );
        }

        // Validasi kategori.
        let selectedCategory: {
            id: number;
            nama_kategori: string;
        } | null = null;

        if (kategoriParam && kategoriParam !== "all") {
            const kategoriId = Number(kategoriParam);

            if (!Number.isInteger(kategoriId) || kategoriId < 1) {
                return NextResponse.json(
                    { error: "Kategori tidak valid." },
                    { status: 400 }
                );
            }

            selectedCategory = await prisma.kategori.findUnique({
                where: { id: kategoriId },
                select: {
                    id: true,
                    nama_kategori: true,
                },
            });

            if (!selectedCategory) {
                return NextResponse.json(
                    { error: "Kategori tidak ditemukan." },
                    { status: 404 }
                );
            }
        }

        // Mengambil produk sesuai kategori yang dipilih.
        const products = await prisma.produk.findMany({
            where: selectedCategory
                ? { kategori_id: selectedCategory.id }
                : undefined,

            orderBy: {
                nama_produk: "asc",
            },

            include: {
                kategori: {
                    select: {
                        nama_kategori: true,
                    },
                },
                subkategori: {
                    select: {
                        nama_subkategori: true,
                    },
                },
            },
        });

        const today = new Date().toISOString().slice(0, 10);

        const categoryName =
            selectedCategory?.nama_kategori ?? "Semua Kategori";

        const headers = [
            "ID Produk",
            "Nama Barang",
            "Kode SKU",
            "Kategori",
            "Subkategori",
            "Jenis Harga",
            "Harga Tetap (IDR)",
            "Harga Minimal (IDR)",
            "Harga Maksimal (IDR)",
            "Satuan Produk",
            "Deskripsi Lengkap",
            "Slug URL",
            "Foto URL",
            "Tersedia",
            "Dibuat Pada",
            "Diperbarui Pada",
        ];

        const rows = products.map((product) => [
            product.id,
            product.nama_produk,
            product.kode_produk,
            product.kategori?.nama_kategori ?? "",
            product.subkategori?.nama_subkategori ?? "",
            product.jenis_harga,
            product.harga == null ? "" : Number(product.harga),
            product.harga_min == null ? "" : Number(product.harga_min),
            product.harga_max == null ? "" : Number(product.harga_max),
            product.satuan,
            product.deskripsi,
            product.slug,
            product.foto_url ?? "",
            product.tersedia ? "TRUE" : "FALSE",
            product.dibuat_pada.toISOString(),
            product.diperbarui_pada.toISOString(),
        ]);

        // ==========================================
        // 1. EXPORT CSV
        // ==========================================
        if (format === "csv") {
            const csv = [
                headers.map(csvCell).join(","),
                ...rows.map((row) => row.map(csvCell).join(",")),
            ].join("\r\n");

            return new NextResponse("\uFEFF" + csv, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition":
                        `attachment; filename="katalog-produk-${today}.csv"`,
                    "Cache-Control": "no-store",
                },
            });
        }

        // ==========================================
        // 2. EXPORT EXCEL (.XLSX)
        // ==========================================
        if (format === "xlsx") {
            const workbook = new ExcelJS.Workbook();

            workbook.creator = "DapurKita";
            workbook.subject = "Data Katalog Produk";
            workbook.title = "Katalog Produk DapurKita";
            workbook.created = new Date();

            const worksheet = workbook.addWorksheet("Katalog Produk", {
                views: [
                    {
                        state: "frozen",
                        ySplit: 4,
                    },
                ],
            });

            // Lebar masing-masing kolom.
            worksheet.columns = [
                { width: 12 },
                { width: 32 },
                { width: 20 },
                { width: 28 },
                { width: 25 },
                { width: 16 },
                { width: 20 },
                { width: 20 },
                { width: 20 },
                { width: 18 },
                { width: 45 },
                { width: 28 },
                { width: 40 },
                { width: 14 },
                { width: 23 },
                { width: 23 },
            ];

            // Judul laporan.
            worksheet.mergeCells(1, 1, 1, headers.length);

            const titleCell = worksheet.getCell("A1");
            titleCell.value = "KATALOG PRODUK DAPURKITA";
            titleCell.font = {
                name: "Arial",
                size: 16,
                bold: true,
                color: { argb: "FFFFFFFF" },
            };
            titleCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF172B4D" },
            };
            titleCell.alignment = {
                horizontal: "center",
                vertical: "middle",
            };

            worksheet.getRow(1).height = 32;

            // Informasi kategori dan jumlah produk.
            worksheet.mergeCells(2, 1, 2, headers.length);

            const infoCell = worksheet.getCell("A2");
            infoCell.value =
                `Kategori: ${categoryName} | Tanggal Export: ${today} | Total Produk: ${products.length}`;

            infoCell.font = {
                name: "Arial",
                size: 10,
                color: { argb: "FF475569" },
            };

            infoCell.alignment = {
                vertical: "middle",
            };

            worksheet.getRow(2).height = 24;

            // Baris ketiga untuk jarak.
            worksheet.getRow(3).height = 10;

            // Header tabel pada baris keempat.
            const headerRow = worksheet.addRow(headers);

            headerRow.height = 32;

            headerRow.eachCell((cell) => {
                cell.font = {
                    name: "Arial",
                    size: 10,
                    bold: true,
                    color: { argb: "FFFFFFFF" },
                };

                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFA83D00" },
                };

                cell.alignment = {
                    horizontal: "center",
                    vertical: "middle",
                    wrapText: true,
                };

                cell.border = {
                    top: { style: "thin", color: { argb: "FFDCE4F0" } },
                    bottom: { style: "thin", color: { argb: "FFDCE4F0" } },
                    left: { style: "thin", color: { argb: "FFDCE4F0" } },
                    right: { style: "thin", color: { argb: "FFDCE4F0" } },
                };
            });

            // Isi tabel produk.
            products.forEach((product) => {
                const row = worksheet.addRow([
                    product.id,
                    product.nama_produk,
                    product.kode_produk,
                    product.kategori?.nama_kategori ?? "",
                    product.subkategori?.nama_subkategori ?? "",
                    product.jenis_harga,
                    product.harga == null ? null : Number(product.harga),
                    product.harga_min == null ? null : Number(product.harga_min),
                    product.harga_max == null ? null : Number(product.harga_max),
                    product.satuan,
                    product.deskripsi,
                    product.slug,
                    product.foto_url ?? "",
                    product.tersedia ? "Aktif" : "Nonaktif",
                    product.dibuat_pada,
                    product.diperbarui_pada,
                ]);

                row.height = 30;

                row.eachCell((cell) => {
                    cell.font = {
                        name: "Arial",
                        size: 10,
                        color: { argb: "FF172B4D" },
                    };

                    cell.alignment = {
                        vertical: "middle",
                        wrapText: true,
                    };

                    cell.border = {
                        bottom: {
                            style: "thin",
                            color: { argb: "FFE5EAF3" },
                        },
                    };
                });

                // Warna baris selang-seling.
                if (row.number % 2 === 1) {
                    row.eachCell((cell) => {
                        cell.fill = {
                            type: "pattern",
                            pattern: "solid",
                            fgColor: { argb: "FFF5F8FC" },
                        };
                    });
                }

                // Format harga rupiah.
                [7, 8, 9].forEach((columnNumber) => {
                    row.getCell(columnNumber).numFmt = '"Rp" #,##0';
                    row.getCell(columnNumber).alignment = {
                        horizontal: "right",
                        vertical: "middle",
                    };
                });

                // Format tanggal.
                [15, 16].forEach((columnNumber) => {
                    row.getCell(columnNumber).numFmt = "dd/mm/yyyy hh:mm";
                });
            });

            // Filter otomatis pada header tabel.
            worksheet.autoFilter = {
                from: {
                    row: 4,
                    column: 1,
                },
                to: {
                    row: Math.max(4, products.length + 4),
                    column: headers.length,
                },
            };

            // Membuat file Excel.
            const excelBuffer = await workbook.xlsx.writeBuffer();

            return new NextResponse(new Uint8Array(excelBuffer), {
                headers: {
                    "Content-Type":
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "Content-Disposition":
                        `attachment; filename="katalog-produk-${today}.xlsx"`,
                    "Cache-Control": "no-store",
                },
            });
        }

        // ==========================================
        // 3. EXPORT PDF MELALUI CETAK BROWSER
        // ==========================================

        const pdfHeaders = [
            "ID Produk",
            "Nama Barang",
            "Kode SKU",
            "Kategori",
            "Subkategori",
            "Jenis Harga",
            "Harga",
            "Satuan Produk",
            "Deskripsi Lengkap",
            "Slug URL",
            "Foto URL",
            "Status",
        ];

        const tableRows = products
            .map((product) => {
                const price =
                    product.jenis_harga === "rentang"
                        ? `${formatRupiah(product.harga_min)} - ${formatRupiah(product.harga_max)}`
                        : formatRupiah(product.harga);

                return `
          <tr>
            <td>${escapeHtml(product.id)}</td>
            <td>${escapeHtml(product.nama_produk)}</td>
            <td>${escapeHtml(product.kode_produk)}</td>
            <td>${escapeHtml(product.kategori?.nama_kategori ?? "-")}</td>
            <td>${escapeHtml(product.subkategori?.nama_subkategori ?? "-")}</td>
            <td>${escapeHtml(product.jenis_harga)}</td>
            <td>${escapeHtml(price)}</td>
            <td>${escapeHtml(product.satuan || "-")}</td>
            <td>${escapeHtml(product.deskripsi)}</td>
            <td>${escapeHtml(product.slug)}</td>
            <td>${escapeHtml(product.foto_url ?? "-")}</td>
            <td>${product.tersedia ? "Aktif" : "Nonaktif"}</td>
          </tr>
        `;
            })
            .join("");

        const html = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Export Katalog DapurKita</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            color: #172B4D;
            padding: 24px;
          }

          h1 {
            font-size: 22px;
            margin-bottom: 6px;
          }

          .meta {
            color: #64748B;
            font-size: 11px;
            margin-bottom: 20px;
          }

          .toolbar {
            margin-bottom: 18px;
          }

          button {
            border: 0;
            border-radius: 6px;
            padding: 10px 16px;
            background: #A83D00;
            color: white;
            font-weight: bold;
            cursor: pointer;
          }

          table {
            border-collapse: collapse;
            width: 100%;
            font-size: 9px;
          }

          th, td {
            border: 1px solid #DCE4F0;
            padding: 7px;
            text-align: left;
            vertical-align: top;
            overflow-wrap: anywhere;
          }

          th {
            background: #EEF3FF;
          }

          tr {
            page-break-inside: avoid;
          }

          @page {
            size: A3 landscape;
            margin: 10mm;
          }

          @media print {
            body {
              padding: 0;
            }

            .toolbar {
              display: none;
            }
          }
        </style>
      </head>

      <body>
        <div class="toolbar">
          <button onclick="window.print()">
            Cetak / Simpan sebagai PDF
          </button>
        </div>

        <h1>Katalog Produk DapurKita</h1>

        <p class="meta">
          Kategori: ${escapeHtml(categoryName)} |
          Tanggal export: ${today} |
          Total produk: ${products.length}
        </p>

        <table>
          <thead>
            <tr>
              ${pdfHeaders.map((header) =>
            `<th>${escapeHtml(header)}</th>`
        ).join("")}
            </tr>
          </thead>

          <tbody>
            ${tableRows ||
            `<tr><td colspan="${pdfHeaders.length}">Belum ada produk.</td></tr>`
            }
          </tbody>
        </table>

        <script>
          window.addEventListener("load", () => {
            setTimeout(() => window.print(), 500);
          });
        </script>
      </body>
      </html>
    `;

        return new NextResponse(html, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-store",
            },
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

        console.error("Export katalog error:", error);

        return NextResponse.json(
            { error: "Gagal mengekspor data katalog." },
            { status: 500 }
        );
    }
}