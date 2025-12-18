"""Модели данных для конфигурации приложения"""
from pydantic import BaseModel, Field
from pathlib import Path
from typing import Optional


class LoggingConfig(BaseModel):
    """Конфигурация логирования"""
    level: str = Field(default="INFO", description="Уровень логирования (DEBUG, INFO, WARNING, ERROR, CRITICAL)")
    format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Формат сообщений лога"
    )
    file: Optional[Path] = Field(default=None, description="Путь к файлу логов (опционально)")
    console: bool = Field(default=True, description="Вывод логов в консоль")
    append: bool = Field(default=False, description="Добавлять логи в конец файла (true) или перезаписывать файл при запуске (false, по умолчанию)")


class AppConfig(BaseModel):
    """Конфигурация приложения"""
    model_config_path: Path = Field(..., description="Путь к конфигурационному файлу модели")
    contexts_dir: Path = Field(..., description="Путь к папке контекстов")
    stats_dir: Path = Field(..., description="Путь к папке статистики")
    prompts_dir: Path = Field(..., description="Путь к папке с промптами")
    system_prompt_path: Path = Field(..., description="Путь к файлу системного промпта")
    temperature: Optional[float] = Field(default=None, description="Температура (приоритет над значением из конфигурации модели)")
    max_tokens: Optional[int] = Field(default=None, description="Максимальная длина ответа (приоритет над значением из конфигурации модели)")
    timeout: Optional[float] = Field(default=None, description="Таймаут запроса к LLM провайдеру в секундах")
    host: Optional[str] = Field(default=None, description="Хост для запуска сервера (по умолчанию 0.0.0.0)")
    port: Optional[int] = Field(default=None, description="Порт для запуска сервера (по умолчанию 8080)")
    logging: Optional[LoggingConfig] = Field(default=None, description="Конфигурация логирования")


class ModelConfig(BaseModel):
    """Конфигурация модели"""
    provider_url: str = Field(..., description="URL провайдера (включая /v1)")
    api_key: str = Field(..., description="API ключ для аутентификации")
    model_name: str = Field(..., description="Название модели")
    temperature: float = Field(..., description="Температура")
    max_tokens: int = Field(..., description="Максимальная длина ответа")
    system_prompt_path: Path = Field(..., description="Путь к файлу системного промпта по умолчанию")

