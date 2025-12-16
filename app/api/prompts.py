"""API endpoints для управления промптами"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

from app.storage.prompts import PromptStorage
from app.config.manager import ConfigManager
from pathlib import Path

router = APIRouter()

# Инициализация хранилища промптов (будет инициализирована при первом запросе)
_prompt_storage: PromptStorage = None


def get_prompt_storage() -> PromptStorage:
    """Получить экземпляр хранилища промптов"""
    global _prompt_storage
    if _prompt_storage is None:
        config_manager = ConfigManager(Path("config/config.yaml"))
        _prompt_storage = PromptStorage(config_manager.app_config.prompts_dir)
    return _prompt_storage


class PromptContent(BaseModel):
    """Модель для содержимого промпта"""
    content: str
    extension: str = ".txt"


@router.get("", response_model=List[str])
async def list_prompts():
    """Получить список доступных промптов"""
    storage = get_prompt_storage()
    return storage.list_prompts()


@router.get("/{name}")
async def get_prompt(name: str):
    """Загрузить промпт по имени"""
    storage = get_prompt_storage()
    content = storage.get_prompt(name)
    if content is None:
        raise HTTPException(status_code=404, detail=f"Промпт '{name}' не найден")
    return {"name": name, "content": content}


@router.post("/{name}")
async def save_prompt(name: str, prompt: PromptContent):
    """Сохранить промпт"""
    from app.config.manager import ConfigManager
    import yaml
    from pathlib import Path
    
    storage = get_prompt_storage()
    file_path = storage.save_prompt(name, prompt.content, prompt.extension)
    
    # Если сохраняется системный промпт, обновляем путь в основном конфиге
    # Проверяем, является ли это системным промптом (можно определить по имени или содержимому)
    # Для простоты, если имя файла совпадает с текущим системным промптом, обновляем путь
    config_path = Path("config/config.yaml")
    if config_path.exists():
        try:
            config_data = yaml.safe_load(config_path.read_text(encoding='utf-8'))
            current_system_prompt = config_data.get('system_prompt_path', '')
            
            # Автоматически обновляем путь к системному промпту при изменении имени файла
            if current_system_prompt:
                current_path = Path(current_system_prompt)
                # Если имя файла (без расширения) совпадает с сохраняемым промптом
                if current_path.stem == name:
                    # Обновляем путь в конфиге, сохраняя комментарии и форматирование
                    prompts_dir = Path(config_data.get('prompts_dir', 'prompts'))
                    new_path = prompts_dir / f"{name}{prompt.extension}"
                    
                    # Используем регулярное выражение для замены пути, сохраняя форматирование
                    import re
                    # Экранируем специальные символы в пути для regex
                    escaped_path = re.escape(current_system_prompt)
                    pattern = r'system_prompt_path:\s*' + escaped_path
                    replacement = f'system_prompt_path: {str(new_path)}'
                    config_content = config_path.read_text(encoding='utf-8')
                    updated_content = re.sub(pattern, replacement, config_content)
                    config_path.write_text(updated_content, encoding='utf-8')
        except Exception as e:
            # Игнорируем ошибки обновления конфига - промпт уже сохранен
            print(f"Warning: Failed to update config: {e}")
    
    return {"name": name, "path": str(file_path), "message": "Промпт сохранен"}


@router.delete("/{name}")
async def delete_prompt(name: str):
    """Удалить промпт"""
    storage = get_prompt_storage()
    deleted = storage.delete_prompt(name)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Промпт '{name}' не найден")
    return {"message": f"Промпт '{name}' удален"}

