"""Настройка логирования приложения"""
import logging
import sys
from pathlib import Path
from typing import Optional

from app.models.config import LoggingConfig


def setup_logging(logging_config: Optional[LoggingConfig] = None):
    """
    Настроить логирование приложения
    
    Args:
        logging_config: Конфигурация логирования (если None, используются значения по умолчанию)
    """
    if logging_config is None:
        logging_config = LoggingConfig()
    
    # Получаем корневой логгер
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, logging_config.level.upper(), logging.INFO))
    
    # Удаляем существующие обработчики
    root_logger.handlers.clear()
    
    # Создаем форматтер
    formatter = logging.Formatter(logging_config.format)
    
    # Добавляем обработчик для консоли, если включен
    if logging_config.console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(getattr(logging, logging_config.level.upper(), logging.INFO))
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)
    
    # Добавляем обработчик для файла, если указан
    if logging_config.file:
        # Создаем директорию для логов, если не существует
        log_file = Path(logging_config.file)
        log_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Определяем режим открытия файла: 'a' для добавления, 'w' для перезаписи
        mode = 'a' if logging_config.append else 'w'
        file_handler = logging.FileHandler(log_file, mode=mode, encoding='utf-8')
        file_handler.setLevel(getattr(logging, logging_config.level.upper(), logging.INFO))
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
    
    # Настраиваем логирование для uvicorn и других библиотек
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)

