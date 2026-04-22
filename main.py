from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class ChatRequest(BaseModel):
    userId: str
    agentId: str
    message: str

@app.post("/v1/chat")
def chat(req: ChatRequest):
    return {"reply": f"Echo: {req.message}", "intent": {"tone": "neutral", "style": "natural", "intensity": 0.5}}
