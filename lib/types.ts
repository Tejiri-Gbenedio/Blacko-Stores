export interface GarmentVariantDTO {
  id: string;
  size: "S" | "M" | "L" | "XL" | string;
  chestSpec: string;
  lengthSpec: string;
  stockQty: number;
}

export interface GarmentDTO {
  id: string;
  slug: string;
  lotLabel: string;
  title: string;
  description: string;
  priceKobo: number;
  fabric: string;
  weightGsm: string;
  fit: string;
  sortOrder: number;
  frontImgUrl: string;
  sideImgUrl: string;
  backImgUrl: string;
  foldedImgUrl: string;
  onModelImgUrl?: string | null;
  variants: GarmentVariantDTO[];
}

export interface PackedBagItemDTO {
  id: string;
  variantId: string;
  garmentId: string;
  title: string;
  size: string;
  priceKobo: number;
  quantity: number;
  foldedImgUrl: string;
}
