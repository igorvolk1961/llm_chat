"""Скрипт запуска приложения"""
import uvicorn
from pathlib import Path
from app.config.manager import ConfigManager

if __name__ == "__main__":
    # Загрузка конфигурации
    config_path = Path("config/config.yaml")
    config_manager = ConfigManager(config_path)
    
    # Получаем настройки сервера из конфигурации
    host = config_manager.app_config.host if config_manager.app_config.host else "0.0.0.0"
    port = config_manager.app_config.port if config_manager.app_config.port else 8080
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True
    )

