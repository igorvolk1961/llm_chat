"""Сервис для работы с LLM провайдером"""
import logging
import httpx
import time
from typing import Optional, Dict, Any
from datetime import datetime

from app.models.chat import ChatCompletionRequest, ChatCompletionResponse
from app.models.config import ModelConfig, AppConfig
from app.models.metadata import ResponseMetadata

logger = logging.getLogger(__name__)


class LLMClient:
    """Клиент для работы с LLM провайдером"""
    
    def __init__(self, model_config: ModelConfig, app_config: Optional[AppConfig] = None):
        """
        Инициализация клиента
        
        Args:
            model_config: Конфигурация модели
            app_config: Конфигурация приложения (опционально, для переопределения параметров модели)
        """
        self.model_config = model_config
        self.app_config = app_config
        self.base_url = model_config.provider_url.rstrip('/')
        self.api_key = model_config.api_key
        self.default_model = model_config.model_name
        # Используем значения из app_config если они есть, иначе из model_config
        self.default_temperature = (
            app_config.temperature if app_config and app_config.temperature is not None
            else model_config.temperature
        )
        self.default_max_tokens = (
            app_config.max_tokens if app_config and app_config.max_tokens is not None
            else model_config.max_tokens
        )
    
    async def chat_completion(
        self,
        request: ChatCompletionRequest,
        timeout: float = 60.0
    ) -> tuple[ChatCompletionResponse, ResponseMetadata]:
        """
        Отправить запрос к LLM провайдеру
        
        Args:
            request: Запрос к API
            timeout: Таймаут запроса в секундах
        
        Returns:
            Кортеж (ответ модели, метаданные)
        """
        # Применяем значения по умолчанию из конфигурации
        if request.temperature is None:
            request.temperature = self.default_temperature
        if request.max_tokens is None:
            request.max_tokens = self.default_max_tokens
        if not request.model or request.model.strip() == '':
            request.model = self.default_model
        
        # Формируем URL
        url = f"{self.base_url}/chat/completions"
        logger.debug(f"Отправка запроса к {url}")
        
        # Формируем заголовки
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Подготавливаем данные запроса
        request_data = request.model_dump(exclude_none=True)
        logger.debug(f"Параметры запроса: model={request_data.get('model')}, max_tokens={request_data.get('max_tokens')}, temperature={request_data.get('temperature')}")
        
        # Засекаем время начала запроса
        start_time = time.time()
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                url,
                headers=headers,
                json=request_data
            )
            
            # Проверяем статус ответа
            response.raise_for_status()
            
            # Парсим ответ
            response_data = response.json()
            
            # Время получения ответа (приблизительно - время до первого токена)
            time_to_first_token = time.time() - start_time
        
        # Время завершения запроса
        end_time = time.time()
        total_time = end_time - start_time
        latency = time_to_first_token
        
        # Парсим ответ
        chat_response = ChatCompletionResponse(**response_data)
        
        # Извлекаем метаданные
        metadata = self._extract_metadata(
            chat_response,
            start_time,
            latency,
            time_to_first_token,
            total_time
        )
        
        return chat_response, metadata
    
    def _extract_metadata(
        self,
        response: ChatCompletionResponse,
        start_time: float,
        latency: float,
        time_to_first_token: float,
        total_time: float
    ) -> ResponseMetadata:
        """
        Извлечь метаданные из ответа
        
        Args:
            response: Ответ от LLM
            start_time: Время начала запроса
            latency: Задержка до начала ответа
            time_to_first_token: Время до первого токена
            total_time: Общее время выполнения
        
        Returns:
            Метаданные ответа
        """
        # Извлекаем usage из ответа
        usage = response.usage
        
        # Извлекаем content из первого choice
        content = ""
        if response.choices and response.choices[0].message:
            content = response.choices[0].message.content or ""
        
        # Подсчитываем статистику
        response_tokens = usage.completion_tokens if usage else 0
        context_tokens = usage.prompt_tokens if usage else 0
        
        # Подсчет слов и символов
        response_words = len(content.split()) if content else 0
        response_characters = len(content) if content else 0
        
        # Вычисляем средние значения
        avg_token_length = (
            response_characters / response_tokens
            if response_tokens > 0 else 0.0
        )
        avg_word_tokens = (
            response_tokens / response_words
            if response_words > 0 else 0.0
        )
        
        # Скорость инференса
        inference_speed = (
            response_tokens / total_time
            if total_time > 0 else 0.0
        )
        
        # Формируем метаданные
        return ResponseMetadata(
            timestamp=datetime.now().isoformat(),
            latency=latency,
            time_to_first_token=time_to_first_token,
            total_time=total_time,
            response_tokens=response_tokens,
            response_words=response_words,
            response_characters=response_characters,
            avg_token_length=avg_token_length,
            avg_word_tokens=avg_word_tokens,
            context_tokens=context_tokens,
            inference_speed=inference_speed
        )

