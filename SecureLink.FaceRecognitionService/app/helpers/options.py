from pydantic_settings import BaseSettings, SettingsConfigDict


class Options(BaseSettings):
    internal__apikey: str = ""
    internal__apiurl: str = ""
    storage__uploaddirectory: str = ""
    storage__bucket: str = ""
    storage__endpoint: str = ""
    storage__accesskey: str = ""
    storage__secretkey: str = ""

    model_config = SettingsConfigDict(extra="ignore")


options = Options()
