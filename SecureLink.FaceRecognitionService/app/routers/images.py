from typing import Annotated
import json

from fastapi.concurrency import run_in_threadpool
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
import httpx
import numpy as np
import cv2
from ..services.StorageService import StorageService
from ..contracts.image_requests import GetEmbeddingsRequest
from ..helpers.config import generate_embeddings
from ..helpers.log import logger

face_confidence_threshold = 0.80

router = APIRouter(prefix="/images", tags=["images"])


def get_storage_service():
    return StorageService()


def get_http_client(request: Request) -> httpx.AsyncClient:
    return request.app.state.http_client


@router.post("/", status_code=202)
async def submit_embeddings_request(
    request: GetEmbeddingsRequest,
    background_tasks: BackgroundTasks,
    # injecting storage service
    storage: Annotated[StorageService, Depends(get_storage_service)],
    # injecting the httpx client
    client: Annotated[httpx.AsyncClient, Depends(get_http_client)],
):
    logger.info(f"request for embeddings received. Request: {request}")
    background_tasks.add_task(process_embeddings, request, storage, client)
    return {"message": "Accepted"}


async def process_embeddings(
    request: GetEmbeddingsRequest, storage: StorageService, client: httpx.AsyncClient
):
    logger.info(f"Starting embedding generation for Request: {request}")
    try:
        image_bytes = await storage.download(storage_key=request.storage_key)

        image_array = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        if image is None:
            logger.error(f"Could not decode image for file {request.file_id}")
            await notify_dotnet(client, request.file_id, [], success=False)
            return

        faces = await run_in_threadpool(generate_embeddings, image)
        result = [
            {"embedding": face["embedding"], "face_confidence": face["face_confidence"]}
            for face in faces
            if face["face_confidence"] >= face_confidence_threshold
        ]

        logger.info(
            f"Notifying dotnet service. File: {request.file_id} ;; Embeddings = {result}"
        )

        await notify_dotnet(
            client=client, file_id=request.file_id, faces=result, success=True
        )

    except Exception as err:
        logger.error(f"Embedding processing failed for {request.file_id}: {err}")
        await notify_dotnet(client, request.file_id, [], success=False)


async def notify_dotnet(
    client: httpx.AsyncClient, file_id: str, faces: list[dict], success: bool
):
    try:
        response = await client.post(
            f"/files/{file_id}/embeddings", json={"faces": faces, "is_success": success}
        )
        response.raise_for_status()
    except Exception as err:
        logger.error(f"Failed to notify dotnet for File: {file_id}: {err}")
