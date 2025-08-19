// ChatArea.jsx
import { useEffect, useRef, useState } from "react";
import { pipeline, env } from "@xenova/transformers";

// Make sure we load models from the web, not from a local /models folder
env.allowLocalModels = false;
env.allowRemoteModels = true;
// (optional) pin wasm assets CDN if needed:
// env.backends.onnx.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/@xenova/transformers/dist/";

// Pick a small supported model. These work in-browser:
// - "Xenova/distilgpt2"  (fastest demo)
// - "Xenova/gpt2"        (bigger, slower)
// NOTE: 7B models (like Falcon-7B) are far too large for the browser.
const MODEL_ID = "Xenova/distilgpt2";

export const ChatArea = () => {
  const [messages, setMessages] = useState([]); // {role:'user'|'bot', text:string}[]
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);
  const genRef = useRef(null);
  const boxRef = useRef(null);

  // Load the generator once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        genRef.current = await pipeline("text-generation", MODEL_ID);
        if (!cancelled) setReady(true);
      } catch (e) {
        console.error("Model load failed:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending || !genRef.current) return;

    const userMsg = { role: "user", text: content };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);

    // Simple chat-style prompt
    const history = messages
      .map((m) => `${m.role === "bot" ? "Assistant" : "You"}: ${m.text}`)
      .join("\n");
    const prompt = `${history}${history ? "\n" : ""}You: ${content}\nAssistant:`;

    try {
      const out = await genRef.current(prompt, {
        max_new_tokens: 120,
        temperature: 0.9,
        top_p: 0.95,
        repetition_penalty: 1.1,
      });
      // transformers.js returns an array with .generated_text
      const full = out[0].generated_text;
      const reply = full.slice(full.lastIndexOf("Assistant:") + "Assistant:".length).trim();
      setMessages((m) => [...m, { role: "bot", text: reply || "(no reply)" }]);
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "bot", text: "(Local model error)" }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container max-w-3xl py-6">
      <div className="mx-auto rounded-2xl border bg-card shadow-sm gradient-border">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <div className="size-2.5 rounded-full bg-emerald-500" />
          <h2 className="font-semibold">
            Assistant {ready ? "" : "· loading model…"}
          </h2>
        </div>

        <div ref={boxRef} className="h-[60vh] overflow-y-auto px-4 py-3 space-y-3 text-left">
          {messages.length === 0 && (
            <div className="text-sm text-muted-foreground animate-[fade-in_0.5s_ease-out]">
              {ready ? "Ask me anything…" : "Loading model in your browser…"}
            </div>
          )}
          {messages.map((m, i) => <Message key={i} role={m.role} text={m.text} />)}
          {sending && (
            <div className="flex items-start gap-2">
              <Avatar role="bot" />
              <div className="rounded-2xl px-3 py-2 bg-muted text-muted-foreground text-sm">Thinking…</div>
            </div>
          )}
        </div>

        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            <input
              className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              value={input}
              placeholder={ready ? "Type a message…" : "Loading model…"}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              disabled={sending || !ready}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim() || !ready}
              className="cosmic-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Runs locally in your browser • No server needed
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
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      }`}>{text}</div>
      {isUser && <Avatar role="user" />}
    </div>
  );
}
function Avatar({ role }) {
  const isUser = role === "user";
  return (
    <div className={`shrink-0 size-7 rounded-full grid place-items-center text-[10px] font-semibold ${
      isUser ? "bg-blue-600 text-white" : "bg-zinc-200 dark:bg-zinc-800"
    }`} title={isUser ? "You" : "Assistant"}>
      {isUser ? "YOU" : "AI"}
    </div>
  );
}
