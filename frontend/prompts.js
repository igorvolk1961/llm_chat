/** Функциональность работы с промптами */

// Вкладка Промпт
async function initPromptTab() {
    const promptInput = document.getElementById('promptInput');
    const promptFileInput = document.getElementById('promptFileInput');
    const promptPathDisplay = document.getElementById('promptPathDisplay');
    const savePromptBtn = document.getElementById('savePromptBtn');
    const loadPromptBtn = document.getElementById('loadPromptBtn');
    const clearPromptBtn = document.getElementById('clearPromptBtn');
    
    let currentPromptName = '';
    
    // Функция для обновления отображения пути
    async function updatePathDisplay() {
        try {
            const config = await api.getConfig();
            const promptsDir = config.prompts_dir || 'prompts';
            const name = currentPromptName || 'Новый промпт';
            const path = name === 'Новый промпт' ? 'Новый промпт' : `${promptsDir}/${name}.txt`;
            if (promptPathDisplay) {
                promptPathDisplay.textContent = `Путь: ${path}`;
            }
        } catch (error) {
            if (promptPathDisplay) {
                promptPathDisplay.textContent = 'Путь: Новый промпт';
            }
        }
    }
    
    // Обработчик выбора файла
    promptFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const content = await readFileContent(file);
            promptInput.value = content;
            
            // Определяем имя файла (без расширения)
            const fileName = file.name;
            const lastDotIndex = fileName.lastIndexOf('.');
            const fileNameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
            
            // Обновляем текущее имя промпта и путь
            currentPromptName = fileNameWithoutExt;
            await updatePathDisplay();
            
            api.showSuccess('Промпт загружен из файла');
        } catch (error) {
            api.showError('Ошибка чтения файла: ' + error.message);
        }
        
        // Сброс input для возможности повторного выбора того же файла
        promptFileInput.value = '';
    });
    
    // Сохранение промпта
    savePromptBtn.addEventListener('click', async () => {
        const content = promptInput.value.trim();
        if (!content) {
            api.showError('Промпт не может быть пустым');
            return;
        }
        
        showPrompt('Введите имя промпта:', currentPromptName || '', async (name) => {
            if (!name) return;
            
            try {
                await api.savePrompt(name, content);
                currentPromptName = name;
                await updatePathDisplay();
                api.showSuccess('Промпт сохранен');
            } catch (error) {
                // Ошибка уже показана в API клиенте
            }
        });
    });
    
    // Загрузка промпта из файла
    loadPromptBtn.addEventListener('click', () => {
        promptFileInput.click();
    });
    
    // Очистка промпта
    clearPromptBtn.addEventListener('click', () => {
        showConfirm('Очистить промпт?', () => {
            promptInput.value = '';
            currentPromptName = '';
            updatePathDisplay();
        });
    });
    
    // Инициализация отображения пути
    await updatePathDisplay();
}

