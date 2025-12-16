"""Загрузка и валидация конфигурационных файлов"""
import yaml
from pathlib import Path
from typing import Optional
from pydantic import ValidationError

from app.models.config import AppConfig, ModelConfig


class ConfigLoader:
    """Класс для загрузки конфигурации"""
    
    @staticmethod
    def load_yaml(file_path: Path) -> dict:
        """Загрузить YAML файл"""
        with open(file_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    
    @staticmethod
    def load_app_config(config_path: Path) -> AppConfig:
        """Загрузить конфигурацию приложения"""
        if not config_path.exists():
            raise FileNotFoundError(f"Конфигурационный файл не найден: {config_path}")
        
        data = ConfigLoader.load_yaml(config_path)
        
        # Преобразуем строки путей в Path объекты
        if 'model_config_path' in data:
            data['model_config_path'] = Path(data['model_config_path'])
        if 'contexts_dir' in data:
            data['contexts_dir'] = Path(data['contexts_dir'])
        if 'stats_dir' in data:
            data['stats_dir'] = Path(data['stats_dir'])
        if 'prompts_dir' in data:
            data['prompts_dir'] = Path(data['prompts_dir'])
        if 'system_prompt_path' in data:
            data['system_prompt_path'] = Path(data['system_prompt_path'])
        
        # Обработка конфигурации логирования
        if 'logging' in data and data['logging']:
            if 'file' in data['logging'] and data['logging']['file']:
                data['logging']['file'] = Path(data['logging']['file'])
        
        try:
            return AppConfig(**data)
        except ValidationError as e:
            raise ValueError(f"Ошибка валидации конфигурации: {e}")
    
    @staticmethod
    def load_model_config(config_path: Path) -> ModelConfig:
        """Загрузить конфигурацию модели"""
        if not config_path.exists():
            raise FileNotFoundError(f"Конфигурационный файл модели не найден: {config_path}")
        
        data = ConfigLoader.load_yaml(config_path)
        
        # Преобразуем строки путей в Path объекты
        if 'system_prompt_path' in data:
            data['system_prompt_path'] = Path(data['system_prompt_path'])
        
        try:
            return ModelConfig(**data)
        except ValidationError as e:
            raise ValueError(f"Ошибка валидации конфигурации модели: {e}")

