"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Box, ChevronDown, Image as ImageIcon, LayoutGrid, PawPrint, Plus, RotateCcw, RotateCw, Sprout } from "lucide-react";
import { cropOptions, initialDemo, type Demo, type Plot } from "@/data/planning-demo";
import { AerialPlanner } from "./aerial-planner";

const Farm3D = dynamic(() => import("./farm-3d"), { ssr: false, loading: () => <div className="planning-scene-loading">تجهيز المشهد الثلاثي…</div> });
const storageKey = "alyasser-planning-lab-v1";

function CropMark({ name }: { name: string }) {
  const color = cropOptions.find(item => item.name === name)?.color ?? "#63834b";
  return <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true" style={{ color }}><path d="M24 42V15M24 31C14 29 11 24 10 18c8-1 12 2 14 10M24 26c9-1 14-6 15-13-9 0-13 4-15 11" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" /><path d="M9 42h30" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />{name === "طماطم" && <><circle cx="17" cy="35" r="5" fill="#b7523c" /><circle cx="31" cy="32" r="5" fill="#b7523c" /></>}{name === "قمح" && <><path d="M24 16l-6-6m6 5 6-6m-6 13-7-5m7 4 7-5" stroke="#bc9952" strokeWidth="2.5" /></>}</svg>;
}

function reflow(items: Plot[]): Plot[] {
  const columns = items.length > 4 ? 3 : 2;
  const rows = Math.ceil(items.length / columns);
  const gap = 4;
  const width = (100 - gap * (columns + 1)) / columns;
  const height = (100 - gap * (rows + 1)) / rows;
  return items.map((item, index) => ({ ...item, x: gap + (index % columns) * (width + gap), y: gap + Math.floor(index / columns) * (height + gap), width, height }));
}

