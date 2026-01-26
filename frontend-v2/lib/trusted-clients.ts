export type TrustedClient = {
  name: string;
  website: string;
  description?: string;
  logoSrc?: string;
  logoTextFallback?: string;
};

export const TRUSTED_CLIENTS: TrustedClient[] = [
  {
    name: "Forest Catering",
    website: "https://www.forestcatering.pl",
    description: "Profesjonalny catering i obsługa eventów",
    // Logo file should be provided manually at public/clients/forest-catering.png.
    logoSrc: "/clients/forest-catering.png",
    logoTextFallback: "Forest Catering",
  },
  {
    name: "NovaMarket",
    website: "https://example.com/novamarket",
    description: "Lokalna sieć sklepów spożywczych",
    logoTextFallback: "NovaMarket",
  },
  {
    name: "CityRetail",
    website: "https://example.com/cityretail",
    description: "Miejska sieć punktów handlowych",
    logoTextFallback: "CityRetail",
  },
  {
    name: "GreenOffice",
    website: "https://example.com/greenoffice",
    description: "Biuro usług księgowo-kadrowych",
    logoTextFallback: "GreenOffice",
  },
  {
    name: "Baltic Services",
    website: "https://example.com/baltic-services",
    description: "Obsługa techniczna i serwis obiektów komercyjnych",
    logoTextFallback: "Baltic Services",
  },
];
