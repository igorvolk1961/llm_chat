"""OpenAI-совместимые API endpoints"""
import logging
import httpx
from fastapi import APIRouter, HTTPException
from typing import Optional

from app.models.chat import ChatCompletionRequest, ChatCompletionResponse
from app.config.manager import ConfigManager
from app.services.llm_client import LLMClient
from app.storage.current import CurrentDataStorage
from app.storage.stats import StatsStorage
from pathlib import Path

logger = logging.getLogger(__name__)
router = APIRouter()

# Глобальные экземпляры (инициализируются при первом запросе)
_config_manager: Optional[ConfigManager] = None
_llm_client: Optional[LLMClient] = None
_current_storage: Optional[CurrentDataStorage] = None
_stats_storage: Optional[StatsStorage] = None


def get_services():
    """Получить экземпляры всех сервисов"""
    global _config_manager, _llm_client, _current_storage, _stats_storage
    
    if _config_manager is None:
        _config_manager = ConfigManager(Path("config/config.yaml"))
        _llm_client = LLMClient(_config_manager.model_config, _config_manager.app_config)
        _current_storage = CurrentDataStorage(_config_manager.app_config.contexts_dir)
        _stats_storage = StatsStorage(_config_manager.app_config.stats_dir)
    
    return _config_manager, _llm_client, _current_storage, _stats_storage


@router.post("/chat/completions")
async def chat_completions(request: ChatCompletionRequest):
    """
    OpenAI-совместимый endpoint для chat completions
    """
    logger.info(f"Получен запрос chat completion: model={request.model}, messages_count={len(request.messages)}")
    config_manager, llm_client, current_storage, stats_storage = get_services()
    
    try:
        # Отправляем запрос к LLM провайдеру
        logger.debug(f"Отправка запроса к LLM провайдеру")
        response, metadata = await llm_client.chat_completion(request)
        logger.info(f"Получен ответ от LLM: tokens={metadata.response_tokens}, time={metadata.total_time:.2f}s")
        
        # Сохраняем результаты
        if response.choices and response.choices[0].message:
            message = response.choices[0].message
            
            # Сохраняем content
            if message.content:
                current_storage.save_current_content(message.content)
            
            # Сохраняем tool_calls
            if message.tool_calls:
                tool_calls_data = [
                    tool_call.model_dump(exclude_none=True)
                    for tool_call in message.tool_calls
                ]
                current_storage.save_current_tool_call(tool_calls_data)
            else:
                # Сохраняем пустой массив, если tool_calls отсутствуют
                current_storage.save_current_tool_call([])
        
        # Сохраняем статистику
        stats_storage.save_current_stats(metadata)
        
        return response
        
    except httpx.HTTPStatusError as e:
        logger.error(f"Ошибка LLM провайдера: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Ошибка LLM провайдера: {e.response.text}"
        )
    except httpx.RequestError as e:
        logger.error(f"Ошибка подключения к LLM провайдеру: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"Ошибка подключения к LLM провайдеру: {str(e)}"
        )
    except Exception as e:
        logger.exception(f"Внутренняя ошибка при обработке запроса: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Внутренняя ошибка: {str(e)}"
        )

