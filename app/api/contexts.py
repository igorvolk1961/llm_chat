"""API endpoints для управления контекстами"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from app.storage.contexts import ContextStorage
from app.models.message import Message
from app.config.manager import ConfigManager
from pathlib import Path

router = APIRouter()

# Инициализация хранилища контекстов (будет инициализирована при первом запросе)
_context_storage: ContextStorage = None


def get_context_storage() -> ContextStorage:
    """Получить экземпляр хранилища контекстов"""
    global _context_storage
    if _context_storage is None:
        config_manager = ConfigManager(Path("config/config.yaml"))
        _context_storage = ContextStorage(config_manager.app_config.contexts_dir)
    return _context_storage


class ContextData(BaseModel):
    """Модель для данных контекста"""
    name: Optional[str] = None
    messages: List[dict]


class RenameRequest(BaseModel):
    """Модель для запроса переименования"""
    new_name: str


@router.get("", response_model=List[str])
async def list_contexts():
    """Получить список доступных контекстов"""
    storage = get_context_storage()
    return storage.list_contexts()


@router.get("/{name}")
async def get_context(name: str):
    """Загрузить контекст по имени"""
    storage = get_context_storage()
    context = storage.get_context(name)
    if context is None:
        raise HTTPException(status_code=404, detail=f"Контекст '{name}' не найден")
    return context


@router.post("/{name}")
async def save_context(name: str, context_data: ContextData):
    """Сохранить контекст"""
    storage = get_context_storage()
    
    # Преобразуем словари в объекты Message
    messages = [Message(**msg) for msg in context_data.messages]
    
    # Используем name из запроса, если не указан в context_data
    context_name = context_data.name if context_data.name else name
    
    file_path = storage.save_context(context_name, messages)
    return {"name": context_name, "path": str(file_path), "message": "Контекст сохранен"}


@router.delete("/{name}")
async def delete_context(name: str):
    """Удалить контекст"""
    storage = get_context_storage()
    deleted = storage.delete_context(name)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Контекст '{name}' не найден")
    return {"message": f"Контекст '{name}' удален"}


@router.post("/{name}/rename")
async def rename_context(name: str, rename_request: RenameRequest):
    """Переименовать контекст"""
    storage = get_context_storage()
    renamed = storage.rename_context(name, rename_request.new_name)
    if not renamed:
        raise HTTPException(status_code=404, detail=f"Контекст '{name}' не найден")
    return {"message": f"Контекст '{name}' переименован в '{rename_request.new_name}'"}

