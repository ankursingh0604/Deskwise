from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .auth.router import router as auth_router
from .agent_config_router import router as agent_config_router
from .chat_router import router as chat_router
from .billing_router import router as billing_router, webhook_router

app = FastAPI(title="Deskwise API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(agent_config_router)
app.include_router(chat_router)
app.include_router(billing_router)
app.include_router(webhook_router)


@app.get("/health")
def health():
    return {"status": "ok"}