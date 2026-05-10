from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
import httpx
from .routers import images
from .helpers import config, options

settings = options.options


# load the model before the app starts receiving requests
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("starting app...")
    print("loading the models...")
    config.load_models()

    app.state.http_client = httpx.AsyncClient(
        base_url=settings.dotnet__baseurl,
        timeout=httpx.Timeout(10.0),
        headers={"X-Internal-Key": settings.internal__apikey},
    )

    yield

    print("App shutting down...")
    await app.state.http_client.aclose()


app = FastAPI(lifespan=lifespan)

app.include_router(images.router)


@app.get("/")
def root():
    return {"message": "App is live"}
