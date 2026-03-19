import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MAX_URLS = 50;

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "url이 필요합니다." },
        { status: 400 }
      );
    }

    // Step 1: Fetch sitemap XML
    const sitemapUrl = url.endsWith("/sitemap.xml")
      ? url
      : `${url.replace(/\/$/, "")}/sitemap.xml`;

    const sitemapResponse = await fetch(sitemapUrl, {
      headers: { "User-Agent": "BlogCopilot/1.0" },
    });

    if (!sitemapResponse.ok) {
      return NextResponse.json(
        { error: `사이트맵을 가져올 수 없습니다: ${sitemapResponse.status}` },
        { status: 400 }
      );
    }

    const sitemapXml = await sitemapResponse.text();

    // Step 2: Parse URLs from sitemap
    const $ = cheerio.load(sitemapXml, { xmlMode: true });
    const urls: string[] = [];

    $("url > loc").each((_, el) => {
      const loc = $(el).text().trim();
      if (loc) urls.push(loc);
    });

    // Also check for sitemap index (nested sitemaps)
    if (urls.length === 0) {
      const nestedSitemapUrls: string[] = [];
      $("sitemap > loc").each((_, el) => {
        const loc = $(el).text().trim();
        if (loc) nestedSitemapUrls.push(loc);
      });

      // Fetch first nested sitemap if available
      for (const nestedUrl of nestedSitemapUrls.slice(0, 3)) {
        try {
          const nestedResponse = await fetch(nestedUrl, {
            headers: { "User-Agent": "BlogCopilot/1.0" },
          });
          if (nestedResponse.ok) {
            const nestedXml = await nestedResponse.text();
            const nested$ = cheerio.load(nestedXml, { xmlMode: true });
            nested$("url > loc").each((_, el) => {
              const loc = nested$(el).text().trim();
              if (loc) urls.push(loc);
            });
          }
        } catch {
          // Skip failed nested sitemaps
        }
      }
    }

    // Limit to MAX_URLS
    const limitedUrls = urls.slice(0, MAX_URLS);

    // Step 3: Fetch title and meta description for each URL
    const articles = await Promise.allSettled(
      limitedUrls.map(async (pageUrl) => {
        try {
          const pageResponse = await fetch(pageUrl, {
            headers: { "User-Agent": "BlogCopilot/1.0" },
            signal: AbortSignal.timeout(10000),
          });

          if (!pageResponse.ok) {
            return { url: pageUrl, title: "", description: "" };
          }

          const html = await pageResponse.text();
          const page$ = cheerio.load(html);

          const title =
            page$("title").first().text().trim() ||
            page$('meta[property="og:title"]').attr("content")?.trim() ||
            "";

          const description =
            page$('meta[name="description"]').attr("content")?.trim() ||
            page$('meta[property="og:description"]').attr("content")?.trim() ||
            "";

          return { url: pageUrl, title, description };
        } catch {
          return { url: pageUrl, title: "", description: "" };
        }
      })
    );

    const resolvedArticles = articles
      .filter(
        (result): result is PromiseFulfilledResult<{ url: string; title: string; description: string }> =>
          result.status === "fulfilled"
      )
      .map((result) => result.value);

    return NextResponse.json({ articles: resolvedArticles });
  } catch (error) {
    console.error("Crawl API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "크롤링 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
