"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent, useRef } from "react";
import styles from "./chat.module.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch messages when component mounts and user is authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchMessages();
    }
  }, [status, session?.user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch chat history from server
  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/chat/history", {
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

  // Send message to Claude API
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const messageToSend = input.trim();
    if (!messageToSend) return;

    // Optimistically add user message to UI
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
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: messageToSend,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Add assistant response
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        // Handle error - remove the user message we added
        setMessages((prev) => prev.slice(0, -1));
        alert(`Failed to send message: ${errorData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      // Remove optimistic message on error
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

  // Show loading state while checking authentication
  if (status === "loading") {
    return <div className={styles.container}>Loading...</div>;
  }

  // Show nothing if redirecting (unauthenticated)
  if (status === "unauthenticated") {
    return null;
  }

  return (
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
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
