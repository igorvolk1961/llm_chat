/** Функциональность работы с конфигурацией */

// Вкладка Конфигурация
async function initConfigTab() {
    const configInput = document.getElementById('configInput');
    const configPathDisplay = document.getElementById('configPathDisplay');
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    
    // Путь к конфигурации всегда одинаковый
    if (configPathDisplay) {
        configPathDisplay.textContent = 'Путь: config/config.yaml';
    }
    
    // Проверка наличия элементов
    if (!configInput || !saveConfigBtn) {
        console.error('Config tab elements not found');
        return;
    }
    
    // Загрузка конфигурации (доступна глобально для обновления из других модулей)
    window.loadConfig = async function() {
        try {
            const data = await api.getConfigRaw();
            if (configInput) {
                configInput.value = data.content || '';
            }
        } catch (error) {
            console.error('Failed to load config:', error);
            // Ошибка уже показана в API клиенте
        }
    };
    
    // Сохранение конфигурации
    saveConfigBtn.addEventListener('click', async () => {
        const content = configInput.value.trim();
        if (!content) {
            api.showError('Конфигурация не может быть пустой');
            return;
        }
        
        try {
            await api.saveConfigRaw(content);
            api.showSuccess('Конфигурация сохранена');
            // Перезагружаем страницу для применения изменений
            setTimeout(() => {
                location.reload();
            }, 1000);
        } catch (error) {
            // Ошибка уже показана в API клиенте
        }
    });
    
    // Валидация YAML при вводе (простая проверка структуры)
    configInput.addEventListener('blur', () => {
        const content = configInput.value.trim();
        if (content) {
            // Простая проверка наличия обязательных полей
            const requiredFields = ['model_config_path', 'contexts_dir', 'stats_dir', 'prompts_dir', 'system_prompt_path'];
            const hasAllFields = requiredFields.every(field => content.includes(field + ':'));
            
            if (hasAllFields) {
                configInput.style.borderColor = '#3e3e42';
            } else {
                configInput.style.borderColor = '#f48771';
            }
        }
    });
    
    // Инициализация
    await window.loadConfig();
}

// Экспорт функций
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initConfigTab };
}

