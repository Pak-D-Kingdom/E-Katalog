
import { Pencil, Tags, Trash2 } from "lucide-react";
import type { Category } from "@/lib/types";

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  deleting?: boolean;
}

export default function CategoryCard({
  category,
  onEdit,
  onDelete,
  deleting = false,
}: CategoryCardProps) {
  return (
    <article className="group rounded-xl border border-[#E5EAF3] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#D3DDF0] hover:shadow-md">

      {/* Icon and Actions */}
      <div className="flex items-start justify-between">

        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[#EAF0FC] text-[#A83D00]">
          {category.ikon_url ? (
            <img
              src={category.ikon_url}
              alt={`Ikon ${category.nama_kategori}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Tags size={22} />
          )}
        </div>

        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={() => onEdit(category)}
            aria-label={`Edit ${category.nama_kategori}`}
            className="rounded-lg border border-[#E5EAF3] p-2 text-[#64748B] transition hover:border-[#A83D00] hover:bg-[#FFF4ED] hover:text-[#A83D00]"
          >
            <Pencil size={15} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(category.id)}
            disabled={deleting}
            aria-label={`Hapus ${category.nama_kategori}`}
            className="rounded-lg border border-[#E5EAF3] p-2 text-[#64748B] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={15} />
          </button>

        </div>
      </div>

      {/* Category Information */}
      <div className="mt-5">

        <h3 className="truncate text-sm font-bold text-[#172B4D]">
          {category.nama_kategori}
        </h3>

        <p className="mt-1 truncate text-xs text-[#94A3B8]">
          {category.slug}
        </p>

      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-[#EEF1F6] pt-3">

        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">
          Kategori katalog
        </span>

        <span className="rounded-md bg-[#EAF0FC] px-2 py-1 text-[10px] font-bold text-[#42577E]">
          Terdaftar
        </span>

      </div>

    </article>
  );
}