// Вкладка Системный промпт
async function initSystemPromptTab() {
    const systemPromptInput = document.getElementById('systemPromptInput');
    const systemPromptFileInput = document.getElementById('systemPromptFileInput');
    const systemPromptPathDisplay = document.getElementById('systemPromptPathDisplay');
    const saveSystemPromptBtn = document.getElementById('saveSystemPromptBtn');
    const loadSystemPromptBtn = document.getElementById('loadSystemPromptBtn');
    const loadDefaultSystemPromptBtn = document.getElementById('loadDefaultSystemPromptBtn');
    const clearSystemPromptBtn = document.getElementById('clearSystemPromptBtn');
    
    // Функция для обновления отображения пути
    async function updatePathDisplay() {
        try {
            const config = await api.getConfig();
            const path = config.system_prompt_path || 'не указан';
            if (systemPromptPathDisplay) {
                systemPromptPathDisplay.textContent = `Путь: ${path}`;
            }
        } catch (error) {
            if (systemPromptPathDisplay) {
                systemPromptPathDisplay.textContent = 'Путь: ошибка загрузки';
            }
        }
    }
    
    // Обработчик выбора файла
    systemPromptFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const content = await readFileContent(file);
            systemPromptInput.value = content;
            
            // Определяем имя файла и расширение
            const fileName = file.name;
            const lastDotIndex = fileName.lastIndexOf('.');
            const fileExtension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '.txt';
            const fileNameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
            
            // Сохраняем файл в папку prompts
            await api.savePrompt(fileNameWithoutExt, content, fileExtension);
            
            // Получаем текущую конфигурацию для определения prompts_dir
            const config = await api.getConfig();
            const promptsDir = config.prompts_dir || 'prompts';
            
            // Обновляем путь к системному промпту в конфиге
            const newPath = `${promptsDir}/${fileName}`;
            await api.updateSystemPromptPath(newPath);
            
            // Обновляем отображение пути
            await updatePathDisplay();
            
            // Автоматически обновляем содержимое вкладки конфигурации
            if (typeof window.loadConfig === 'function') {
                await window.loadConfig();
            }
            
            api.showSuccess('Системный промпт загружен и путь в конфигурации обновлен');
        } catch (error) {
            api.showError('Ошибка загрузки файла: ' + error.message);
        }
        
        // Сброс input для возможности повторного выбора того же файла
        systemPromptFileInput.value = '';
    });
    
    // Сохранение системного промпта
    saveSystemPromptBtn.addEventListener('click', async () => {
        const content = systemPromptInput.value.trim();
        if (!content) {
            api.showError('Системный промпт не может быть пустым');
            return;
        }
        
        showPrompt('Введите имя промпта:', '', async (name) => {
            if (!name) return;
            
            try {
                await api.savePrompt(name, content);
                api.showSuccess('Системный промпт сохранен');
            } catch (error) {
                // Ошибка уже показана в API клиенте
            }
        });
    });
    
    // Загрузка системного промпта из файла
    loadSystemPromptBtn.addEventListener('click', () => {
        systemPromptFileInput.click();
    });
    
    // Загрузка системного промпта по умолчанию
    loadDefaultSystemPromptBtn.addEventListener('click', async () => {
        try {
            const data = await api.getCurrentSystemPrompt();
            systemPromptInput.value = data.content || '';
            api.showSuccess('Системный промпт по умолчанию загружен');
        } catch (error) {
            // Ошибка уже показана в API клиенте
        }
    });
    
    // Очистка системного промпта
    clearSystemPromptBtn.addEventListener('click', () => {
        showConfirm('Очистить системный промпт?', () => {
            systemPromptInput.value = '';
        });
    });
    
    // Автоматическая загрузка системного промпта при старте
    try {
        const data = await api.getCurrentSystemPrompt();
        if (data && data.content) {
            systemPromptInput.value = data.content;
        }
    } catch (error) {
        // Если системный промпт не найден или произошла ошибка - игнорируем
        // (не показываем ошибку, так как системный промпт может быть не задан)
        console.log('Системный промпт по умолчанию не загружен:', error.message);
    }
    
    // Загружаем и отображаем путь при инициализации
    await updatePathDisplay();
    
    // Функция для обновления состояния полей системного промпта (доступна глобально)
    window.updateSystemPromptFieldsState = function(isContextEmpty) {
        // Если контекст не пустой - отключаем поля, иначе включаем
        const disabled = !isContextEmpty;
        
        // Отключаем/включаем все поля и кнопки
        if (systemPromptInput) {
            systemPromptInput.disabled = disabled;
            systemPromptInput.style.opacity = disabled ? '0.6' : '1';
            systemPromptInput.style.cursor = disabled ? 'not-allowed' : 'text';
        }
        if (systemPromptFileInput) {
            systemPromptFileInput.disabled = disabled;
        }
        if (saveSystemPromptBtn) {
            saveSystemPromptBtn.disabled = disabled;
            saveSystemPromptBtn.style.opacity = disabled ? '0.6' : '1';
            saveSystemPromptBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
        }
        if (loadSystemPromptBtn) {
            loadSystemPromptBtn.disabled = disabled;
            loadSystemPromptBtn.style.opacity = disabled ? '0.6' : '1';
            loadSystemPromptBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
        }
        if (loadDefaultSystemPromptBtn) {
            loadDefaultSystemPromptBtn.disabled = disabled;
            loadDefaultSystemPromptBtn.style.opacity = disabled ? '0.6' : '1';
            loadDefaultSystemPromptBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
        }
        if (clearSystemPromptBtn) {
            clearSystemPromptBtn.disabled = disabled;
            clearSystemPromptBtn.style.opacity = disabled ? '0.6' : '1';
            clearSystemPromptBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
        }
    };
    
    // Инициализируем состояние полей при загрузке
    // Проверяем, пуст ли контекст
    try {
        const currentContext = await api.getCurrentContext();
        const isContextEmpty = !currentContext || !currentContext.messages || currentContext.messages.length === 0;
        window.updateSystemPromptFieldsState(isContextEmpty);
    } catch (error) {
        // Если ошибка - считаем контекст пустым
        window.updateSystemPromptFieldsState(true);
    }
}

