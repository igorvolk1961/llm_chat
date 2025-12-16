"""Сервис для работы с контекстами диалогов"""
import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.models.message import Message


class ContextStorage:
    """Класс для работы с контекстами"""
    
    def __init__(self, contexts_dir: Path):
        """
        Инициализация хранилища контекстов
        
        Args:
            contexts_dir: Путь к папке с контекстами
        """
        self.contexts_dir = Path(contexts_dir)
        self.contexts_dir.mkdir(parents=True, exist_ok=True)
    
    def _generate_default_name(self) -> str:
        """Сгенерировать имя по умолчанию из временной метки"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"context_{timestamp}"
    
    def list_contexts(self) -> List[str]:
        """Получить список доступных контекстов"""
        if not self.contexts_dir.exists():
            return []
        
        contexts = []
        for file in self.contexts_dir.iterdir():
            if file.is_file() and file.suffix == '.json' and not file.name.startswith('current_'):
                contexts.append(file.stem)
        return sorted(contexts)
    
    def get_context(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Загрузить контекст по имени
        
        Args:
            name: Имя контекста (без расширения)
        
        Returns:
            Словарь с данными контекста или None если не найден
        """
        file_path = self.contexts_dir / f"{name}.json"
        if not file_path.exists():
            return None
        
        try:
            data = json.loads(file_path.read_text(encoding='utf-8'))
            return data
        except (json.JSONDecodeError, IOError):
            return None
    
    def save_context(self, name: str, messages: List[Message], create_if_not_exists: bool = True) -> Path:
        """
        Сохранить контекст
        
        Args:
            name: Имя контекста (если пустое, генерируется из временной метки)
            messages: Список сообщений
            create_if_not_exists: Создать новый контекст если не существует
        
        Returns:
            Путь к сохраненному файлу
        """
        if not name:
            name = self._generate_default_name()
        
        file_path = self.contexts_dir / f"{name}.json"
        
        data = {
            "name": name,
            "messages": [msg.model_dump(exclude_none=True) for msg in messages]
        }
        
        file_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding='utf-8'
        )
        return file_path
    
    def delete_context(self, name: str) -> bool:
        """
        Удалить контекст
        
        Args:
            name: Имя контекста
        
        Returns:
            True если удален, False если не найден
        """
        file_path = self.contexts_dir / f"{name}.json"
        if file_path.exists():
            file_path.unlink()
            return True
        return False
    
    def rename_context(self, old_name: str, new_name: str) -> bool:
        """
        Переименовать контекст
        
        Args:
            old_name: Старое имя контекста
            new_name: Новое имя контекста
        
        Returns:
            True если переименован, False если не найден
        """
        old_path = self.contexts_dir / f"{old_name}.json"
        new_path = self.contexts_dir / f"{new_name}.json"
        
        if not old_path.exists():
            return False
        
        if new_path.exists():
            return False  # Новое имя уже существует
        
        old_path.rename(new_path)
        
        # Обновить имя в файле
        data = json.loads(new_path.read_text(encoding='utf-8'))
        data['name'] = new_name
        new_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding='utf-8'
        )
        
        return True

