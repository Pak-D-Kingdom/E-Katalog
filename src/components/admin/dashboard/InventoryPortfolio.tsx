
import {
  CookingPot,
  Utensils,
  Wrench,
  BadgeCheck,
  ChartNoAxesCombined,
} from "lucide-react";

const portfolioData = [
  {
    category: "HARDWARE & MACHINERY",
    title: "Peralatan",
    percentage: 34,
    quantity: "85",
    quantityLabel: "Produk",
    valueLabel: "Valuasi Stok",
    value: "Rp 4,95 Miliar",
    icon: CookingPot,
  },
  {
    category: "BULK CONSUMABLES",
    title: "Bahan Baku",
    percentage: 35,
    quantity: "86",
    quantityLabel: "Produk",
    valueLabel: "Valuasi Stok",
    value: "Rp 2,18 Miliar",
    icon: Utensils,
  },
  {
    category: "PREVENTIVE TECHNICAL",
    title: "Perawatan",
    percentage: 18,
    quantity: "45",
    quantityLabel: "Layanan",
    valueLabel: "Pipeline Kontrak",
    value: "Rp 820 Juta",
    icon: Wrench,
  },
  {
    category: "COMPLIANCE & AUDIT",
    title: "Perizinan",
    percentage: 13,
    quantity: "32",
    quantityLabel: "Layanan",
    valueLabel: "Estimasi Omzet",
    value: "Rp 470 Juta",
    icon: BadgeCheck,
  },
];

export default function InventoryPortfolio() {
  return (
    <section className="space-y-4">
      {/* Heading */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[20px] font-bold text-[#172B4D]">
          <ChartNoAxesCombined
            size={21}
            className="text-[#596780]"
          />
          Ringkasan Portfolio & Distribusi Inventaris
        </h2>

        <p className="text-[13px] font-medium text-[#596780]">
          Total Nilai Estimasi:{" "}
          <span className="font-semibold text-[#172B4D]">
            Rp 8.420.000.000
          </span>
        </p>
      </div>

      {/* Portfolio Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {portfolioData.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.category}
              className="flex min-h-[260px] flex-col rounded-xl border border-[#E5EAF3] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              {/* Category and percentage */}
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-wide text-[#596780]">
                  {item.category}
                </span>

                <span
                  className={`text-[14px] font-bold ${
                    item.percentage >= 30
                      ? "text-[#A83D00]"
                      : "text-[#596780]"
                  }`}
                >
                  {item.percentage}%
                </span>
              </div>

              {/* Title and icon */}
              <div className="mb-3 flex min-h-[48px] items-center justify-between gap-2">
                <h3 className="text-[20px] font-semibold leading-tight text-[#172B4D]">
                  {item.title}
                </h3>

                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    item.percentage >= 30
                      ? "bg-[#F9EDE6] text-[#A83D00]"
                      : "bg-[#E8F0FF] text-[#596780]"
                  }`}
                >
                  <Icon size={19} />
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-5 h-[9px] w-full overflow-hidden rounded-full bg-[#E5EEFF]">
                <div
                  className="h-full rounded-full bg-[#A83D00] transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              {/* Information */}
              <div className="mt-auto grid grid-cols-2 gap-3 rounded-md bg-[#EEF3FF] px-3 py-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#596780]">
                    {item.quantityLabel === "Produk"
                      ? "Kuantitas SKU"
                      : "Kuantitas Paket"}
                  </p>

                  <p className="text-[16px] font-bold leading-tight text-[#172B4D]">
                    {item.quantity}
                  </p>

                  <p className="text-[15px] font-bold text-[#172B4D]">
                    {item.quantityLabel}
                  </p>
                </div>

                <div className="min-w-0 text-right">
                  <p className="text-[11px] font-medium text-[#596780]">
                    {item.valueLabel}
                  </p>

                  <p className="break-words text-[16px] font-bold leading-tight text-[#A83D00]">
                    {item.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
