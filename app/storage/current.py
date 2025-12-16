"""Сервис для работы с текущими данными (автосохранение)"""
from pathlib import Path
from typing import Optional, List

from app.models.message import Message
from app.models.metadata import ResponseMetadata


class CurrentDataStorage:
    """Класс для работы с текущими данными"""
    
    def __init__(self, contexts_dir: Path):
        """
        Инициализация хранилища текущих данных
        
        Args:
            contexts_dir: Путь к папке для сохранения текущих данных
        """
        self.contexts_dir = Path(contexts_dir)
        self.contexts_dir.mkdir(parents=True, exist_ok=True)
    
    def save_current_content(self, content: str) -> Path:
        """
        Сохранить текущий content ответа
        
        Args:
            content: Содержимое ответа
        
        Returns:
            Путь к сохраненному файлу
        """
        file_path = self.contexts_dir / "current_content.md"
        file_path.write_text(content, encoding='utf-8')
        return file_path
    
    def get_current_content(self) -> Optional[str]:
        """
        Загрузить текущий content ответа
        
        Returns:
            Содержимое ответа или None если не найден
        """
        file_path = self.contexts_dir / "current_content.md"
        if not file_path.exists():
            return None
        return file_path.read_text(encoding='utf-8')
    
    def save_current_tool_call(self, tool_calls: list) -> Path:
        """
        Сохранить текущий tool_call ответа
        
        Args:
            tool_calls: Список tool calls
        
        Returns:
            Путь к сохраненному файлу
        """
        import json
        file_path = self.contexts_dir / "current_tool_call.json"
        file_path.write_text(
            json.dumps(tool_calls, ensure_ascii=False, indent=2),
            encoding='utf-8'
        )
        return file_path
    
    def get_current_tool_call(self) -> Optional[list]:
        """
        Загрузить текущий tool_call ответа
        
        Returns:
            Список tool calls или None если не найден
        """
        import json
        file_path = self.contexts_dir / "current_tool_call.json"
        if not file_path.exists():
            return None
        try:
            return json.loads(file_path.read_text(encoding='utf-8'))
        except (json.JSONDecodeError, IOError):
            return None
    
    def save_current_context(self, name: str, messages: List[Message]) -> Path:
        """
        Сохранить текущий контекст
        
        Args:
            name: Имя контекста
            messages: Список сообщений
        
        Returns:
            Путь к сохраненному файлу
        """
        import json
        file_path = self.contexts_dir / "current_context.json"
        data = {
            "name": name,
            "messages": [msg.model_dump(exclude_none=True) for msg in messages]
        }
        file_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding='utf-8'
        )
        return file_path
    
    def get_current_context(self) -> Optional[dict]:
        """
        Загрузить текущий контекст
        
        Returns:
            Словарь с данными контекста или None если не найден
        """
        import json
        file_path = self.contexts_dir / "current_context.json"
        if not file_path.exists():
            return None
        try:
            return json.loads(file_path.read_text(encoding='utf-8'))
        except (json.JSONDecodeError, IOError):
            return None
    
    def clear_current_context(self) -> bool:
        """
        Очистить текущий контекст (удалить файл)
        
        Returns:
            True если файл удален, False если не найден
        """
        file_path = self.contexts_dir / "current_context.json"
        if file_path.exists():
            file_path.unlink()
            return True
        return False

