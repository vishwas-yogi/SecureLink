from typing import Annotated

from fastapi.concurrency import run_in_threadpool
import numpy as np
from fastapi import APIRouter, Depends, HTTPException
import cv2
from ..services.StorageService import StorageService
from ..contracts.image_requests import GetEmbeddingsRequest
from ..helpers.config import generate_embeddings

router = APIRouter(prefix="/images", tags=["images"])


def get_storage_service():
    return StorageService()


@router.post("/")
async def get_embeddings(
    request: GetEmbeddingsRequest,
    # injecting storage service
    storage: Annotated[StorageService, Depends(get_storage_service)],
):
    try:
        image_bytes = await storage.download(storage_key=request.storage_key)

        image_array = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        if image is None:
            raise HTTPException(status_code=400, detail="Invald image payload")

        embeddings = await run_in_threadpool(generate_embeddings, image)

        return {"file_id": request.file_id, "embeddings": embeddings}

    except FileNotFoundError as err:
        raise HTTPException(status_code=404, detail="File not found") from err
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(
            status_code=500, detail="Failed to generate embeddings"
        ) from err