export function PlanningLab() {
  const [demo, setDemo] = useState<Demo>(initialDemo);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState("a");
  const [view, setView] = useState<"aerial" | "plan" | "scene">("aerial");
  const [sceneAngle, setSceneAngle] = useState(0);
  const [cropCategory, setCropCategory] = useState("all");
  const [advanced, setAdvanced] = useState(false);
  const [tag, setTag] = useState("");
  const [animalGroup, setAnimalGroup] = useState("g1");
  useEffect(() => { const timer = window.setTimeout(() => { try { const saved = localStorage.getItem(storageKey); if (saved) setDemo(JSON.parse(saved) as Demo); } catch {} setLoaded(true); }, 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { if (loaded) localStorage.setItem(storageKey, JSON.stringify(demo)); }, [demo, loaded]);
  const plot = demo.plots.find(item => item.id === selected) ?? demo.plots[0] ?? { id: "", name: "ارسم أول قطعة", crop: "بدون زراعة", area: 0, x: 0, y: 0, width: 0, height: 0 };
  const assigned = (groupId: string) => demo.animals.filter(animal => animal.groupId === groupId).length;
  const totalSheep = demo.groups.reduce((sum, group) => sum + group.count, 0);
  const totalArea = demo.plots.reduce((sum, item) => sum + item.area, 0);
  function updatePlot(patch: Partial<Plot>) { setDemo(current => ({ ...current, plots: current.plots.map(item => item.id === plot.id ? { ...item, ...patch } : item) })); }
  function addPlot() {
    const id = crypto.randomUUID();
    setDemo(current => ({ ...current, plots: reflow([...current.plots, { id, name: `القطعة ${current.plots.length + 1}`, crop: "بدون زراعة", area: 1, x: 0, y: 0, width: 25, height: 25 }]) }));
    setSelected(id);
  }
  function addAnimal() {
    const name = tag.trim(); const group = demo.groups.find(item => item.id === animalGroup);
    if (!name || !group || assigned(group.id) >= group.count || demo.animals.some(item => item.tag === name)) return;
    setDemo(current => ({ ...current, animals: [...current.animals, { id: crypto.randomUUID(), tag: name, groupId: animalGroup, note: "" }] })); setTag("");
  }
  function reset() { if (window.confirm("إعادة المثال التجريبي إلى وضع البداية؟")) { setDemo(initialDemo); setSelected("a"); setAdvanced(false); } }
  return <main id="main" className="farm-admin planning-lab">
    <header className="planning-header"><Link href="/admin"><ArrowRight size={18} aria-hidden="true" />العودة للإدارة</Link><div><span>مختبر التخطيط</span><strong>مزارع آل ياسر</strong></div><button onClick={reset} aria-label="إعادة ضبط التجربة"><RotateCcw size={17} aria-hidden="true" />إعادة التجربة</button></header>
    <div className="planning-body">
      <div className="planning-intro"><div><p className="admin-kicker">تجربة تفاعلية · بيانات افتراضية</p><h1>خطّط أرضك كما تراها.</h1><p>أضف صورة جوية تملك حق استخدامها، وارسم القطع فوقها. اختر القطعة ومحصولها من القائمة؛ والمشهد الثلاثي متاح للتصور.</p></div><div className="planning-totals"><span><b>{demo.plots.length}</b> قطع</span><span><b>{totalArea.toLocaleString("ar-EG")}</b> فدان تقديري</span><span><b>{totalSheep}</b> رأس ضمن المجموعات</span></div></div>
      <div className="planning-layout"><section className="planning-map-panel" aria-labelledby="planning-map-title"><div className="planning-panel-head"><div><p className="admin-kicker">الخطوة ١ · صورة الأرض والقطع</p><h2 id="planning-map-title">مخطط المزرعة</h2></div><div className="planning-view-switch" role="group" aria-label="طريقة العرض"><button aria-pressed={view === "aerial"} onClick={() => setView("aerial")}><ImageIcon size={16} aria-hidden="true" />الصورة الجوية</button><button aria-pressed={view === "plan"} onClick={() => setView("plan")}><LayoutGrid size={16} aria-hidden="true" />مخطط</button><button aria-pressed={view === "scene"} onClick={() => setView("scene")}><Box size={16} aria-hidden="true" />ثلاثي</button></div></div>
        {view === "aerial" ? <AerialPlanner plots={demo.plots} selected={plot.id} onSelect={setSelected} onChange={plots => setDemo(current => ({ ...current, plots }))} /> : view === "scene" ? <div className="planning-scene"><Farm3D plots={demo.plots} selected={plot.id} angle={sceneAngle} onSelect={setSelected} /><div className="planning-scene-tip">اختر قطعة من المشهد أو القائمة</div><div className="planning-scene-rotate" role="group" aria-label="تدوير المشهد"><button aria-label="تدوير المشهد لليمين" onClick={() => setSceneAngle(value => value - Math.PI / 8)}><RotateCw size={20} aria-hidden="true" /></button><button aria-label="تدوير المشهد لليسار" onClick={() => setSceneAngle(value => value + Math.PI / 8)}><RotateCcw size={20} aria-hidden="true" /></button></div></div> : <div className="planning-map planning-map-plan" role="group" aria-label="قطع الأرض الافتراضية"><div className="planning-map-ground">{demo.plots.map(item => <button key={item.id} className={`planning-plot ${item.id === plot.id ? "selected" : ""}`} style={{ insetInlineStart: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, height: `${item.height}%` }} onClick={() => setSelected(item.id)} aria-pressed={item.id === plot.id}><span>{item.name}</span><strong>{item.crop}</strong><small>{item.area} فدان</small></button>)}</div></div>}
        <div className="planning-plot-picker" role="group" aria-label="اختيار قطعة الأرض">{demo.plots.map(item => <button key={item.id} aria-pressed={item.id === plot.id} onClick={() => setSelected(item.id)}><span className="planning-plot-dot" />{item.name}<small>{item.crop}</small></button>)}<button className="planning-new-plot" onClick={addPlot}><Plus size={17} aria-hidden="true" />قطعة جديدة</button></div>
        <p className="planning-disclaimer">المساحات بالفدان تُدخل يدويًا ولا تُستنتج من الصورة. المخطط المجسم تمثيل تقريبي لحدود القطع.</p>
      </section>
      {demo.plots.length ? <aside className="planning-editor"><div className="planning-panel-head"><div><p className="admin-kicker">الخطوة ٢ · اختر الزراعة</p><h2>{plot.name}</h2></div><Sprout size={24} aria-hidden="true" /></div><p className="planning-editor-lead">اختر محصولًا واحدًا لتشاهد شكل الزراعة في القطعة المحددة.</p><div className="planning-crop-filters" role="group" aria-label="فئات المحاصيل">{[{ id: "all", label: "الكل" }, { id: "field", label: "حقول" }, { id: "vegetable", label: "خضروات" }, { id: "tree", label: "أشجار" }].map(item => <button key={item.id} aria-pressed={cropCategory === item.id} onClick={() => setCropCategory(item.id)}>{item.label}</button>)}</div><div className="planning-crop-options" role="group" aria-label="المحاصيل المتاحة للتجربة">{cropOptions.filter(option => cropCategory === "all" || option.category === cropCategory).map(option => <button key={option.name} aria-pressed={plot.crop === option.name} onClick={() => updatePlot({ crop: option.name })}><CropMark name={option.name} /><span><strong>{option.name}</strong><small>{option.caption}</small></span></button>)}</div>
        <div className="planning-ideas"><strong>أفكار لتجربتها في المخطط</strong><p>جرّب مقارنة الأرز بالقمح أو البرسيم في القطعة نفسها. الملاءمة الحقيقية تحتاج بيانات المياه والتربة والموسم؛ هذه خيارات تصميم وليست توصية زراعية.</p><div>{["أرز","قمح","برسيم"].filter(name => name !== plot.crop).map(name => <button key={name} onClick={() => updatePlot({ crop: name })}>جرّب {name} <ArrowLeft size={14} aria-hidden="true" /></button>)}</div></div>
        <button className="planning-advanced-toggle" aria-expanded={advanced} onClick={() => setAdvanced(!advanced)}>خيارات متقدمة: الاسم والمساحة وشكل القطعة <ChevronDown size={17} aria-hidden="true" /></button>{advanced && <div className="planning-advanced-fields"><label>اسم القطعة<input maxLength={40} value={plot.name} onChange={event => updatePlot({ name: event.target.value })} /></label><label>المساحة التقديرية بالفدان<input type="number" min="0.01" max="100000" step="0.01" value={plot.area} onChange={event => updatePlot({ area: Math.max(0.01, Number(event.target.value) || .01) })} /></label><div className="planning-shape-controls"><strong>شكل القطعة في المخطط</strong><label>الموضع الأفقي <output>{Math.round(plot.x)}%</output><input type="range" min="0" max={100 - plot.width} value={plot.x} onChange={event => updatePlot({ x: Number(event.target.value) })} /></label><label>الموضع الرأسي <output>{Math.round(plot.y)}%</output><input type="range" min="0" max={100 - plot.height} value={plot.y} onChange={event => updatePlot({ y: Number(event.target.value) })} /></label><label>العرض <output>{Math.round(plot.width)}%</output><input type="range" min="15" max={100 - plot.x} value={plot.width} onChange={event => updatePlot({ width: Number(event.target.value) })} /></label><label>الطول <output>{Math.round(plot.height)}%</output><input type="range" min="15" max={100 - plot.y} value={plot.height} onChange={event => updatePlot({ height: Number(event.target.value) })} /></label></div></div>}
      </aside> : <aside className="planning-editor planning-editor-empty"><Sprout size={32} aria-hidden="true" /><h2>ارسم أول قطعة</h2><p>بعد إضافة صورة الأرض، اضغط «ارسم قطعة» وحدد زواياها. هنا ستختار المحصول وتعدل اسم القطعة ومساحتها.</p></aside>}</div>
      <section className="planning-flock" aria-labelledby="planning-flock-title"><div className="planning-panel-head"><div><p className="admin-kicker">خطوة لاحقة · القطيع</p><h2 id="planning-flock-title">مجموعات الأغنام والرؤوس الفردية</h2></div><PawPrint size={26} aria-hidden="true" /></div><p className="planning-flock-rule">الإجمالي يُحسب من المجموعات. الرأس الموثّق فرديًا يظل داخل مجموعته ولا يُضاف مرة ثانية.</p><div className="planning-group-grid">{demo.groups.map(group => <div className="planning-group" key={group.id}><label>اسم المجموعة<input maxLength={40} value={group.name} onChange={event => setDemo(current => ({ ...current, groups: current.groups.map(item => item.id === group.id ? { ...item, name: event.target.value } : item) }))} /></label><label>عدد الرؤوس<input type="number" min={assigned(group.id)} max="100000" value={group.count} onChange={event => setDemo(current => ({ ...current, groups: current.groups.map(item => item.id === group.id ? { ...item, count: Math.max(assigned(group.id), Number(event.target.value) || 0) } : item) }))} /></label><small>{assigned(group.id)} موثّق فرديًا من {group.count}</small></div>)}<button className="planning-add-group" onClick={() => { const id = crypto.randomUUID(); setDemo(current => ({ ...current, groups: [...current.groups, { id, name: `مجموعة ${current.groups.length + 1}`, count: 0 }] })); setAnimalGroup(id); }}><Plus size={20} aria-hidden="true" />مجموعة جديدة</button></div><div className="planning-animal-register"><h3>سجل الرؤوس الفردية</h3><div className="planning-animal-entry"><label>رقم أو اسم الرأس<input maxLength={40} value={tag} onChange={event => setTag(event.target.value)} /></label><label>داخل مجموعة<select value={animalGroup} onChange={event => setAnimalGroup(event.target.value)}>{demo.groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label><button disabled={!tag.trim() || assigned(animalGroup) >= (demo.groups.find(item => item.id === animalGroup)?.count ?? 0)} onClick={addAnimal}><Plus size={17} aria-hidden="true" />إضافة</button></div>{demo.animals.length ? <div className="planning-animal-list">{demo.animals.map(animal => <div key={animal.id}><strong>{animal.tag}</strong><span>{demo.groups.find(group => group.id === animal.groupId)?.name}</span><button aria-label={`حذف ${animal.tag} من المثال`} onClick={() => setDemo(current => ({ ...current, animals: current.animals.filter(item => item.id !== animal.id) }))}>حذف</button></div>)}</div> : <p className="admin-hint">لا توجد رؤوس موثّقة فرديًا في المثال.</p>}</div></section>
    </div>
  </main>;
}
