"""Менеджер конфигурации приложения"""
from pathlib import Path
from app.config.loader import ConfigLoader
from app.models.config import AppConfig, ModelConfig


class ConfigManager:
    """Менеджер для управления конфигурацией"""
    
    def __init__(self, config_path: Path):
        """
        Инициализация менеджера конфигурации
        
        Args:
            config_path: Путь к основному конфигурационному файлу
        """
        self._app_config: AppConfig = ConfigLoader.load_app_config(config_path)
        self._model_config: ModelConfig = ConfigLoader.load_model_config(
            self._app_config.model_config_path
        )
    
    @property
    def app_config(self) -> AppConfig:
        """Получить конфигурацию приложения"""
        return self._app_config
    
    @property
    def model_config(self) -> ModelConfig:
        """Получить конфигурацию модели"""
        return self._model_config
    
    def reload(self, config_path: Path):
        """Перезагрузить конфигурацию"""
        self._app_config = ConfigLoader.load_app_config(config_path)
        self._model_config = ConfigLoader.load_model_config(
            self._app_config.model_config_path
        )

