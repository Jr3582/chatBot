import { useState, useRef, useEffect } from "react";

export const ChatArea = () => {
  const [messages, setMessages] = useState([]); // {role:'user'|'bot', text:string}[]
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;

    const userMsg = { role: "user", text: content };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);

    try {
      // Convert chat history to {role, content} for backend
      const history = messages.map((m) => ({
        role: m.role === "bot" ? "assistant" : m.role,
        content: m.text,
      }));

      const res = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          history,
        }),
      });

      const data = await res.json();
      const botMsg = { role: "bot", text: data.reply ?? "(no reply)" };
      setMessages((m) => [...m, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [...m, { role: "bot", text: "(Error contacting server)" }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container max-w-3xl py-6">
      {/* Card */}
      <div className="mx-auto rounded-2xl border bg-card shadow-sm gradient-border">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <div className="size-2.5 rounded-full bg-emerald-500" />
          <h2 className="font-semibold">Assistant</h2>
        </div>

        {/* Messages */}
        <div
          ref={boxRef}
          className="h-[60vh] overflow-y-auto px-4 py-3 space-y-3 text-left"
        >
          {messages.length === 0 && (
            <div className="text-sm text-muted-foreground animate-[fade-in_0.5s_ease-out]">
              Ask me anything…
            </div>
          )}

          {messages.map((m, i) => (
            <Message key={i} role={m.role} text={m.text} />
          ))}

          {sending && (
            <div className="flex items-start gap-2">
              <Avatar role="bot" />
              <div className="rounded-2xl px-3 py-2 bg-muted text-muted-foreground text-sm">
                Thinking…
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            <input
              className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              value={input}
              placeholder="Type a message…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="cosmic-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 rounded border">Enter</kbd> to send.
          </p>
        </div>
      </div>
    </div>
  );
};

function Message({ role, text }) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-2 items-start ${isUser ? "justify-end" : ""}`}>
      {!isUser && <Avatar role="bot" />}
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {text}
      </div>
      {isUser && <Avatar role="user" />}
    </div>
  );
}

function Avatar({ role }) {
  const isUser = role === "user";
  return (
    <div
      className={`shrink-0 size-7 rounded-full grid place-items-center text-[10px] font-semibold ${
        isUser ? "bg-blue-600 text-white" : "bg-zinc-200 dark:bg-zinc-800"
      }`}
      title={isUser ? "You" : "Assistant"}
    >
      {isUser ? "YOU" : "AI"}
    </div>
  );
}
