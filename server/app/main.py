from fastapi import FastAPI
from app.core.config import settings

from app.api.v1._init_ import api_router

from app.core.redis import check_redis_connection
from contextlib import asynccontextmanager

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


@asynccontextmanager
async def lifespan(app: FastAPI):
    #  Startup logic
    if not check_redis_connection():
        raise RuntimeError("Redis is not reachable")

    print("Redis connected")

    yield 

    #  Shutdown logic (optional)
    print("Application shutting down")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan
)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.96:3000",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    "/uploads",
    StaticFiles(directory="app/uploads"),
    name="uploads",
)


# Mount all v1 APIs
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "env": settings.ENV
    }


