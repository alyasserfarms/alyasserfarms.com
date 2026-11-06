import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "مزارع آل ياسر | الخير له أصل",
    short_name: "مزارع آل ياسر",
    description: "أجود أنواع اللحوم الطازجة، الدواجن، الخضروات، الفواكه الموسمية، والألبان من أرضنا لمائدتكم مباشرة.",
    start_url: "/",
    display: "standalone",
    background_color: "#213626",
    theme_color: "#213626",
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: "/icon-48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/icon-96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
