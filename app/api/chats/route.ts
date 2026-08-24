import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all chats for this user, ordered by most recent first
    const chats = await prisma.chat.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: {
          select: { messages: true }
        }
      }
    });

    // Rename _count.messages to messageCount for cleaner response
    const formattedChats = chats.map(chat => ({
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      messageCount: chat._count.messages
    }));

    return NextResponse.json({ chats: formattedChats });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title } = body;

    // Create new chat with optional title
    const chat = await prisma.chat.create({
      data: {
        userId: session.user.id,
        title: title || "New Chat",
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      }
    });

    return NextResponse.json(chat, { status: 201 });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
