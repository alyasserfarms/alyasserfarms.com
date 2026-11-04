import type { Metadata } from "next";
import { CommerceShell } from "@/components/commerce-shell";
import { ProductView } from "@/components/commerce";
import { publicFarm } from "@/lib/farm-repository";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { products } = await publicFarm();
  const product = products.find((item) => item.id === id);

  if (!product) {
    return {
      title: "المنتج غير موجود",
      robots: { index: false, follow: false },
    };
  }

  const title = `${product.name} — طازج من مزارع آل ياسر`;
  const description = `${product.description} | السعر: ${product.price} ج.م / ${product.unit} | اطلب الآن طازجًا ومباشرة من المزرعة لمائدتك.`;
  const url = `https://alyasserfarms.com/products/${product.id}`;
  const imageUrl = `https://alyasserfarms.com/media/${product.image}.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const { products } = await publicFarm();
  const product = products.find((item) => item.id === id);

  if (!product) {
    return (
      <CommerceShell>
        <div className="commerce-empty">
          <h1>المنتج غير متاح حاليًا</h1>
          <p>يمكنك اكتشاف بقية الخيرات من المتجر.</p>
          <a href="/shop" className="button">
            العودة للمتجر
          </a>
        </div>
      </CommerceShell>
    );
  }

  const productJsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: `https://alyasserfarms.com/media/${product.image}.jpg`,
    description: product.description,
    brand: {
      "@type": "Brand",
      name: "مزارع آل ياسر",
    },
    offers: {
      "@type": "Offer",
      url: `https://alyasserfarms.com/products/${product.id}`,
      priceCurrency: "EGP",
      price: product.price,
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "مزارع آل ياسر",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <CommerceShell>
        <ProductView product={product} />
      </CommerceShell>
    </>
  );
}
