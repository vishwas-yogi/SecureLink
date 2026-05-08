from typing import Any

import aioboto3
import botocore.config
from botocore.exceptions import ClientError
from ..helpers.options import options


class StorageService:
    def __init__(self):
        self._session = aioboto3.Session()

        self._bucket_name = options.storage__bucket
        self._endpoint_url = options.storage__endpoint
        self._access_key = options.storage__accesskey
        self._secret_key = options.storage__secretkey

    async def download(self, storage_key: str) -> bytes:
        client_ctx: Any = self._session.client(
            service_name="s3",
            endpoint_url=self._endpoint_url,
            aws_access_key_id=self._access_key,
            aws_secret_access_key=self._secret_key,
            # Cloudflare R2 requires path-style addressing
            config=botocore.config.Config(s3={"addressing_style": "path"}),
        )

        async with client_ctx as client:
            try:
                response = await client.get_object(
                    Bucket=self._bucket_name, Key=storage_key
                )

                async with response["Body"] as stream:
                    return await stream.read()

            except ClientError as e:
                error_code = e.response.get("Error", {}).get("Code")
                if error_code in ["NoSuchKey", "404"]:
                    raise FileNotFoundError(f"File {storage_key} not found in R2.")
                raise e
