export type CropPlan = {
  id: string;
  cropName: string;
  plotName: string;
  areaFeddan: number | null;
  plannedPlanting: string;
  expectedHarvest: string;
  expectedQuantityKg: number | null;
  status: "planned" | "growing" | "harvested" | "cancelled";
  notes: string;
};

export const cropStatusLabels: Record<CropPlan["status"], string> = {
  planned: "مخطط له",
  growing: "قيد الزراعة",
  harvested: "تم الحصاد",
  cancelled: "ملغي",
};
