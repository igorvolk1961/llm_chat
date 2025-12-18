/** Функциональность работы с контекстом */

let messages = [];
let currentContextName = '';

// Делаем messages доступным глобально для getContextMessages
window.messages = messages;

// Создание элемента message в гармошке
function createMessageElement(message, index) {
    const item = document.createElement('div');
    item.className = 'accordion-item';
    item.dataset.index = index;
    
    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.innerHTML = `
        <span class="accordion-title">Message ${index + 1}: ${message.role || 'user'}</span>
        <div class="accordion-actions">
            <button class="icon-btn fullscreen-btn" title="Открыть Content на полный экран" data-index="${index}">⛶</button>
            <button class="icon-btn delete-btn" title="Удалить message" data-index="${index}">✕</button>
            <span class="accordion-toggle">▼</span>
        </div>
    `;
    
    const content = document.createElement('div');
    content.className = 'accordion-content';
    
    // Role - редактируемое только для вручную добавленных сообщений
    const roleGroup = document.createElement('div');
    roleGroup.style.marginBottom = '12px';
    
    // Проверяем, можно ли редактировать role (по умолчанию false для сообщений из чата)
    const canEditRole = message.editableRole === true;
    
    if (canEditRole) {
        // Редактируемое поле для вручную добавленных сообщений
        roleGroup.innerHTML = `
            <label style="display: block; margin-bottom: 4px; color: #cccccc;">Role:</label>
            <select class="message-role" style="width: 100%; padding: 8px; background-color: #1e1e1e; border: 1px solid #3e3e42; color: #d4d4d4; border-radius: 4px;">
                <option value="system" ${message.role === 'system' ? 'selected' : ''}>system</option>
                <option value="user" ${message.role === 'user' ? 'selected' : ''}>user</option>
                <option value="assistant" ${message.role === 'assistant' ? 'selected' : ''}>assistant</option>
                <option value="tool" ${message.role === 'tool' ? 'selected' : ''}>tool</option>
            </select>
        `;
    } else {
        // Только для чтения для сообщений из чата
        roleGroup.innerHTML = `
            <label style="display: block; margin-bottom: 4px; color: #cccccc;">Role:</label>
            <div style="width: 100%; padding: 8px; background-color: #2d2d30; border: 1px solid #3e3e42; color: #cccccc; border-radius: 4px; user-select: none;">${message.role || 'user'}</div>
        `;
    }
    
    // Content textarea
    const contentGroup = document.createElement('div');
    contentGroup.style.marginBottom = '12px';
    contentGroup.innerHTML = `
        <label style="display: block; margin-bottom: 4px; color: #cccccc;">Content:</label>
        <textarea class="message-content" style="width: 100%; min-height: 100px; padding: 8px; background-color: #1e1e1e; border: 1px solid #3e3e42; color: #d4d4d4; border-radius: 4px; font-family: 'Consolas', 'Monaco', monospace; resize: vertical;">${message.content || ''}</textarea>
    `;
    
    // Name input (для function/tool messages) - добавляем только если не пустое
    if (message.name) {
        const nameGroup = document.createElement('div');
        nameGroup.style.marginBottom = '12px';
        nameGroup.innerHTML = `
            <label style="display: block; margin-bottom: 4px; color: #cccccc;">Name (опционально):</label>
            <input type="text" class="message-name" value="${message.name}" style="width: 100%; padding: 8px; background-color: #1e1e1e; border: 1px solid #3e3e42; color: #d4d4d4; border-radius: 4px;">
        `;
        nameGroup.querySelector('.message-name').addEventListener('input', (e) => {
            message.name = e.target.value.trim() || null;
            // Если поле очищено, удаляем его из DOM
            if (!message.name) {
                nameGroup.remove();
            }
        });
        content.appendChild(nameGroup);
    }
    
    // Tool calls (для assistant messages) - добавляем только если не пустое
    if (message.tool_calls && Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
        const toolCallsGroup = document.createElement('div');
        toolCallsGroup.style.marginBottom = '12px';
        toolCallsGroup.innerHTML = `
            <label style="display: block; margin-bottom: 4px; color: #cccccc;">Tool Calls (опционально, JSON):</label>
            <textarea class="message-tool-calls" style="width: 100%; min-height: 80px; padding: 8px; background-color: #1e1e1e; border: 1px solid #3e3e42; color: #d4d4d4; border-radius: 4px; font-family: 'Consolas', 'Monaco', monospace; resize: vertical;">${JSON.stringify(message.tool_calls, null, 2)}</textarea>
        `;
        toolCallsGroup.querySelector('.message-tool-calls').addEventListener('input', (e) => {
            try {
                const value = e.target.value.trim();
                message.tool_calls = value ? JSON.parse(value) : null;
                e.target.style.borderColor = '#3e3e42';
                // Если поле очищено, удаляем его из DOM
                if (!message.tool_calls) {
                    toolCallsGroup.remove();
                }
            } catch (error) {
                e.target.style.borderColor = '#f48771';
            }
        });
        content.appendChild(toolCallsGroup);
    }
    
    // Tool call ID (для tool messages) - добавляем только если не пустое
    if (message.tool_call_id) {
        const toolCallIdGroup = document.createElement('div');
        toolCallIdGroup.style.marginBottom = '12px';
        toolCallIdGroup.innerHTML = `
            <label style="display: block; margin-bottom: 4px; color: #cccccc;">Tool Call ID (для tool messages):</label>
            <input type="text" class="message-tool-call-id" value="${message.tool_call_id}" style="width: 100%; padding: 8px; background-color: #1e1e1e; border: 1px solid #3e3e42; color: #d4d4d4; border-radius: 4px;">
        `;
        toolCallIdGroup.querySelector('.message-tool-call-id').addEventListener('input', (e) => {
            message.tool_call_id = e.target.value.trim() || null;
            // Если поле очищено, удаляем его из DOM
            if (!message.tool_call_id) {
                toolCallIdGroup.remove();
            }
        });
        content.appendChild(toolCallIdGroup);
    }
    
    content.appendChild(roleGroup);
    content.appendChild(contentGroup);
    // Опциональные поля добавляются выше только если не пустые
    
    // Обработчик клика на заголовок (но не на кнопки)
    header.addEventListener('click', (e) => {
        // Не переключаем, если клик был на кнопку
        if (e.target.classList.contains('icon-btn') || e.target.closest('.icon-btn')) {
            return;
        }
        item.classList.toggle('active');
        const toggle = header.querySelector('.accordion-toggle');
        toggle.textContent = item.classList.contains('active') ? '▲' : '▼';
    });
    
    // Обработчик кнопки удаления
    const deleteBtn = header.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Предотвращаем переключение accordion
        showConfirm('Удалить этот message?', () => {
            messages.splice(index, 1);
            window.messages = messages;
            renderMessages();
            
            // Обновляем состояние полей системного промпта
            const isContextEmpty = messages.length === 0;
            if (typeof window.updateSystemPromptFieldsState === 'function') {
                window.updateSystemPromptFieldsState(isContextEmpty);
            }
        });
    });
    
    // Обработчик кнопки полноэкранного просмотра
    const fullscreenBtn = header.querySelector('.fullscreen-btn');
    fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Предотвращаем переключение accordion
        showFullscreenContent(message.content || '');
    });
    
    // Обработчики изменений (только если role редактируемое)
    if (canEditRole) {
        const roleSelect = content.querySelector('.message-role');
        if (roleSelect) {
            roleSelect.addEventListener('change', () => {
                message.role = roleSelect.value;
                updateMessageHeader(item, message);
            });
        }
    }
    
    const contentTextarea = content.querySelector('.message-content');
    if (contentTextarea) {
        contentTextarea.addEventListener('input', (e) => {
            message.content = e.target.value || null;
        });
    }
    
    item.appendChild(header);
    item.appendChild(content);
    
    return item;
}

