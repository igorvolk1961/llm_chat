"""Модели данных для работы с сообщениями OpenAI API"""
from typing import Optional, List, Literal
from pydantic import BaseModel, Field


class FunctionCall(BaseModel):
    """Функция в tool call"""
    name: str
    arguments: str


class ToolCall(BaseModel):
    """Вызов инструмента"""
    id: str
    type: Literal["function"] = "function"
    function: FunctionCall


class Message(BaseModel):
    """
    Сообщение в контексте согласно OpenAI API
    
    Flow работы с tool calls:
    1. Assistant message может содержать tool_calls (массив вызовов инструментов)
    2. Content в assistant message может быть null (только tool_calls) или не пустым (одновременно с tool_calls)
    3. Tool message (role="tool") содержит:
       - tool_call_id: соответствует id из tool_calls
       - name: имя вызванной функции
       - content: результат выполнения функции (обычно JSON строка)
    4. После добавления tool message в контекст, модель получает результаты и формирует финальный ответ
    """
    role: Literal["system", "user", "assistant", "tool"]
    content: Optional[str] = None  # Может быть null для assistant с tool_calls, но может быть не пустым одновременно
    name: Optional[str] = None  # Для function/tool messages
    tool_calls: Optional[List[ToolCall]] = None  # Только для assistant messages, может быть одновременно с content
    tool_call_id: Optional[str] = None  # Только для tool messages

    class Config:
        json_schema_extra = {
            "example": {
                "role": "user",
                "content": "Hello, how are you?"
            }
        }

