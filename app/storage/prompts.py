"""Сервис для работы с промптами"""
from pathlib import Path
from typing import List, Optional


class PromptStorage:
    """Класс для работы с промптами"""
    
    def __init__(self, prompts_dir: Path):
        """
        Инициализация хранилища промптов
        
        Args:
            prompts_dir: Путь к папке с промптами
        """
        self.prompts_dir = Path(prompts_dir)
        self.prompts_dir.mkdir(parents=True, exist_ok=True)
    
    def list_prompts(self) -> List[str]:
        """Получить список доступных промптов"""
        if not self.prompts_dir.exists():
            return []
        
        prompts = []
        for file in self.prompts_dir.iterdir():
            if file.is_file() and not file.name.startswith('.'):
                prompts.append(file.stem)
        return sorted(prompts)
    
    def get_prompt(self, name: str) -> Optional[str]:
        """
        Загрузить промпт по имени
        
        Args:
            name: Имя промпта (без расширения)
        
        Returns:
            Содержимое промпта или None если не найден
        """
        # Пробуем разные расширения
        for ext in ['.txt', '.md', '']:
            file_path = self.prompts_dir / f"{name}{ext}"
            if file_path.exists():
                return file_path.read_text(encoding='utf-8')
        return None
    
    def save_prompt(self, name: str, content: str, extension: str = '.txt') -> Path:
        """
        Сохранить промпт
        
        Args:
            name: Имя промпта
            content: Содержимое промпта
            extension: Расширение файла (по умолчанию .txt)
        
        Returns:
            Путь к сохраненному файлу
        """
        file_path = self.prompts_dir / f"{name}{extension}"
        file_path.write_text(content, encoding='utf-8')
        return file_path
    
    def delete_prompt(self, name: str) -> bool:
        """
        Удалить промпт
        
        Args:
            name: Имя промпта
        
        Returns:
            True если удален, False если не найден
        """
        # Пробуем разные расширения
        for ext in ['.txt', '.md', '']:
            file_path = self.prompts_dir / f"{name}{ext}"
            if file_path.exists():
                file_path.unlink()
                return True
        return False

