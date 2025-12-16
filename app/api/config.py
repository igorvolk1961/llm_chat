"""API endpoints для управления конфигурацией"""
import yaml
from fastapi import APIRouter, HTTPException
from pathlib import Path
from pydantic import BaseModel

from app.config.manager import ConfigManager

router = APIRouter()

# Глобальный экземпляр менеджера конфигурации
_config_manager: ConfigManager = None


def get_config_manager() -> ConfigManager:
    """Получить экземпляр менеджера конфигурации"""
    global _config_manager
    if _config_manager is None:
        config_path = Path("config/config.yaml")
        _config_manager = ConfigManager(config_path)
    return _config_manager


class ConfigData(BaseModel):
    """Модель для данных конфигурации"""
    model_config_path: str
    contexts_dir: str
    stats_dir: str
    prompts_dir: str
    system_prompt_path: str


@router.get("")
async def get_config():
    """Получить текущую конфигурацию"""
    config_manager = get_config_manager()
    app_config = config_manager.app_config
    
    return {
        "model_config_path": str(app_config.model_config_path),
        "contexts_dir": str(app_config.contexts_dir),
        "stats_dir": str(app_config.stats_dir),
        "prompts_dir": str(app_config.prompts_dir),
        "system_prompt_path": str(app_config.system_prompt_path)
    }


@router.post("")
async def save_config(config_data: ConfigData):
    """Сохранить конфигурацию"""
    config_path = Path("config/config.yaml")
    
    # Формируем данные для сохранения
    data = {
        "model_config_path": config_data.model_config_path,
        "contexts_dir": config_data.contexts_dir,
        "stats_dir": config_data.stats_dir,
        "prompts_dir": config_data.prompts_dir,
        "system_prompt_path": config_data.system_prompt_path
    }
    
    try:
        # Сохраняем YAML файл
        with open(config_path, 'w', encoding='utf-8') as f:
            yaml.dump(data, f, allow_unicode=True, default_flow_style=False, sort_keys=False)
        
        # Перезагружаем конфигурацию
        global _config_manager
        _config_manager = ConfigManager(config_path)
        
        return {"message": "Конфигурация сохранена"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сохранения конфигурации: {str(e)}")


@router.get("/raw")
async def get_config_raw():
    """Получить сырое содержимое конфигурационного файла"""
    config_path = Path("config/config.yaml")
    
    if not config_path.exists():
        raise HTTPException(status_code=404, detail="Конфигурационный файл не найден")
    
    try:
        content = config_path.read_text(encoding='utf-8')
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка чтения конфигурации: {str(e)}")


@router.post("/raw")
async def save_config_raw(content_data: dict):
    """Сохранить сырое содержимое конфигурационного файла"""
    config_path = Path("config/config.yaml")
    content = content_data.get("content", "")
    
    if not content:
        raise HTTPException(status_code=400, detail="Содержимое не может быть пустым")
    
    try:
        # Валидируем YAML перед сохранением
        yaml.safe_load(content)
        
        # Сохраняем файл
        config_path.write_text(content, encoding='utf-8')
        
        # Перезагружаем конфигурацию
        global _config_manager
        _config_manager = ConfigManager(config_path)
        
        return {"message": "Конфигурация сохранена"}
    except yaml.YAMLError as e:
        raise HTTPException(status_code=400, detail=f"Ошибка валидации YAML: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сохранения конфигурации: {str(e)}")


class SystemPromptPathUpdate(BaseModel):
    """Модель для обновления пути к системному промпту"""
    system_prompt_path: str


@router.post("/system-prompt-path")
async def update_system_prompt_path(path_data: SystemPromptPathUpdate):
    """Обновить путь к системному промпту в конфигурации"""
    config_path = Path("config/config.yaml")
    
    if not config_path.exists():
        raise HTTPException(status_code=404, detail="Конфигурационный файл не найден")
    
    try:
        # Читаем текущий конфиг
        config_content = config_path.read_text(encoding='utf-8')
        config_data = yaml.safe_load(config_content)
        
        # Обновляем путь к системному промпту
        new_path = path_data.system_prompt_path
        
        # Используем регулярное выражение для замены пути, сохраняя форматирование
        import re
        old_path = config_data.get('system_prompt_path', '')
        if old_path:
            escaped_path = re.escape(old_path)
            pattern = r'system_prompt_path:\s*' + escaped_path
            replacement = f'system_prompt_path: {new_path}'
            updated_content = re.sub(pattern, replacement, config_content)
        else:
            # Если пути нет, добавляем его
            updated_content = config_content.rstrip() + f'\nsystem_prompt_path: {new_path}\n'
        
        # Сохраняем обновленный конфиг
        config_path.write_text(updated_content, encoding='utf-8')
        
        # Перезагружаем конфигурацию
        global _config_manager
        _config_manager = ConfigManager(config_path)
        
        return {"message": "Путь к системному промпту обновлен", "path": new_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обновления пути: {str(e)}")

