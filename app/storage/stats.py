"""Сервис для работы со статистикой"""
import json
from pathlib import Path
from typing import Optional, Dict, Any

from app.models.metadata import ResponseMetadata


class StatsStorage:
    """Класс для работы со статистикой"""
    
    def __init__(self, stats_dir: Path):
        """
        Инициализация хранилища статистики
        
        Args:
            stats_dir: Путь к папке со статистикой
        """
        self.stats_dir = Path(stats_dir)
        self.stats_dir.mkdir(parents=True, exist_ok=True)
    
    def save_current_stats(self, metadata: ResponseMetadata) -> Path:
        """
        Сохранить текущую статистику
        
        Args:
            metadata: Метаданные ответа
        
        Returns:
            Путь к сохраненному файлу
        """
        file_path = self.stats_dir / "current_stats.json"
        data = metadata.model_dump()
        file_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding='utf-8'
        )
        return file_path
    
    def get_current_stats(self) -> Optional[Dict[str, Any]]:
        """
        Загрузить текущую статистику
        
        Returns:
            Словарь с данными статистики или None если не найден
        """
        file_path = self.stats_dir / "current_stats.json"
        if not file_path.exists():
            return None
        
        try:
            return json.loads(file_path.read_text(encoding='utf-8'))
        except (json.JSONDecodeError, IOError):
            return None

