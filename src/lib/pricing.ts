type PriceValue = number | string | { toString(): string } | null;

export type PriceFields = {
  jenis_harga: string;
  harga: PriceValue;
  harga_min: PriceValue;
  harga_max: PriceValue;
};

function samePrice(first: PriceValue, second: PriceValue): boolean {
  if (first == null || second == null) {
    return first == null && second == null;
  }

  return Number(first) === Number(second);
}

export function hasPriceChanged(
  current: PriceFields,
  next: PriceFields
): boolean {
  return (
    current.jenis_harga !== next.jenis_harga ||
    !samePrice(current.harga, next.harga) ||
    !samePrice(current.harga_min, next.harga_min) ||
    !samePrice(current.harga_max, next.harga_max)
  );
}
