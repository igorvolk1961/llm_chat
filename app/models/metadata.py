"""Модели данных для метаданных и статистики"""
from typing import Optional
from pydantic import BaseModel


class ResponseMetadata(BaseModel):
    """Метаданные ответа модели"""
    timestamp: str
    latency: float  # Время от запроса до начала ответа (секунды)
    time_to_first_token: float  # Время до первого токена (секунды)
    total_time: float  # Общее время ответа (секунды)
    response_tokens: int  # Количество токенов в ответе
    response_words: int  # Количество слов в ответе
    response_characters: int  # Количество символов в ответе
    avg_token_length: float  # Средняя длина токена в символах
    avg_word_tokens: float  # Средняя длина слова в токенах
    context_tokens: int  # Количество токенов в контексте
    inference_speed: float  # Скорость инференса (tokens/sec)

