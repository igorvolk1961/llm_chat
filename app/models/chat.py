"""Модели данных для запросов и ответов чата"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from app.models.message import Message, ToolCall


class ChatCompletionMessage(BaseModel):
    """Сообщение для запроса chat completion"""
    role: str
    content: Optional[str] = None
    name: Optional[str] = None
    tool_calls: Optional[List[ToolCall]] = None
    tool_call_id: Optional[str] = None


class ChatCompletionRequest(BaseModel):
    """Запрос к API chat completions"""
    model: Optional[str] = None  # Опционально, будет использоваться из конфигурации если не указано
    messages: List[ChatCompletionMessage]
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    tools: Optional[List[Dict[str, Any]]] = None
    tool_choice: Optional[str] = None
    stream: Optional[bool] = False


class ChoiceDelta(BaseModel):
    """Дельта для streaming ответов"""
    role: Optional[str] = None
    content: Optional[str] = None
    tool_calls: Optional[List[ToolCall]] = None


class Choice(BaseModel):
    """Вариант ответа"""
    index: int
    message: Optional[Message] = None
    delta: Optional[ChoiceDelta] = None
    finish_reason: Optional[str] = None


class Usage(BaseModel):
    """Использование токенов"""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatCompletionResponse(BaseModel):
    """Ответ от API chat completions"""
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[Choice]
    usage: Optional[Usage] = None

