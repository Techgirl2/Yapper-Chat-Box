import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { Anthropic } from "@anthropic-ai/sdk";

const prisma = new PrismaClient();
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Get current user's session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get or create the user's chat
    let chat = await prisma.chat.findFirst({
      where: { userId: session.user.id },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          userId: session.user.id,
          title: "Chat",
        },
      });
    }

    // Save user message to database
    await prisma.message.create({
      data: {
        chatId: chat.id,
        role: "user",
        content: message,
      },
    });

    // Fetch all previous messages for context
    const previousMessages = await prisma.message.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        content: true,
      },
    });

    // Format messages for Claude API
    const messagesForClaude = previousMessages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Call Claude API using direct HTTP call
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-5",
        max_tokens: 4096,
        messages: messagesForClaude,
      }),
    });

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.json();
      throw new Error(
        `Claude API error: ${claudeResponse.status} - ${JSON.stringify(errorData)}`
      );
    }

    const response = await claudeResponse.json();

    // Extract the text response
    let assistantMessage = "";

    if (response.content && Array.isArray(response.content)) {
      for (const block of response.content) {
        if (block.type === "text" && block.text) {
          assistantMessage = block.text;
          break;
        }
      }
    }

    if (!assistantMessage) {
      console.error(
        "Failed to extract text from response:",
        JSON.stringify(response)
      );
      throw new Error(
        `No text content found in Claude response: ${JSON.stringify(response)}`
      );
    }

    // Save assistant response to database
    await prisma.message.create({
      data: {
        chatId: chat.id,
        role: "assistant",
        content: assistantMessage,
      },
    });

    return NextResponse.json({
      response: assistantMessage,
    });
  } catch (error) {
    console.error("Error in chat:", error);

    if (error instanceof Error) {
      if (error.message.includes("401")) {
        return NextResponse.json(
          { error: "Invalid API key - check your CLAUDE_API_KEY" },
          { status: 500 }
        );
      }
      if (error.message.includes("404")) {
        return NextResponse.json(
          { error: "Model not found - try a different model name" },
          { status: 500 }
        );
      }
      if (error.message.includes("overloaded")) {
        return NextResponse.json(
          { error: "Claude API is currently overloaded. Please try again." },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: `Error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
