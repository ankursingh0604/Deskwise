from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    groq_api_key: str
    stripe_secret_key: str
    stripe_webhook_secret: str
    stripe_price_starter: str
    stripe_price_pro: str

    class Config:
        env_file = ".env"


settings = Settings()