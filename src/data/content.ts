export const brand = {
  name: "مزارع آل ياسر",
  englishName: "AL Yasser Farms",
  tagline: "الخير له أصل",
};

export const navigation = [
  { href: "/", label: "الرئيسية" },
  { href: "/#about", label: "حكايتنا" },
  { href: "/shop", label: "منتجاتنا" },
  { href: "/#delivery", label: "كيف تطلب" },
];

export const categories = [
  { id: "meat", name: "اللحوم", image: "beef", detail: "لوجبة تستحق الاجتماع" },
  { id: "poultry", name: "الدواجن", image: "chicken", detail: "خيارات لمائدتك اليومية" },
  { id: "vegetables", name: "الخضروات", image: "vegetables", detail: "ألوان تفتح النفس" },
  { id: "fruit", name: "الفواكه", image: "oranges", detail: "حلاوة من الطبيعة" },
  { id: "dairy", name: "الألبان", image: "milk", detail: "لبداية يوم هادئة" },
  { id: "farm", name: "منتجات المزرعة", image: "dates", detail: "تفاصيل تكمل المائدة" },
] as const;

export type CategoryId = (typeof categories)[number]["id"];
export type Product = {
  id: string;
  name: string;
  category: CategoryId;
  image: string;
  unit: string;
  price: number;
  description: string;
};

// Design-only sample catalogue. Not a live offer, stock record, or client price list.
export const products: Product[] = [
  { id: "vegetable-basket", name: "سلة خضروات متنوعة", category: "vegetables", image: "basket", unit: "سلة · ٣ كجم", price: 45, description: "تشكيلة من ألوان الخضروات، لفكرة وجبة تبدأ من مكونات بسيطة." },
  { id: "beef", name: "قطع لحم بقري", category: "meat", image: "beef", unit: "عبوة · ١ كجم", price: 85, description: "اختيار مقترح لوصفات العائلة. تفاصيل القطع والمنشأ تعتمد لاحقًا." },
  { id: "oranges", name: "برتقال المائدة", category: "fruit", image: "oranges", unit: "عبوة · ١ كجم", price: 12, description: "لون مشرق على المائدة، وفكرة بسيطة لعصير الصباح." },
  { id: "milk", name: "حليب كامل الدسم", category: "dairy", image: "milk", unit: "عبوة · ١ لتر", price: 9, description: "من أساسيات المائدة اليومية. نوع العبوة وبيانات المنتج للاعتماد." },
  { id: "chicken", name: "صدور دجاج", category: "poultry", image: "chicken", unit: "عبوة · ١ كجم", price: 28, description: "اقتراح لوجبة يومية متعددة الوصفات، بتفاصيل تعتمد قبل البيع." },
  { id: "dates", name: "تشكيلة تمور", category: "farm", image: "dates", unit: "عبوة · ٥٠٠ جم", price: 24, description: "حلاوة تكمل قهوتك. الصنف والوزن النهائيان للاعتماد." },
  { id: "tomatoes", name: "طماطم", category: "vegetables", image: "tomatoes", unit: "عبوة · ١ كجم", price: 25, description: "مكوّن بسيط لمائدة مليانة خير. صورة وسعر توضيحيان، ويعتمد الصنف قبل البيع." },
  { id: "cucumber", name: "خيار", category: "vegetables", image: "vegetables", unit: "عبوة · ١ كجم", price: 18, description: "اختيار مقترح لمائدتك. السعر والصورة تمثيليان لحين اعتماد الكتالوج." },
];

export function displayPrice(value: number) {
  return new Intl.NumberFormat("ar", { maximumFractionDigits: 0 }).format(value);
}
