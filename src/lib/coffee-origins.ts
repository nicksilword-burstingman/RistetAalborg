import type { CoffeeId } from "./catalog";

export const coffeeOrigins: Record<
  CoffeeId,
  {
    eyebrow: string;
    title: string;
    description: string;
    images: {
      src: string;
      alt: string;
      width: number;
      height: number;
      focus?: string;
    }[];
  }
> = {
  guatemala: {
    eyebrow: "ANTIGUA · GUATEMALA",
    title: "God kaffe har rødder.",
    description:
      "I Antiguas vulkanske højland vokser kaffen i 1.500–1.800 meters højde. Vulkanernes jord, højden og menneskenes arbejde er en del af historien i hver bønne. Denne kaffe er udvalgt fra området og knyttes ikke til én bestemt farm.",
    images: [
      {
        src: "/images/origins/guatemala-dyrker.webp",
        alt: "Kaffedyrker blandt kaffebuske i Guatemala.",
        width: 999,
        height: 796,
        focus: "40% center",
      },
      {
        src: "/images/origins/guatemala-kaffeskov.webp",
        alt: "Kaffebuske og skyggetræer i Guatemalas frodige højland.",
        width: 1211,
        height: 805,
      },
      {
        src: "/images/origins/guatemala-mennesker.webp",
        alt: "En kvinde ved et hus på landet i Guatemala.",
        width: 1123,
        height: 739,
        focus: "70% center",
      },
    ],
  },
  ethiopia: {
    eyebrow: "SHAKISSO FARM · GUJI, ETIOPIEN",
    title: "En passion, der slår rødder.",
    description:
      "I Etiopiens frodige Guji-region ligger Shakisso Farm, grundlagt i 2001 af Haile Gebre. Han er kendt som “The Godfather of Guji Coffee” og har været med til at gøre området berømt for sin specialkaffe. Her dyrkes økologisk kaffe med fokus på kvalitet, bæredygtighed og lokalsamfund.",
    images: [
      {
        src: "/images/origins/ethiopia-kaffedyrker.webp",
        alt: "Kaffedyrker blandt kaffebuske i Etiopiens Guji-region.",
        width: 1448,
        height: 1086,
      },
      {
        src: "/images/origins/ethiopia-kaffebaer.webp",
        alt: "En kaffedyrker viser modne, røde kaffebær frem på en gren.",
        width: 1600,
        height: 846,
        focus: "65% center",
      },
      {
        src: "/images/origins/ethiopia-hoest.webp",
        alt: "Kaffebær plukkes fra kaffebuske i Guji, Etiopien.",
        width: 1600,
        height: 842,
      },
    ],
  },
  brazil: {
    eyebrow: "FAZENDAS DUTRA · MINAS GERAIS, BRASILIEN",
    title: "En familie. Flere generationer. Kaffe.",
    description:
      "Fazendas Dutra begyndte med José Dutra og blot én hektar jord i 1950’erne. I dag driver familien kaffefarmene videre i Brasiliens Minas Gerais-region. Deres fars passion er blevet et livsværk: økologisk specialkaffe med fokus på kvalitet, bæredygtighed og godt håndværk.",
    images: [
      {
        src: "/images/origins/brazil-familien-dutra.webp",
        alt: "Familien Dutra samlet på de blå trapper ved familiens kaffefarm i Brasilien.",
        width: 1167,
        height: 1347,
        focus: "center 60%",
      },
      {
        src: "/images/origins/brazil-kaffefarmen.webp",
        alt: "To af kaffefarmens dyrkere blandt modne kaffebær hos Dutra i Brasilien.",
        width: 1194,
        height: 795,
      },
    ],
  },
};
