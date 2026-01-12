import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://kadryhr.pl";
  const routes = [
    "",
    "/cennik",
    "/pricing",
    "/security",
    "/rodo",
    "/privacy",
    "/cookies",
    "/terms",
    "/kontakt",
    "/contact",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));
}
