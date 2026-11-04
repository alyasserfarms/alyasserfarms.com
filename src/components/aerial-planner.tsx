"use client";
/* eslint-disable @next/next/no-img-element -- The user-selected Blob URL remains local to the browser. */

import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import { Check, ImagePlus, Trash2, Undo2 } from "lucide-react";
import type { Plot, Point } from "@/data/planning-demo";

const databaseName = "alyasser-planning-image";
function openImageDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains("images")) request.result.createObjectStore("images"); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function imageStore(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest) {
  const db = await openImageDb();
  try { return await new Promise<unknown>((resolve, reject) => { const request = action(db.transaction("images", mode).objectStore("images")); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
  finally { db.close(); }
}
function points(plot: Plot): Point[] { return plot.vertices?.length ? plot.vertices : [{ x: plot.x, y: plot.y }, { x: plot.x + plot.width, y: plot.y }, { x: plot.x + plot.width, y: plot.y + plot.height }, { x: plot.x, y: plot.y + plot.height }]; }
function bound(value: number) { return Math.max(0, Math.min(100, value)); }
function pointAt(event: PointerEvent<SVGElement>, svg: SVGSVGElement): Point { const box = svg.getBoundingClientRect(); return { x: bound((event.clientX - box.left) / box.width * 100), y: bound((event.clientY - box.top) / box.height * 100) }; }

export function AerialPlanner({ plots, selected, onSelect, onChange }: { plots: Plot[]; selected: string; onSelect: (id: string) => void; onChange: (plots: Plot[]) => void }) {
  const [url, setUrl] = useState("");
  const [drawing, setDrawing] = useState<Point[]>([]);
  const [mode, setMode] = useState<"select" | "draw">("select");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => { let active = true; let objectUrl = ""; imageStore("readonly", store => store.get("aerial")).then(value => { if (active && value instanceof Blob) { objectUrl = URL.createObjectURL(value); setUrl(objectUrl); } }).catch(() => {}); return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); }; }, []);
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 12_000_000) { setError("اختر صورة JPG أو PNG أو WebP بحجم أقل من 12 ميجابايت."); return; }
    if (plots.length && !window.confirm("ستبدأ الصورة الجديدة مخططًا بلا قطع؛ يمكنك رسمها فوقها. هل تريد المتابعة؟")) { event.target.value = ""; return; }
    setError("");
    try { await imageStore("readwrite", store => store.put(file, "aerial")); } catch { setError("تعذر حفظ الصورة في هذا المتصفح؛ ستبقى ظاهرة حتى تغلق الصفحة."); }
    setUrl(previous => { if (previous) URL.revokeObjectURL(previous); return URL.createObjectURL(file); });
    onChange([]); onSelect(""); setDrawing([]); setMode("select");
  }
  async function removeImage() {
    if (!window.confirm("إزالة الصورة الجوية المحفوظة على هذا الجهاز؟ ستبقى القطع في المخطط.")) return;
    try { await imageStore("readwrite", store => store.delete("aerial")); } catch { setError("تعذر إزالة الصورة من تخزين المتصفح."); return; }
    if (url) URL.revokeObjectURL(url);
    setUrl(""); setDrawing([]); setMode("select");
    if (fileRef.current) fileRef.current.value = "";
  }
  function finish() {
    if (drawing.length < 3) return;
    const xs = drawing.map(point => point.x), ys = drawing.map(point => point.y);
    const x = Math.min(...xs), y = Math.min(...ys), width = Math.max(...xs) - x, height = Math.max(...ys) - y;
    if (width < 1 || height < 1) { setError("ارسم قطعة لها عرض وطول واضحان."); return; }
    const id = crypto.randomUUID();
    onChange([...plots, { id, name: `قطعة ${plots.length + 1}`, crop: "بدون زراعة", area: 1, x, y, width, height, vertices: drawing }]);
    onSelect(id); setDrawing([]); setMode("select"); setError("");
  }
  function moveVertex(plot: Plot, index: number, point: Point) {
    const vertices = points(plot).map((item, i) => i === index ? point : item);
    const xs = vertices.map(item => item.x), ys = vertices.map(item => item.y);
    onChange(plots.map(item => item.id === plot.id ? { ...item, vertices, x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) } : item));
  }
  function removeSelected() {
    if (!window.confirm("حذف هذه القطعة من المخطط التجريبي؟")) return;
    const remaining = plots.filter(plot => plot.id !== selected);
    onChange(remaining); onSelect(remaining[0]?.id ?? "");
  }
  const current = plots.find(plot => plot.id === selected);
  return <div className="aerial-planner"><div className="aerial-toolbar"><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="aerial-file-input" onChange={upload} aria-label="اختيار صورة جوية" /><button onClick={() => fileRef.current?.click()}><ImagePlus size={17} aria-hidden="true" />{url ? "تغيير الصورة" : "إضافة صورة جوية"}</button>{url && <button className={mode === "draw" ? "aerial-active" : ""} onClick={() => { setMode(mode === "draw" ? "select" : "draw"); setDrawing([]); }}><span aria-hidden="true">＋</span>ارسم قطعة</button>}{current && url && mode !== "draw" && <button onClick={removeSelected}><Trash2 size={16} aria-hidden="true" />حذف المحددة</button>}{url && <button onClick={removeImage}><Trash2 size={16} aria-hidden="true" />إزالة الصورة</button>}</div>
    {error && <p role="alert" className="admin-error">{error}</p>}
    {url ? <><div className="aerial-image-wrap">{/* Blob URLs are local browser images and cannot use Next image optimization. */}<img src={url} alt="الصورة الجوية التي أضفتها للتخطيط" /><svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="حدود القطع المرسومة فوق الصورة" style={{ touchAction: mode === "draw" ? "none" : "auto" }} onPointerDown={event => { if (mode !== "draw" || !svgRef.current) return; setDrawing(current => [...current, pointAt(event, svgRef.current!)]); }}>
      {plots.map((plot,index) => <g key={plot.id}><polygon points={points(plot).map(point => `${point.x},${point.y}`).join(" ")} className={`aerial-polygon ${plot.id === selected ? "selected" : ""}`} onPointerDown={event => { if (mode === "draw") return; event.stopPropagation(); onSelect(plot.id); }} /><text x={plot.x + Math.min(plot.width / 2, 20)} y={plot.y + Math.min(plot.height / 2, 20)} className="aerial-label" textAnchor="middle">{index + 1}</text>{plot.id === selected && mode === "select" && points(plot).map((point,i) => <circle key={i} cx={point.x} cy={point.y} r="1.4" className="aerial-vertex" onPointerDown={event => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={event => { if (event.buttons !== 1 || !svgRef.current) return; moveVertex(plot, i, pointAt(event, svgRef.current)); }} />)}</g>)}
      {drawing.length > 0 && <><polyline points={drawing.map(point => `${point.x},${point.y}`).join(" ")} className="aerial-drawing" />{drawing.map((point,index) => <circle key={index} cx={point.x} cy={point.y} r=".9" fill="#f5bf55" />)}</>}
    </svg></div>{mode === "draw" ? <div className="aerial-draw-actions"><p>اضغط على زوايا القطعة في الصورة، ثم اختر «إنهاء الرسم» بعد ثلاث نقاط على الأقل.</p><button disabled={drawing.length < 3} onClick={finish}><Check size={17} aria-hidden="true" />إنهاء الرسم</button><button disabled={!drawing.length} onClick={() => setDrawing(current => current.slice(0,-1))}><Undo2 size={17} aria-hidden="true" />تراجع عن نقطة</button><button onClick={() => { setDrawing([]); setMode("select"); }}>إلغاء</button></div> : <p className="aerial-help">اختر قطعة لتعديل محصولها، واسحب النقاط الدائرية لتغيير حدودها. يمكنك العودة للمخطط الافتراضي في أي وقت.</p>}</> : <div className="aerial-empty"><ImagePlus size={38} aria-hidden="true" /><h3>ابدأ بصورة الأرض</h3><p>أضف صورة جوية تملك حق استخدامها. ستبقى الصورة والقطع على هذا الجهاز فقط خلال التجربة.</p><button className="admin-primary" onClick={() => fileRef.current?.click()}>اختيار الصورة</button><small>يمكنك استخدام المشهد الثلاثي أو المخطط الافتراضي إلى أن تتوفر الصورة.</small></div>}
  </div>;
}
