import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OPUS",
    short_name: "OPUS",
    description:
      "Authenticated digital art editions — collecting and appreciation. High-fidelity viewing on signed-in mobile web.",
    start_url: "/",
    display: "standalone",
    background_color: "#0E0E0E",
    theme_color: "#0E0E0E",
    lang: "en",
    orientation: "portrait-primary",
  };
}
