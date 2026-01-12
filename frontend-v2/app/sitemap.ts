import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://kadryhr.pl";
  const routes = [
    "",
    "/cennik",
    "/security",
    "/polityka-prywatnosci",
    "/cookies",
    "/kontakt",
    "/regulamin",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));
}
