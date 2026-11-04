export type Point = { x: number; y: number };
export type Plot = { id: string; name: string; crop: string; area: number; x: number; y: number; width: number; height: number; vertices?: Point[] };
export type Group = { id: string; name: string; count: number };
export type Animal = { id: string; tag: string; groupId: string; note: string };
export type Demo = { plots: Plot[]; groups: Group[]; animals: Animal[] };

export const cropOptions = [
  { name: "أرز", kind: "rice", category: "field", color: "#74a955", caption: "حقل مائي" },
  { name: "قمح", kind: "wheat", category: "field", color: "#d4aa55", caption: "سنابل" },
  { name: "برسيم", kind: "clover", category: "field", color: "#5a944b", caption: "علف أخضر" },
  { name: "ذرة", kind: "corn", category: "field", color: "#79a84c", caption: "صفوف طويلة" },
  { name: "طماطم", kind: "tomato", category: "vegetable", color: "#be784d", caption: "ثمار" },
  { name: "بطاطس", kind: "potato", category: "vegetable", color: "#8a9460", caption: "محصول أرضي" },
  { name: "بصل", kind: "onion", category: "vegetable", color: "#82a16c", caption: "صفوف رفيعة" },
  { name: "فلفل", kind: "pepper", category: "vegetable", color: "#b96b43", caption: "ثمار ملونة" },
  { name: "خيار", kind: "cucumber", category: "vegetable", color: "#609456", caption: "نبات متسلق" },
  { name: "كوسة", kind: "zucchini", category: "vegetable", color: "#628c55", caption: "نباتات ورقية" },
  { name: "باذنجان", kind: "eggplant", category: "vegetable", color: "#776687", caption: "ثمار" },
  { name: "خضروات", kind: "vegetables", category: "vegetable", color: "#609b57", caption: "تشكيلة موسمية" },
  { name: "نخيل", kind: "palms", category: "tree", color: "#4c824b", caption: "أشجار" },
  { name: "زيتون", kind: "olive", category: "tree", color: "#72855b", caption: "أشجار" },
  { name: "موالح", kind: "citrus", category: "tree", color: "#7b9a4d", caption: "أشجار مثمرة" },
  { name: "بدون زراعة", kind: "empty", category: "other", color: "#ae926f", caption: "أرض مفتوحة" },
] as const;

export const initialDemo: Demo = {
  plots: [
    { id: "a", name: "القطعة أ", crop: "أرز", area: 2, x: 5, y: 8, width: 42, height: 38 },
    { id: "b", name: "القطعة ب", crop: "برسيم", area: 1.5, x: 52, y: 8, width: 42, height: 38 },
    { id: "c", name: "القطعة ج", crop: "بدون زراعة", area: 1, x: 5, y: 52, width: 89, height: 38 },
  ],
  groups: [{ id: "g1", name: "قطيع التربية", count: 12 }, { id: "g2", name: "قطيع التسمين", count: 8 }],
  animals: [{ id: "s1", tag: "مثال 001", groupId: "g1", note: "متابعة فردية تجريبية" }],
};
