from pydantic_settings import BaseSettings, SettingsConfigDict


class Options(BaseSettings):
    internal_api_key: str = ""
    internal_api_url: str = ""
    storage__uploaddirectory: str = ""
    storage__bucket: str = ""
    storage__endpoint: str = ""
    storage__accesskey: str = ""
    storage__secretkey: str = ""

    model_config = SettingsConfigDict(env_file="../.env")


options = Options()
