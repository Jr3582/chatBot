import React, { useEffect, useRef, useState } from "react";
import * as hf from "@xenova/transformers";

export const ChatArea = () => {
  const [ready, setReady] = useState(false);
  const [model, setModel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const boxRef = useRef();

  useEffect(() => {
    (async () => {
      const m = await hf.AutoModelForCausalLM.from_pretrained(
        "AutoModel/tiiuae/falcon-7b-instruct", // example small model
        { progress_callback: () => {} }
      );
      await m.eval(); // compile WASM artifacts
      setModel(m);
      setReady(true);
    })();
  }, []);

  async function handleSend() {
    if (!input.trim() || !model) return;

    setMessages((prev) => [...prev, { role: "user", text: input }]);
    const prompt = messages.map((m) => `${m.role}: ${m.text}`).join("\n") + "\nAssistant:";

    setInput("");
    setSending(true);

    try {
      const out = await model.generate(prompt, { max_new_tokens: 100 });
      const reply = out.generated_text.substring(prompt.length);
      setMessages((prev) => [...prev, { role: "bot", text: reply.trim() }]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { role: "bot", text: "(Local model error)" }]);
    } finally {
      setSending(false);
    }
  }

  return (
    // reuse your styled ChatArea here...
    <div className="container max-w-3xl py-6">
      {/* show loading */}
      {!ready && <div>Loading model in browser...</div>}
      {ready && (
        <>
          {/* your ChatArea UI */}
        </>
      )}
    </div>
  );
};
