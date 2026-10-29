"use client";

import { ArrowUpLeft, Plus } from "lucide-react";
import Link from "next/link";
import { type Product, displayPrice } from "@/data/content";
import { Photo } from "./ui";
import { MAX_QUANTITY, useCart } from "@/lib/cart-store";

export function ProductCard({ product, onAdded }: { product: Product; onAdded?: (name: string) => void }) {
  const { cart, add } = useCart();
  const atLimit = (cart[product.id] ?? 0) >= MAX_QUANTITY;
  return <article className="catalogue-product">
    <Link className="catalogue-photo" href={`/products/${product.id}`} aria-label={`تفاصيل ${product.name}`}><Photo name={product.image} alt={`صورة تجريبية: ${product.name}`} sizes="(max-width: 600px) 45vw, (max-width: 1000px) 45vw, 30vw" /><span className="photo-action"><ArrowUpLeft size={20} aria-hidden="true" /></span></Link>
    <div className="catalogue-product-info"><div><h2><Link href={`/products/${product.id}`}>{product.name}</Link></h2><p>{product.unit}</p></div><button className="add-button" type="button" disabled={atLimit} onClick={() => { if (add(product.id)) onAdded?.(product.name); }} aria-label={`إضافة ${product.name} إلى سلة المعاينة`}><Plus size={20} aria-hidden="true" /></button></div>
    <p className="price"><bdi>{displayPrice(product.price)}</bdi><span>وحدة سعرية تجريبية</span></p>
    {atLimit && <p className="limit-note">وصلت إلى حد كمية المعاينة لهذا الصنف.</p>}
  </article>;
}