// Вкладка tools
async function initToolsTab() {
    const toolsInput = document.getElementById('toolsInput');
    const toolsFileInput = document.getElementById('toolsFileInput');
    const saveToolsBtn = document.getElementById('saveToolsBtn');
    const loadToolsBtn = document.getElementById('loadToolsBtn');
    const clearToolsBtn = document.getElementById('clearToolsBtn');
    
    // Валидация JSON
    function validateJSON(text) {
        if (!text.trim()) {
            return { valid: true, value: null }; // Пустое значение допустимо
        }
        
        try {
            const parsed = JSON.parse(text);
            return { valid: true, value: parsed };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
    
    // Обработчик выбора файла
    toolsFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const content = await readFileContent(file);
            // Проверяем валидность JSON
            const validation = validateJSON(content);
            if (!validation.valid) {
                api.showError('Ошибка валидации JSON: ' + validation.error);
                return;
            }
            toolsInput.value = content;
            api.showSuccess('Tools загружены из файла');
        } catch (error) {
            api.showError('Ошибка чтения файла: ' + error.message);
        }
        
        // Сброс input для возможности повторного выбора того же файла
        toolsFileInput.value = '';
    });
    
    // Сохранение tools
    saveToolsBtn.addEventListener('click', async () => {
        const content = toolsInput.value.trim();
        if (!content) {
            api.showError('Tools не могут быть пустыми');
            return;
        }
        
        const validation = validateJSON(content);
        if (!validation.valid) {
            api.showError('Ошибка валидации JSON: ' + validation.error);
            return;
        }
        
        showPrompt('Введите имя промпта:', '', async (name) => {
            if (!name) return;
            
            try {
                await api.savePrompt(name, content, '.json');
                api.showSuccess('Tools сохранены');
            } catch (error) {
                // Ошибка уже показана в API клиенте
            }
        });
    });
    
    // Загрузка tools из файла
    loadToolsBtn.addEventListener('click', () => {
        toolsFileInput.click();
    });
    
    // Очистка tools
    clearToolsBtn.addEventListener('click', () => {
        showConfirm('Очистить tools?', () => {
            toolsInput.value = '';
        });
    });
    
    // Валидация при вводе
    toolsInput.addEventListener('blur', () => {
        const validation = validateJSON(toolsInput.value);
        if (!validation.valid && toolsInput.value.trim()) {
            toolsInput.style.borderColor = '#f48771';
        } else {
            toolsInput.style.borderColor = '#3e3e42';
        }
    });
}

// Вспомогательная функция для чтения содержимого файла
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Ошибка чтения файла'));
        reader.readAsText(file, 'utf-8');
    });
}

// Экспорт функций
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initPromptTab, initSystemPromptTab, initToolsTab };
}
