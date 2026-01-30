export const CATEGORIES = [
  "comida",
  "transporte",
  "hogar",
  "servicios",
  "salud",
  "ocio",
  "compras",
  "otros",
] as const;

export type Category = (typeof CATEGORIES)[number];
