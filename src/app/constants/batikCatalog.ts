import { BatikItem } from "../../types/database";

import BerasUtahImg from "../../assets/catalog-images/beras_utah.webp";
import CeplokImg from "../../assets/catalog-images/ceplok.webp";
import KawungImg from "../../assets/catalog-images/kawung.webp";
import MegaMendungImg from "../../assets/catalog-images/mega_mendung.webp";
import ParangImg from "../../assets/catalog-images/parang.webp";
import SekarJagadImg from "../../assets/catalog-images/sekar_jagad.webp";
import SidomuktiImg from "../../assets/catalog-images/sidomukti.webp";
import TruntumImg from "../../assets/catalog-images/truntum.webp";

export const catalogImageMap: Record<string, string> = {
  "beras_utah.webp": BerasUtahImg,
  "ceplok.webp": CeplokImg,
  "kawung.webp": KawungImg,
  "mega_mendung.webp": MegaMendungImg,
  "parang.webp": ParangImg,
  "sekar_jagad.webp": SekarJagadImg,
  "sidomukti.webp": SidomuktiImg,
  "truntum.webp": TruntumImg,
};

export const fallbackCatalogItems: BatikItem[] = [
  {
    id: 1,
    name: "Batik Parang",
    price: 350000,
    description: "Motif parang klasik dengan garis diagonal khas batik Jawa yang melambangkan keberanian dan keteguhan hati.",
    origin: "Jawa Tengah",
    primary_color: "#8B6F47",
    secondary_color: "#D4B88B",
    bg_color: "#FAF8F5",
    rating: 5,
    sold: 234,
    style_type: "parang",
    image_url: ParangImg,
  },
  {
    id: 2,
    name: "Batik Mega Mendung",
    price: 380000,
    description: "Motif mega mendung khas Cirebon yang terinspirasi dari awan di langit, melambangkan kedamaian dan kesejukan.",
    origin: "Cirebon",
    primary_color: "#8B6F47",
    secondary_color: "#D4B88B",
    bg_color: "#FAF8F5",
    rating: 5,
    sold: 189,
    style_type: "mega",
    image_url: MegaMendungImg,
  },
  {
    id: 3,
    name: "Batik Ceplok",
    price: 320000,
    description: "Motif ceplok dengan pola geometris yang khas batik Yogyakarta, penuh makna filosofi.",
    origin: "Yogyakarta",
    primary_color: "#8B6F47",
    secondary_color: "#D4B88B",
    bg_color: "#FAF8F5",
    rating: 5,
    sold: 156,
    style_type: "ceplok",
    image_url: CeplokImg,
  },
  {
    id: 4,
    name: "Batik Sidomukti",
    price: 390000,
    description: "Motif sido mukti yang melambangkan kebahagiaan, kemakmuran, dan keselamatan bagi pemakainya.",
    origin: "Jawa Tengah",
    primary_color: "#8B6F47",
    secondary_color: "#D4B88B",
    bg_color: "#FAF8F5",
    rating: 5,
    sold: 203,
    style_type: "sido-mukti",
    image_url: SidomuktiImg,
  },
  {
    id: 5,
    name: "Batik Truntum",
    price: 360000,
    description: "Motif truntum yang melambangkan cinta abadi dan kesetiaan, cocok untuk acara pernikahan.",
    origin: "Jawa Tengah",
    primary_color: "#8B6F47",
    secondary_color: "#D4B88B",
    bg_color: "#FAF8F5",
    rating: 5,
    sold: 178,
    style_type: "parang",
    image_url: TruntumImg,
  },
  {
    id: 6,
    name: "Batik Kawung",
    price: 370000,
    description: "Motif kawung yang terinspirasi dari buah kolang-kaling, melambangkan kesempurnaan dan kebijaksanaan.",
    origin: "Yogyakarta",
    primary_color: "#8B6F47",
    secondary_color: "#D4B88B",
    bg_color: "#FAF8F5",
    rating: 5,
    sold: 165,
    style_type: "ceplok",
    image_url: KawungImg,
  },
  {
    id: 7,
    name: "Batik Sekar Jagad",
    price: 420000,
    description: "Motif sekar jagad yang melambangkan keindahan dan keragaman dunia, penuh detail yang memukau.",
    origin: "Jawa Tengah",
    primary_color: "#8B6F47",
    secondary_color: "#D4B88B",
    bg_color: "#FAF8F5",
    rating: 5,
    sold: 145,
    style_type: "parang",
    image_url: SekarJagadImg,
  },
  {
    id: 8,
    name: "Batik Beras Utah",
    price: 340000,
    description: "Motif beras utah yang khas dan unik, melambangkan kemakmuran dan kesejahteraan.",
    origin: "Jawa Barat",
    primary_color: "#8B6F47",
    secondary_color: "#D4B88B",
    bg_color: "#FAF8F5",
    rating: 5,
    sold: 132,
    style_type: "ceplok",
    image_url: BerasUtahImg,
  },
];

export function resolveCatalogImageUrl(imageUrl?: string) {
  if (!imageUrl) return imageUrl;

  for (const [filename, localImageUrl] of Object.entries(catalogImageMap)) {
    if (imageUrl.includes(filename)) {
      return localImageUrl;
    }
  }

  return imageUrl;
}

export function resolveCatalogItems(items: BatikItem[]) {
  return items.map((item) => ({
    ...item,
    image_url: resolveCatalogImageUrl(item.image_url),
  }));
}

export function normalizeBatikName(value: string) {
  return value.toLowerCase().replace(/^batik\s+/, "").replace(/\s+/g, " ").trim();
}
