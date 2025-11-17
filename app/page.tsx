"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ApiResponse = {
  reply: string;
};

const INITIAL_PROMPT =
  "నమస్తే! నేను మీ తెలుగులో మాట్లాడే AI సహాయకుడు. సాధారణ ప్రశ్నల నుండి కథలు, సలహాలు, అనువాదాలు, సృజనాత్మక రచనలు వరకు ఏదైనా అడగండి.";

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content: INITIAL_PROMPT
    }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!canSend) {
        return;
      }

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: input.trim()
      };

      const optimisticMessages = [...messages, userMessage];
      setMessages(optimisticMessages);
      setInput("");
      setIsSending(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            history: optimisticMessages.map(({ role, content }) => ({ role, content }))
          })
        });

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(errorPayload?.error || "సర్వర్ సమాధానం ఇవ్వలేకపోయింది.");
        }

        const data: ApiResponse = await response.json();

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.reply.trim()
          }
        ]);
      } catch (error) {
        const fallback =
          error instanceof Error ? error.message : "అనుకోని లోపం సంభవించింది. కొద్ది సేపు తర్వాత ప్రయత్నించండి.";
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: fallback
          }
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [canSend, input, messages]
  );

  return (
    <main className="app-shell">
      <section className="glass-panel title-card">
        <div className="status-bar">
          <div className="status-indicator">
            <span className="status-dot" />
            <strong>తెలుగు సంభాషణకారుడు</strong>
          </div>
          <span>Beta · Telugu AI Agent</span>
        </div>
        <h1>దీప్తి · తెలుగులో మాట్లాడే AI</h1>
        <p>
          తెలుగులో సహజమైన సంభాషణ కోసం ప్రత్యేకంగా రూపుదిద్దుకున్న సహాయకుడు. మీ ప్రశ్నలు, ఆలోచనలు, సృజనాత్మక కర్తృత్వం అన్నిటికీ తెలుగులోనే
          స్పందిస్తాను.
        </p>
        <div className="disclaimer">
          ⚠️ సమాచారాన్ని పరిశీలించండి. AI ఆధారంగా ఇచ్చే సమాధానాలు తప్పులేని హామీ ఇవ్వలేవు.
        </div>
      </section>

      <section className="glass-panel chat-window">
        <div className="messages">
          {messages.map((message) => (
            <article key={message.id} className={`message ${message.role}`}>
              <div className="avatar">{message.role === "assistant" ? "AI" : "మీ"}</div>
              <div className="bubble">{message.content}</div>
            </article>
          ))}
          {isSending && (
            <article className="message assistant">
              <div className="avatar">AI</div>
              <div className="bubble typing-indicator">
                <span />
                <span />
                <span />
              </div>
            </article>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="input-panel" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            placeholder="తెలుగులో మీ సందేశాన్ని టైప్ చేయండి…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={1}
          />
          <button className="send-button" type="submit" disabled={!canSend}>
            పంపండి
          </button>
        </form>
      </section>
    </main>
  );
}
