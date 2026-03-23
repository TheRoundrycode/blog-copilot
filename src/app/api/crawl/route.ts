import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MAX_URLS = 50;

// 네이버 블로그 감지 및 blogId 추출
function extractNaverBlogId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "blog.naver.com" ||
      parsed.hostname === "m.blog.naver.com"
    ) {
      const pathSegments = parsed.pathname.split("/").filter(Boolean);
      return pathSegments[0] || null;
    }
  } catch {
    // invalid URL
  }
  return null;
}

// 네이버 블로그 RSS 피드 크롤링
async function crawlNaverBlog(blogId: string) {
  const rssUrl = `https://rss.blog.naver.com/${blogId}.xml`;

  const rssResponse = await fetch(rssUrl, {
    headers: { "User-Agent": "BlogCopilot/1.0" },
    signal: AbortSignal.timeout(15000),
  });

  if (!rssResponse.ok) {
    throw new Error(
      `네이버 블로그 RSS를 가져올 수 없습니다. 블로그 ID(${blogId})를 확인해주세요.`
    );
  }

  const rssXml = await rssResponse.text();
  const $ = cheerio.load(rssXml, { xmlMode: true });

  const articles: { url: string; title: string; description: string }[] = [];

  $("item").each((_, el) => {
    const title = $(el).find("title").first().text().trim();
    const link = $(el).find("link").first().text().trim();
    // RSS description은 HTML이 포함될 수 있으므로 태그 제거
    const rawDesc = $(el).find("description").first().text().trim();
    const description = cheerio.load(rawDesc).text().trim().slice(0, 200);

    if (title && link) {
      articles.push({ url: link, title, description });
    }
  });

  return articles.slice(0, MAX_URLS);
}

// 기존 sitemap 기반 크롤링
async function crawlSitemap(url: string) {
  const sitemapUrl = url.endsWith("/sitemap.xml")
    ? url
    : `${url.replace(/\/$/, "")}/sitemap.xml`;

  const sitemapResponse = await fetch(sitemapUrl, {
    headers: { "User-Agent": "BlogCopilot/1.0" },
  });

  if (!sitemapResponse.ok) {
    throw new Error(
      `사이트맵을 가져올 수 없습니다: ${sitemapResponse.status}`
    );
  }

  const sitemapXml = await sitemapResponse.text();
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

  const limitedUrls = urls.slice(0, MAX_URLS);

  // Fetch title and meta description for each URL
  const results = await Promise.allSettled(
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

  return results
    .filter(
      (
        result
      ): result is PromiseFulfilledResult<{
        url: string;
        title: string;
        description: string;
      }> => result.status === "fulfilled"
    )
    .map((result) => result.value);
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "url이 필요합니다." },
        { status: 400 }
      );
    }

    // 네이버 블로그인 경우 RSS 방식으로 크롤링
    const naverBlogId = extractNaverBlogId(url);

    let articles;
    if (naverBlogId) {
      articles = await crawlNaverBlog(naverBlogId);
    } else {
      articles = await crawlSitemap(url);
    }

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Crawl API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "크롤링 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
