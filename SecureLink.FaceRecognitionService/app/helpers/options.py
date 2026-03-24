from pydantic_settings import BaseSettings, SettingsConfigDict

class Options(BaseSettings):
    internal_api_key: str = ""
    internal_api_url: str = ""

    model_config = SettingsConfigDict(env_file="../.env")


options = Options()