import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import sharp from "sharp";

const cwd = process.cwd();
const srcDir = path.join(cwd, "public", "brand");
const outDir = path.join(cwd, "public", "brand-optimized");

const files = fs.readdirSync(srcDir).filter(f => f.endsWith(".png")).sort();

const assetDefinitions = [
  {
    id: "01",
    category: "logos",
    categoryAr: "01_الشعارات_والأيقونات",
    nameAr: "01_الشعار_الأساسي_شفاف",
    nameEn: "01_primary_logo_transparent",
    desc: "الشعار الرسمي الأساسي بخلفية شفافة مفرغة، صالح للاستخدام على جميع الخلفيات الملونة والبيضاء والمطبوعات.",
  },
  {
    id: "02",
    category: "logos",
    categoryAr: "01_الشعارات_والأيقونات",
    nameAr: "02_الشعار_الأبيض_خلفية_فاتحة",
    nameEn: "02_white_logo_light_bg",
    desc: "نسخة الشعار الأبيض على خلفية فاتحة ومحايدة.",
  },
  {
    id: "03",
    category: "logos",
    categoryAr: "01_الشعارات_والأيقونات",
    nameAr: "03_الشعار_الأبيض_خلفية_داكنة",
    nameEn: "03_white_logo_dark_bg",
    desc: "نسخة الشعار باللون الأبيض المخصص للخلفيات الداكنة والوضع الليلي.",
  },
  {
    id: "04",
    category: "logos",
    categoryAr: "01_الشعارات_والأيقونات",
    nameAr: "04_الشعار_الدائري",
    nameEn: "04_circular_logo_badge",
    desc: "الشعار داخل ختم دائري متناسق يصلح كشارات وأختام وملصقات التغليف.",
  },
  {
    id: "05",
    category: "logos",
    categoryAr: "01_الشعارات_والأيقونات",
    nameAr: "05_أيقونة_مربعة",
    nameEn: "05_square_app_icon",
    desc: "أيقونة مربعة متناسقة تصلح كصورة رمزية (Avatar) أو Favicon أو أيقونة تطبيق.",
  },
  {
    id: "06",
    category: "social",
    categoryAr: "02_أغلفة_التواصل_الاجتماعي",
    nameAr: "06_غلاف_فيسبوك",
    nameEn: "06_facebook_cover",
    desc: "غلاف عريض مخصص لصفحات فيسبوك (Facebook Page Cover).",
  },
  {
    id: "07",
    category: "social",
    categoryAr: "02_أغلفة_التواصل_الاجتماعي",
    nameAr: "07_غلاف_يوتيوب",
    nameEn: "07_youtube_banner",
    desc: "غلاف عريض مخصص لبنر وقنوات يوتيوب (YouTube Channel Banner).",
  },
  {
    id: "08",
    category: "social",
    categoryAr: "02_أغلفة_التواصل_الاجتماعي",
    nameAr: "08_غلاف_X_ولينكدإن",
    nameEn: "08_x_twitter_linkedin_cover",
    desc: "غلاف مخصص لمنصة X (تويتر سابقاً) وحسابات لينكدإن (LinkedIn Cover).",
  },
  {
    id: "09",
    category: "logos",
    categoryAr: "01_الشعارات_والأيقونات",
    nameAr: "09_نسخة_بديلة_1",
    nameEn: "09_alternate_version_1",
    desc: "تصميم بديل للشعار بخيارات لونية وتنسيق مكمل.",
  },
  {
    id: "10",
    category: "logos",
    categoryAr: "01_الشعارات_والأيقونات",
    nameAr: "10_نسخة_ذهبية",
    nameEn: "10_golden_luxury_version",
    desc: "نسخة ذهبية فاخرة للشعار بتدرجات الإضاءة الذهبية للمناسبات والمنتجات المميزة.",
  },
];

