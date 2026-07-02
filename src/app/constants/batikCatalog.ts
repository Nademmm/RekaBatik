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
    description: "Mahakarya batik Jawa dengan pola diagonal berulang menyerupai ombak samudra. Melambangkan kekuasaan, jalinan yang tidak pernah putus, serta keteguhan hati para ksatria dalam berjuang.",
    origin: "Jawa Tengah",
    primary_color: "#5C3E21",
    secondary_color: "#C59B27",
    bg_color: "#FDFCFA",
    rating: 5,
    style_type: "parang",
    image_url: ParangImg,
  },
  {
    id: 2,
    name: "Batik Mega Mendung",
    price: 380000,
    description: "Batik ikonik asal Cirebon yang menampilkan lekukan awan berlapis dengan gradasi warna biru yang menawan. Melambangkan kedalaman jiwa manusia, kesabaran, kedamaian, dan pembawa kesegaran.",
    origin: "Cirebon",
    primary_color: "#1E3A8A",
    secondary_color: "#3B82F6",
    bg_color: "#F8FAFC",
    rating: 5,
    style_type: "mega",
    image_url: MegaMendungImg,
  },
  {
    id: 3,
    name: "Batik Ceplok",
    price: 320000,
    description: "Pola ornamen geometris simetris yang tersusun rapi membentuk kuntum bunga atau bintang. Melambangkan keteraturan hidup, keharmonisan jagad raya, dan keseimbangan jiwa.",
    origin: "Yogyakarta",
    primary_color: "#4E3629",
    secondary_color: "#D4A373",
    bg_color: "#FAF6F0",
    rating: 5,
    style_type: "ceplok",
    image_url: CeplokImg,
  },
  {
    id: 4,
    name: "Batik Sidomukti",
    price: 390000,
    description: "Batik sogan kraton Surakarta yang sakral dengan detail ornamen flora fauna. Menjadi doa visual agar sang pemakai senantiasa mendapatkan kehidupan yang makmur, mulia, dan sejahtera.",
    origin: "Jawa Tengah",
    primary_color: "#3A2218",
    secondary_color: "#D4B88B",
    bg_color: "#FAF8F5",
    rating: 5,
    style_type: "sido-mukti",
    image_url: SidomuktiImg,
  },
  {
    id: 5,
    name: "Batik Truntum",
    price: 360000,
    description: "Karya agung motif taburan bintang kecil yang gemerlap di kegelapan malam, melambangkan cinta kasih yang tulus, abadi, serta menuntun dalam kesetiaan.",
    origin: "Jawa Tengah",
    primary_color: "#1E130C",
    secondary_color: "#A27B5C",
    bg_color: "#FAF8F5",
    rating: 5,
    style_type: "truntum",
    image_url: TruntumImg,
  },
  {
    id: 6,
    name: "Batik Kawung",
    price: 370000,
    description: "Motif tertua berupa empat lingkaran menyerupai buah kawung (aren) yang berpusat di satu titik. Lambang keadilan, kesucian hati, ketulusan, serta kebijaksanaan.",
    origin: "Yogyakarta",
    primary_color: "#4A3B32",
    secondary_color: "#D7CCC8",
    bg_color: "#F5F2EB",
    rating: 5,
    style_type: "kawung",
    image_url: KawungImg,
  },
  {
    id: 7,
    name: "Batik Sekar Jagad",
    price: 420000,
    description: "Kombinasi indah mirip peta dunia yang menyatukan beragam motif batik dalam satu kain. Melambangkan keindahan yang universal, toleransi, serta keragaman budaya Nusantara.",
    origin: "Jawa Tengah",
    primary_color: "#6D4C41",
    secondary_color: "#A1887F",
    bg_color: "#FAF6F0",
    rating: 5,
    style_type: "sekar-jagad",
    image_url: SekarJagadImg,
  },
  {
    id: 8,
    name: "Batik Beras Utah",
    price: 340000,
    description: "Motif unik berupa butiran beras yang tumpah tersebar tak beraturan secara estetik. Melambangkan kelimpahan rezeki yang meluap, kemakmuran tanpa batas, dan berkah pangan.",
    origin: "Jawa Barat",
    primary_color: "#2C1B18",
    secondary_color: "#D7C49E",
    bg_color: "#FDFBF7",
    rating: 5,
    style_type: "beras-utah",
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
  return items.map((item) => {
    const normalizedDbName = normalizeBatikName(item.name);
    const localMatch = fallbackCatalogItems.find(
      (fallback) => normalizeBatikName(fallback.name) === normalizedDbName
    );

    return {
      ...item,
      image_url: resolveCatalogImageUrl(item.image_url),
      // Merge deskripsi & palet warna baru dari data lokal berkualitas tinggi
      description: localMatch ? localMatch.description : item.description,
      primary_color: localMatch ? localMatch.primary_color : item.primary_color,
      secondary_color: localMatch ? localMatch.secondary_color : item.secondary_color,
      bg_color: localMatch ? localMatch.bg_color : item.bg_color,
    };
  });
}

export function normalizeBatikName(value: string) {
  return value.toLowerCase().replace(/^batik\s+/, "").replace(/\s+/g, " ").trim();
}
