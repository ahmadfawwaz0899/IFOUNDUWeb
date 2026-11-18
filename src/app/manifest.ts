import type { MetadataRoute } from "next";

// Lets people "Add to Home Screen" so IFoundU opens like a real app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IFoundU — AI Lost & Found",
    short_name: "IFoundU",
    description: "Report found items, search for lost ones, and match photos with AI.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafc",
    theme_color: "#7c3aed",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
