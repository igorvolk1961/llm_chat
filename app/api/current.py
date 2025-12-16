"""API endpoints для текущего состояния"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.storage.prompts import PromptStorage
from app.storage.contexts import ContextStorage
from app.storage.current import CurrentDataStorage
from app.storage.stats import StatsStorage
from app.models.message import Message
from app.models.metadata import ResponseMetadata
from app.config.manager import ConfigManager
from pathlib import Path

router = APIRouter()

# Инициализация хранилищ (будут инициализированы при первом запросе)
_prompt_storage: PromptStorage = None
_context_storage: ContextStorage = None
_current_storage: CurrentDataStorage = None
_stats_storage: StatsStorage = None


def get_storages():
    """Получить экземпляры всех хранилищ"""
    global _prompt_storage, _context_storage, _current_storage, _stats_storage
    if _prompt_storage is None:
        config_manager = ConfigManager(Path("config/config.yaml"))
        _prompt_storage = PromptStorage(config_manager.app_config.prompts_dir)
        _context_storage = ContextStorage(config_manager.app_config.contexts_dir)
        _current_storage = CurrentDataStorage(config_manager.app_config.contexts_dir)
        _stats_storage = StatsStorage(config_manager.app_config.stats_dir)
    return _prompt_storage, _context_storage, _current_storage, _stats_storage


class CurrentPrompt(BaseModel):
    """Модель для текущего промпта"""
    content: str


class CurrentSystemPrompt(BaseModel):
    """Модель для текущего системного промпта"""
    content: str


class CurrentTools(BaseModel):
    """Модель для текущих tools"""
    tools: List[Dict[str, Any]]


class CurrentContext(BaseModel):
    """Модель для текущего контекста"""
    name: Optional[str] = None
    messages: List[dict]


class CurrentContent(BaseModel):
    """Модель для текущего content ответа"""
    content: str


class CurrentToolCall(BaseModel):
    """Модель для текущего tool_call ответа"""
    tool_calls: List[dict]


# Endpoints для промпта
@router.get("/prompt")
async def get_current_prompt():
    """Получить текущий промпт"""
    prompt_storage, _, _, _ = get_storages()
    # В реальной реализации нужно хранить текущий промпт в памяти или файле
    # Пока возвращаем пустую строку
    return {"content": ""}


@router.post("/prompt")
async def set_current_prompt(prompt: CurrentPrompt):
    """Установить текущий промпт"""
    # В реальной реализации нужно сохранять текущий промпт
    return {"message": "Промпт установлен"}


# Endpoints для системного промпта
@router.get("/system-prompt")
async def get_current_system_prompt():
    """Получить текущий системный промпт"""
    config_manager = ConfigManager(Path("config/config.yaml"))
    # Используем путь из основного конфига, если указан, иначе из конфига модели
    system_prompt_path = config_manager.app_config.system_prompt_path
    if not system_prompt_path.exists():
        # Если файл не найден, пробуем путь из конфига модели (по умолчанию)
        system_prompt_path = config_manager.model_config.system_prompt_path
    
    if system_prompt_path.exists():
        content = system_prompt_path.read_text(encoding='utf-8')
        return {"content": content}
    return {"content": ""}


@router.post("/system-prompt")
async def set_current_system_prompt(system_prompt: CurrentSystemPrompt):
    """Установить текущий системный промпт"""
    # В реальной реализации нужно сохранять текущий системный промпт
    return {"message": "Системный промпт установлен"}


# Endpoints для tools
@router.get("/tools")
async def get_current_tools():
    """Получить текущие tools"""
    return {"tools": []}


@router.post("/tools")
async def set_current_tools(tools: CurrentTools):
    """Установить текущие tools"""
    return {"message": "Tools установлены"}


# Endpoints для контекста
@router.get("/context")
async def get_current_context():
    """Получить текущий контекст"""
    _, _, current_storage, _ = get_storages()
    current_context = current_storage.get_current_context()
    if current_context:
        return current_context
    return {"name": "", "messages": []}


@router.post("/context")
async def set_current_context(context: CurrentContext):
    """Установить текущий контекст"""
    _, context_storage, current_storage, _ = get_storages()
    messages = [Message(**msg) for msg in context.messages]
    
    # Сохраняем в текущий контекст
    current_storage.save_current_context(context.name or "", messages)
    
    # Также сохраняем в именованный контекст (если имя указано)
    if context.name:
        context_storage.save_context(context.name, messages)
    
    return {"message": "Контекст установлен"}


@router.delete("/context")
async def clear_current_context():
    """Очистить текущий контекст"""
    _, _, current_storage, _ = get_storages()
    current_storage.clear_current_context()
    return {"message": "Текущий контекст очищен"}


# Endpoints для ответов
@router.get("/content")
async def get_current_content():
    """Получить текущий content ответа"""
    _, _, current_storage, _ = get_storages()
    content = current_storage.get_current_content()
    return {"content": content or ""}


@router.post("/content")
async def set_current_content(content: CurrentContent):
    """Установить текущий content ответа"""
    _, _, current_storage, _ = get_storages()
    current_storage.save_current_content(content.content)
    return {"message": "Content сохранен"}


@router.get("/tool-call")
async def get_current_tool_call():
    """Получить текущий tool_call ответа"""
    _, _, current_storage, _ = get_storages()
    tool_calls = current_storage.get_current_tool_call()
    return {"tool_calls": tool_calls or []}


@router.post("/tool-call")
async def set_current_tool_call(tool_call: CurrentToolCall):
    """Установить текущий tool_call ответа"""
    _, _, current_storage, _ = get_storages()
    current_storage.save_current_tool_call(tool_call.tool_calls)
    return {"message": "Tool call сохранен"}


@router.get("/stats")
async def get_current_stats():
    """Получить текущую статистику"""
    _, _, _, stats_storage = get_storages()
    stats = stats_storage.get_current_stats()
    return stats or {}