async function run() {
  console.log("Starting brand assets optimization and organization...");

  // Setup clean directories without redundant duplicates
  const dirLogos = path.join(outDir, "01_شعارات_وأيقونات");
  const dirSocial = path.join(outDir, "02_أغلفة_التواصل_الاجتماعي");

  // Clean outDir if exists
  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(dirLogos, { recursive: true });
  fs.mkdirSync(dirSocial, { recursive: true });

  const report = [];
  let totalOrigBytes = 0;
  let totalPngBytes = 0;
  let totalWebpBytes = 0;

  for (let i = 0; i < files.length; i++) {
    const rawFileName = files[i];
    const srcFilePath = path.join(srcDir, rawFileName);
    const def = assetDefinitions[i];

    const origBuffer = fs.readFileSync(srcFilePath);
    const origSize = origBuffer.length;
    totalOrigBytes += origSize;

    const meta = await sharp(origBuffer).metadata();
    const targetDir = def.category === "logos" ? dirLogos : dirSocial;

    // 1. High-Fidelity Lossless PNG (preserved 100% exact pixels, clean UTF-8 naming)
    const targetPngName = `${def.nameAr}.png`;
    fs.writeFileSync(path.join(targetDir, targetPngName), origBuffer);
    totalPngBytes += origSize;

    // 2. Web-Ready High-Fidelity WebP (95% quality, imperceptible difference, ~80% smaller)
    const webpWebBuf = await sharp(origBuffer)
      .webp({ quality: 95, effort: 6 })
      .toBuffer();
    const targetWebpWebName = `${def.nameAr}.webp`;
    fs.writeFileSync(path.join(targetDir, targetWebpWebName), webpWebBuf);
    totalWebpBytes += webpWebBuf.length;

    const itemReport = {
      index: i + 1,
      name: def.nameAr,
      dimensions: `${meta.width} × ${meta.height} px`,
      hasAlpha: meta.hasAlpha ? "نعم (خلفية شفافة)" : "لا (خلفية مصمتة)",
      origKB: (origSize / 1024).toFixed(0),
      webReadyWebpKB: (webpWebBuf.length / 1024).toFixed(0),
      savingPercent: ((1 - webpWebBuf.length / origSize) * 100).toFixed(1) + "%",
      desc: def.desc,
    };
    report.push(itemReport);
    console.log(`[${i + 1}/10] Optimized: ${def.nameAr} (${itemReport.dimensions}) - WebP: ${itemReport.webReadyWebpKB} KB (-${itemReport.savingPercent})`);
  }

  // Create Readme Guide
  const readmeContent = `# أصول وهوية مزارع آل ياسر — AL Yasser Farms
**شعار الهوية:** الخير له أصل

تم تنظيم وضغط جميع ملفات وشعارات الهوية بأعلى دقة واحترافية وبدون أي خسارة في الجودة البصرية.

---

## 📊 مقارنة الأحجام الإجمالية:
* **الحجم الإجمالي بصيغة PNG الأصلية (دقة كاملة):** ${(totalOrigBytes / (1024 * 1024)).toFixed(2)} ميجابايت
* **الحجم الإجمالي بصيغة WebP فائقة الجودة:** ${(totalWebpBytes / (1024 * 1024)).toFixed(2)} ميجابايت
* **نسبة تقليص الحجم:** توفير هائل بنسبة ${((1 - totalWebpBytes / totalOrigBytes) * 100).toFixed(1)}% مع الحفاظ التام على حدة التفاصيل والألوان!

---

## 📁 هيكل المجلدات المنظمة:

1. \`01_شعارات_وأيقونات/\`:
   يحتوي على:
   - الشعار الأساسي المفرغ (شفاف)
   - نسخ الشعار الأبيض للخلفيات الفاتحة والداكنة
   - الشعار الدائري
   - أيقونة التطبيقات المربعة
   - النسخة البديلة والنسخة الذهبية
   *(كل صنف متوفر بصيغة PNG الأصلية + صيغة WebP المضغوطة فائقة الجودة)*

2. \`02_أغلفة_التواصل_الاجتماعي/\`:
   يحتوي على:
   - غلاف فيسبوك (Facebook Cover)
   - بنر يوتيوب (YouTube Banner)
   - غلاف X (تويتر) ولينكدإن
   *(كل غلاف متوفر بصيغة PNG الأصلية + صيغة WebP المضغوطة فائقة الجودة)*

---

## 📋 جدول تفاصيل ومقاسات الصور:

| # | اسم الملف | الأبعاد | الشفافية | حجم PNG الأصلي | حجم WebP المضغوط | نسبة التوفير | الاستخدام |
|---|---|---|---|---|---|---|---|
${report.map(r => `| ${r.index} | \`${r.name}\` | ${r.dimensions} | ${r.hasAlpha} | ${r.origKB} KB | ${r.webReadyWebpKB} KB | -${r.savingPercent} | ${r.desc} |`).join("\n")}

---
تاريخ التحديث: ${new Date().toISOString().split("T")[0]}
`;

  fs.writeFileSync(path.join(outDir, "README.md"), readmeContent, "utf8");
  fs.writeFileSync(path.join(outDir, "دليل_الشعارات_والأبعاد.txt"), readmeContent, "utf8");

  console.log("Creating ZIP archive...");
  const zipPath = path.join(cwd, "public", "brand-optimized.zip");
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  // Compress using .NET ZipFile (headless safe and fast)
  execSync(`powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${outDir}', '${zipPath}')"`);
  const zipStat = fs.statSync(zipPath);
  console.log(`ZIP created successfully: ${(zipStat.size / (1024 * 1024)).toFixed(2)} MB`);
}

run().catch(err => {
  console.error("Error optimizing brand assets:", err);
  process.exit(1);
});
