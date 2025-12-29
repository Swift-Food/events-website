import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/auth",
        "/profile",
        "/profile/edit",
        "/event-creation",
        "/event-management",
        "/my-tickets",
        "/organizer",
        "/events/join",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
