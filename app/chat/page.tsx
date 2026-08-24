"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, FormEvent, useRef, Suspense } from "react";
import styles from "./chat.module.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Chat {
  id: string;
  title: string | null;
  createdAt: string;
  messageCount: number;
}

function ChatContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allChats, setAllChats] = useState<Chat[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarLoading, setIsSidebarLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Get or create chat when user is authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id && !chatId) {
      const urlChatId = searchParams.get("id");

      if (urlChatId) {
        // Use existing chat from URL
        setChatId(urlChatId);
      } else {
        // No chat ID in URL, try to fetch existing chats first
        redirectToFirstChatOrCreate();
      }
    }
  }, [status, session?.user?.id, chatId]);

  // Redirect to first existing chat, or create a new one
  const redirectToFirstChatOrCreate = async () => {
    try {
      const response = await fetch("/api/chats", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.chats && data.chats.length > 0) {
          // Redirect to the first (most recent) chat
          router.push(`/chat?id=${data.chats[0].id}`);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to fetch existing chats:", err);
    }

    // No existing chats, create a new one
    createNewChat();
  };

  // Watch for URL changes and update chatId
  useEffect(() => {
    const urlChatId = searchParams.get("id");
    if (urlChatId && urlChatId !== chatId) {
      setChatId(urlChatId);
    }
  }, [searchParams]);

  // Create a new chat
  const createNewChat = async () => {
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: "New Chat" }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatId(data.id);
        // Update URL with new chat ID
        router.push(`/chat?id=${data.id}`);
      }
    } catch (err) {
      console.error("Failed to create chat:", err);
    }
  };

  // Fetch messages when chatId changes
  useEffect(() => {
    if (chatId) {
      fetchMessages();
      fetchAllChats();
    }
  }, [chatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch chat history
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/history?chatId=${chatId}`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  // Fetch all chats for sidebar
  const fetchAllChats = async () => {
    try {
      setIsSidebarLoading(true);
      const response = await fetch("/api/chats", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAllChats(data.chats || []);
      }
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    } finally {
      setIsSidebarLoading(false);
    }
  };

  // Switch to a different chat
  const switchChat = (newChatId: string) => {
    router.push(`/chat?id=${newChatId}`);
  };

  // Delete a chat
  const deleteChat = async (chatIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat?")) return;

    try {
      const response = await fetch(`/api/chats/${chatIdToDelete}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      // If we deleted the current chat, navigate to another one
      if (chatIdToDelete === chatId) {
        // Filter out the deleted chat from the list
        const remainingChats = allChats.filter(c => c.id !== chatIdToDelete);

        if (remainingChats.length > 0) {
          // Navigate to the first remaining chat
          router.push(`/chat?id=${remainingChats[0].id}`);
        } else {
          // No other chats exist, create a new one
          await createNewChat();
        }
      } else {
        // Just refresh the list if we deleted another chat
        await fetchAllChats();
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
      alert("Failed to delete chat");
    }
  };

  // Send message to Claude
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const messageToSend = input.trim();
    if (!messageToSend || !chatId) return;

    // Optimistically add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: messageToSend,
          chatId: chatId,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessages((prev) => prev.slice(0, -1));
        alert(`Failed to send message: ${errorData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => prev.slice(0, -1));
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  if (status === "loading") {
    return <div className={styles.container}>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className={styles.pageContainer}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Chats</h2>
          <button onClick={createNewChat} className={styles.newChatBtn} title="New Chat">
            +
          </button>
        </div>

        <div className={styles.chatsList}>
          {isSidebarLoading ? (
            <div className={styles.loadingMessage}>Loading...</div>
          ) : allChats.length === 0 ? (
            <div className={styles.emptyChats}>No chats yet</div>
          ) : (
            allChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => switchChat(chat.id)}
                className={`${styles.chatItem} ${chat.id === chatId ? styles.active : ""}`}
              >
                <div className={styles.chatItemContent}>
                  <div className={styles.chatName}>
                    {chat.title || "New Chat"}
                  </div>
                  <div className={styles.chatMeta}>
                    {chat.messageCount} messages
                  </div>
                </div>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className={styles.deleteBtn}
                  title="Delete chat"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Chat with Claude</h1>
          <div className={styles.userInfo}>
            <span>{session?.user?.email}</span>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </div>

        <div className={styles.messagesContainer}>
          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Start a conversation with Claude AI</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
                <div className={styles.messageContent}>{msg.content}</div>
                <span className={styles.messageTime}>
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className={styles.input}
          />
          <button type="submit" disabled={isLoading} className={styles.sendBtn}>
            {isLoading ? (
              <span className={styles.heartLoader}>
                <span className={styles.heart}>❤️</span>
                <span className={styles.heart}>❤️</span>
                <span className={styles.heart}>❤️</span>
              </span>
            ) : (
              "Send"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}