function updateMessageHeader(item, message) {
    const title = item.querySelector('.accordion-title');
    if (title) {
        title.textContent = `Message ${parseInt(item.dataset.index) + 1}: ${message.role || 'user'}`;
    }
}

// Функция для полноэкранного просмотра content
function showFullscreenContent(content) {
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'fullscreen-modal';
    modal.innerHTML = `
        <div class="fullscreen-content">
            <div class="fullscreen-header">
                <span>Content</span>
                <button class="icon-btn close-fullscreen-btn" title="Закрыть">✕</button>
            </div>
            <div class="fullscreen-body">
                <pre class="fullscreen-text">${escapeHtml(content)}</pre>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчик закрытия
    const closeBtn = modal.querySelector('.close-fullscreen-btn');
    const closeModal = () => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
        document.removeEventListener('keydown', escapeHandler);
    };
    
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Закрытие по Escape
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// Функция для экранирования HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Рендеринг всех messages
function renderMessages() {
    const accordion = document.getElementById('contextAccordion');
    accordion.innerHTML = '';
    
    // Обновляем глобальную ссылку на messages
    window.messages = messages;
    
    messages.forEach((message, index) => {
        const element = createMessageElement(message, index);
        accordion.appendChild(element);
    });
    
    // Прокручиваем к последнему сообщению
    scrollToLastMessage();
}

// Функция для прокрутки к последнему сообщению
function scrollToLastMessage() {
    const accordion = document.getElementById('contextAccordion');
    if (!accordion || accordion.children.length === 0) return;
    
    const lastItem = accordion.lastElementChild;
    if (lastItem) {
        // Используем requestAnimationFrame для гарантии, что DOM обновлен
        requestAnimationFrame(() => {
            lastItem.scrollIntoView({ behavior: 'smooth', block: 'end' });
        });
    }
}

// Инициализация вкладки Контекст
async function initContextTab() {
    const contextPathDisplay = document.getElementById('contextPathDisplay');
    const saveContextBtn = document.getElementById('saveContextBtn');
    const loadContextBtn = document.getElementById('loadContextBtn');
    const clearContextBtn = document.getElementById('clearContextBtn');
    const addMessageBtn = document.getElementById('addMessageBtn');
    const contextFileInput = document.getElementById('contextFileInput');
    
    // Функция для обновления отображения пути
    async function updatePathDisplay() {
        try {
            const config = await api.getConfig();
            const contextsDir = config.contexts_dir || 'contexts';
            
            let path;
            if (currentContextName && currentContextName.trim()) {
                // Если есть имя контекста - показываем путь к сохраненному файлу
                path = `${contextsDir}/${currentContextName}.json`;
            } else if (messages.length > 0) {
                // Если контекст не пустой, но имя не задано - показываем путь к current_context.json
                path = `${contextsDir}/current_context.json`;
            } else {
                // Если контекст пустой - показываем "новый_контекст"
                path = 'новый_контекст';
            }
            
            if (contextPathDisplay) {
                contextPathDisplay.textContent = `Путь: ${path}`;
            }
        } catch (error) {
            if (contextPathDisplay) {
                // В случае ошибки определяем путь по состоянию
                if (messages.length > 0) {
                    contextPathDisplay.textContent = 'Путь: contexts/current_context.json';
                } else {
                    contextPathDisplay.textContent = 'Путь: новый_контекст';
                }
            }
        }
    }
    
    // Функция для сбора данных messages из DOM
    function collectMessagesData() {
        return messages.map((msg, index) => {
            const item = document.querySelector(`.accordion-item[data-index="${index}"]`);
            if (!item) {
                // Если элемента нет в DOM, возвращаем исходное сообщение без служебных полей
                const { editableRole, ...cleanMsg } = msg;
                return cleanMsg;
            }
            
            const content = item.querySelector('.accordion-content');
            const nameInput = content.querySelector('.message-name');
            const toolCallsTextarea = content.querySelector('.message-tool-calls');
            const toolCallIdInput = content.querySelector('.message-tool-call-id');
            
            // Получаем role - либо из select (если редактируемое), либо из исходного сообщения
            let role = msg.role;
            const roleSelect = content.querySelector('.message-role');
            if (roleSelect) {
                role = roleSelect.value;
            }
            
            const result = {
                role: role,
                content: content.querySelector('.message-content').value || null
            };
            
            // Добавляем опциональные поля только если они есть в DOM
            if (nameInput) {
                result.name = nameInput.value.trim() || null;
            }
            
            if (toolCallsTextarea) {
                try {
                    const value = toolCallsTextarea.value.trim();
                    result.tool_calls = value ? JSON.parse(value) : null;
                } catch {
                    result.tool_calls = null;
                }
            }
            
            if (toolCallIdInput) {
                result.tool_call_id = toolCallIdInput.value.trim() || null;
            }
            
            return result;
        });
    }
    
    // Функция для чтения файла
    function readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Ошибка чтения файла'));
            reader.readAsText(file, 'utf-8');
        });
    }
    
    // Сохранение контекста
    saveContextBtn.addEventListener('click', async () => {
        const messagesData = collectMessagesData();
        
        if (messagesData.length === 0) {
            api.showError('Контекст не может быть пустым');
            return;
        }
        
        showPrompt('Введите имя контекста:', currentContextName || '', async (name) => {
            if (!name) return;
            
            try {
                await api.saveContext(name, messagesData);
                currentContextName = name;
                await updatePathDisplay();
                api.showSuccess('Контекст сохранен');
            } catch (error) {
                // Ошибка уже показана в API клиенте
            }
        });
    });
    
    // Загрузка контекста из файла
    loadContextBtn.addEventListener('click', () => {
        contextFileInput.click();
    });
    
    // Обработчик выбора файла
    contextFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const content = await readFileContent(file);
            const contextData = JSON.parse(content);
            
            if (!contextData.messages || !Array.isArray(contextData.messages)) {
                api.showError('Неверный формат файла контекста');
                return;
            }
            
            // Загружаем messages и помечаем их как нередактируемые (из чата)
            messages = contextData.messages.map(msg => ({
                ...msg,
                editableRole: false
            }));
            window.messages = messages;
            
            // Определяем имя файла (без расширения)
            const fileName = file.name;
            const lastDotIndex = fileName.lastIndexOf('.');
            const fileNameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
            
            // Используем имя из файла или из данных контекста
            currentContextName = contextData.name || fileNameWithoutExt;
            
            renderMessages();
            await updatePathDisplay();
            
            // Обновляем состояние полей системного промпта
            const isContextEmpty = messages.length === 0;
            if (typeof window.updateSystemPromptFieldsState === 'function') {
                window.updateSystemPromptFieldsState(isContextEmpty);
            }
            
            api.showSuccess('Контекст загружен из файла');
        } catch (error) {
            if (error instanceof SyntaxError) {
                api.showError('Ошибка парсинга JSON: ' + error.message);
            } else {
                api.showError('Ошибка чтения файла: ' + error.message);
            }
        }
        
        // Сброс input для возможности повторного выбора того же файла
        contextFileInput.value = '';
    });
    
    // Очистка контекста
    clearContextBtn.addEventListener('click', () => {
        showConfirm('Очистить контекст?', async () => {
            try {
                // Проверяем наличие метода
                if (!api || typeof api.clearCurrentContext !== 'function') {
                    api.showError('Метод clearCurrentContext не доступен. Пожалуйста, обновите страницу (F5).');
                    return;
                }
                
                // Очищаем файл текущего контекста на сервере
                await api.clearCurrentContext();
                
                // Очищаем локальные переменные
                messages = [];
                currentContextName = '';
                window.messages = messages;
                renderMessages();
                await updatePathDisplay();
                
                // Включаем поля системного промпта после очистки контекста
                if (typeof window.updateSystemPromptFieldsState === 'function') {
                    window.updateSystemPromptFieldsState(true);
                }
                
                api.showSuccess('Контекст очищен');
            } catch (error) {
                console.error('Ошибка при очистке контекста:', error);
                api.showError('Ошибка при очистке контекста: ' + (error.message || 'Неизвестная ошибка'));
            }
        });
    });
    
    // Добавление message
    addMessageBtn.addEventListener('click', () => {
        messages.push({
            role: 'user',
            content: '',
            editableRole: true  // Помечаем как редактируемое (вручную добавленное)
        });
        window.messages = messages;
        renderMessages();
        
        // Отключаем поля системного промпта после добавления сообщения
        if (typeof window.updateSystemPromptFieldsState === 'function') {
            window.updateSystemPromptFieldsState(false);
        }
        
        // Раскрываем последний элемент
        const lastItem = document.querySelector('.accordion-item:last-child');
        if (lastItem) {
            lastItem.classList.add('active');
            lastItem.querySelector('.accordion-toggle').textContent = '▲';
        }
    });
    
    // Функция для перезагрузки контекста (доступна глобально)
    window.reloadContext = async function() {
        try {
            const currentContext = await api.getCurrentContext();
            if (currentContext && currentContext.messages && Array.isArray(currentContext.messages)) {
                // Помечаем все сообщения как нередактируемые (из чата)
                messages = currentContext.messages.map(msg => ({
                    ...msg,
                    editableRole: false
                }));
                currentContextName = currentContext.name || '';
                // Обновляем глобальную ссылку на messages
                window.messages = messages;
                renderMessages();
                await updatePathDisplay();
                
                // Обновляем состояние полей системного промпта
                const isContextEmpty = messages.length === 0;
                if (typeof window.updateSystemPromptFieldsState === 'function') {
                    window.updateSystemPromptFieldsState(isContextEmpty);
                }
            } else {
                // Если контекст пустой, очищаем
                messages = [];
                currentContextName = '';
                window.messages = messages;
                renderMessages();
                await updatePathDisplay();
                
                // Включаем поля системного промпта при пустом контексте
                if (typeof window.updateSystemPromptFieldsState === 'function') {
                    window.updateSystemPromptFieldsState(true);
                }
            }
        } catch (error) {
            console.error('Failed to reload context:', error);
            // В случае ошибки тоже очищаем локально
            messages = [];
            currentContextName = '';
            window.messages = messages;
            renderMessages();
            await updatePathDisplay();
            
            // Включаем поля системного промпта при ошибке
            if (typeof window.updateSystemPromptFieldsState === 'function') {
                window.updateSystemPromptFieldsState(true);
            }
        }
    };
    
    // Инициализация отображения пути
    await updatePathDisplay();
    
    // Загружаем текущий контекст при открытии вкладки
    await window.reloadContext();
}

// Экспорт функций
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initContextTab };
}

