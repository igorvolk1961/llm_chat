"""Главный файл FastAPI приложения"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.api import prompts, contexts, current, openai_compat, config as config_api
from app.config.manager import ConfigManager
from app.config.logging_config import setup_logging

# Загрузка конфигурации для настройки логирования
config_path = Path("config/config.yaml")
config_manager = ConfigManager(config_path)

# Настройка логирования
setup_logging(config_manager.app_config.logging)

logger = logging.getLogger(__name__)
logger.info("Инициализация приложения LLM Chat Debugger")

# Инициализация приложения
app = FastAPI(title="LLM Chat Debugger", version="1.0.0")

# Настройка CORS для работы с фронтендом
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("Настройка CORS завершена")

# Подключение роутеров
app.include_router(openai_compat.router, prefix="/v1", tags=["OpenAI Compatible"])
app.include_router(prompts.router, prefix="/api/prompts", tags=["Prompts"])
app.include_router(contexts.router, prefix="/api/contexts", tags=["Contexts"])
app.include_router(current.router, prefix="/api/current", tags=["Current State"])
app.include_router(config_api.router, prefix="/api/config", tags=["Config"])

logger.info("Роутеры подключены")

# Раздача статических файлов (frontend)
frontend_path = Path("frontend")
if frontend_path.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_path)), name="static")
    
    # Перенаправление корневого пути на index.html
    @app.get("/")
    async def root():
        from fastapi.responses import FileResponse
        index_path = frontend_path / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        return {"message": "LLM Chat Debugger API", "version": "1.0.0"}
else:
    @app.get("/")
    async def root():
        """Корневой endpoint"""
        return {"message": "LLM Chat Debugger API", "version": "1.0.0"}


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok"}

