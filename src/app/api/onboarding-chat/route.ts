import { NextResponse } from "next/server";
import {
  streamChat,
  getOnboardingPrompt,
  MODEL_PRIMARY,
} from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const { messages, crawledArticles } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages 배열이 필요합니다." },
        { status: 400 }
      );
    }

    const systemPrompt = getOnboardingPrompt(crawledArticles || []);

    const stream = await streamChat(messages, systemPrompt, MODEL_PRIMARY);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Onboarding chat error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "온보딩 채팅 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
