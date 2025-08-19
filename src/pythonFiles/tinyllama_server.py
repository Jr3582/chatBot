# tinyllama_server.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

MODEL_ID = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

# ----- load model once at startup -----
tok = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.float32,   # use torch.float16 if you have a CUDA GPU
    device_map="auto",
)

app = FastAPI()

# Dev CORS: allow your Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev; tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    history: list[dict] | None = None  # optional [{role, content}, ...]

@app.post("/api/chat")
def chat(req: ChatRequest):
    # Build history (TinyLlama-Chat expects ChatML-like roles)
    msgs = req.history or []
    msgs = [m for m in msgs if m.get("role") in {"user","assistant"} and m.get("content")]
    msgs.append({"role": "user", "content": req.message})

    prompt = tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True)
    inputs = tok(prompt, return_tensors="pt").to(model.device)

    with torch.no_grad():
        out = model.generate(
            **inputs,
            max_new_tokens=200,
            do_sample=True,
            temperature=0.8,
            top_p=0.95,
            repetition_penalty=1.1,
            pad_token_id=tok.eos_token_id,
            eos_token_id=tok.eos_token_id,
        )

    text = tok.decode(out[0], skip_special_tokens=True)
    reply = text.split("<|assistant|>")[-1].strip()
    return {"reply": reply}
