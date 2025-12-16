"""Модуль для работы с файлами"""
from app.storage.prompts import PromptStorage
from app.storage.contexts import ContextStorage
from app.storage.stats import StatsStorage
from app.storage.current import CurrentDataStorage

__all__ = [
    "PromptStorage",
    "ContextStorage",
    "StatsStorage",
    "CurrentDataStorage",
]

