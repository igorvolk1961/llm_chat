/** Функциональность работы с ответами на инструменты (верхняя панель) */

// Вкладка Ответы на инструменты
function initToolResponsesTab() {
    const container = document.getElementById('toolResponsesContainer');
    
    // Обновление tool responses (доступно глобально)
    window.updateToolResponses = async function() {
        try {
            const data = await api.getCurrentToolCall();
            const toolCalls = data.tool_calls || [];
            
            if (toolCalls.length === 0) {
                container.innerHTML = '<p style="color: #858585;">Нет активных запросов инструментов</p>';
                return;
            }
            
            // Создаем гармошку для каждого tool_call с формой для ввода ответа
            const accordion = document.createElement('div');
            accordion.className = 'accordion';
            accordion.id = 'toolResponsesAccordion';
            
            toolCalls.forEach((toolCall, index) => {
                const item = createToolResponseElement(toolCall, index);
                accordion.appendChild(item);
            });
            
            container.innerHTML = '';
            container.appendChild(accordion);
        } catch (error) {
            console.error('Failed to load tool responses:', error);
            container.innerHTML = '<p style="color: #f48771;">Ошибка загрузки запросов инструментов</p>';
        }
    };
    
    // Функция для автоматического раскрытия первого шаблона ответа и фокуса на textarea
    window.expandFirstToolResponse = function() {
        const accordion = document.getElementById('toolResponsesAccordion');
        if (!accordion) return;
        
        const firstItem = accordion.querySelector('.accordion-item:first-child');
        if (!firstItem) return;
        
        // Раскрываем первый элемент
        if (!firstItem.classList.contains('active')) {
            firstItem.classList.add('active');
            const toggle = firstItem.querySelector('.accordion-toggle');
            if (toggle) {
                toggle.textContent = '▲';
            }
        }
        
        // Фокусируемся на textarea для ввода результата
        setTimeout(() => {
            const textarea = firstItem.querySelector('.tool-message-content');
            if (textarea) {
                textarea.focus();
                // Прокручиваем к элементу для лучшей видимости
                textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 50);
    };
    
    // Создание элемента tool_call с формой для ввода ответа
    function createToolResponseElement(toolCall, index) {
        const item = document.createElement('div');
        item.className = 'accordion-item';
        item.dataset.index = index;
        
        const header = document.createElement('div');
        header.className = 'accordion-header';
        header.innerHTML = `
            <span>[${toolCall.id}] ${toolCall.function?.name || 'unknown'}</span>
            <span class="accordion-toggle">▼</span>
        `;
        
        const content = document.createElement('div');
        content.className = 'accordion-content';
        
        // Информация о tool_call (только чтение)
        const infoSection = document.createElement('div');
        infoSection.style.marginBottom = '16px';
        infoSection.style.padding = '12px';
        infoSection.style.backgroundColor = '#1e1e1e';
        infoSection.style.borderRadius = '4px';
        infoSection.innerHTML = `
            <div style="margin-bottom: 8px;">
                <strong style="color: #007acc;">ID:</strong>
                <span style="color: #d4d4d4; font-family: 'Consolas', 'Monaco', monospace;">${toolCall.id}</span>
            </div>
            <div style="margin-bottom: 8px;">
                <strong style="color: #007acc;">Функция:</strong>
                <span style="color: #d4d4d4;">${toolCall.function?.name || 'N/A'}</span>
            </div>
            <div>
                <strong style="color: #007acc;">Аргументы:</strong>
                <pre style="margin-top: 4px; padding: 8px; background-color: #252526; border-radius: 4px; overflow-x: auto;"><code style="color: #d4d4d4; font-family: 'Consolas', 'Monaco', monospace;">${JSON.stringify(JSON.parse(toolCall.function?.arguments || '{}'), null, 2)}</code></pre>
            </div>
        `;
        
        // Форма для создания tool message
        const formSection = document.createElement('div');
        formSection.innerHTML = `
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; color: #cccccc;">Tool Call ID (предзаполнено):</label>
                <input type="text" class="tool-message-id" value="${toolCall.id}" readonly style="width: 100%; padding: 8px; background-color: #2d2d30; border: 1px solid #3e3e42; color: #858585; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; color: #cccccc;">Name (предзаполнено):</label>
                <input type="text" class="tool-message-name" value="${toolCall.function?.name || ''}" readonly style="width: 100%; padding: 8px; background-color: #2d2d30; border: 1px solid #3e3e42; color: #858585; border-radius: 4px;">
            </div>
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; color: #cccccc;">Content (результат выполнения):</label>
                <textarea class="tool-message-content" placeholder='Введите результат выполнения функции (обычно JSON строка)' style="width: 100%; min-height: 120px; padding: 8px; background-color: #1e1e1e; border: 1px solid #3e3e42; color: #d4d4d4; border-radius: 4px; font-family: 'Consolas', 'Monaco', monospace; resize: vertical;"></textarea>
            </div>
            <button class="btn btn-primary add-tool-message-btn" style="width: 100%;">Добавить tool message в контекст</button>
        `;
        
        // Обработчик кнопки добавления
        const addBtn = formSection.querySelector('.add-tool-message-btn');
        addBtn.addEventListener('click', async () => {
            const toolCallId = formSection.querySelector('.tool-message-id').value;
            const name = formSection.querySelector('.tool-message-name').value;
            const content = formSection.querySelector('.tool-message-content').value.trim();
            
            if (!content) {
                api.showError('Заполните поле Content');
                return;
            }
            
            // Добавляем tool message в контекст
            try {
                // Получаем текущий контекст
                const currentContext = await api.getCurrentContext();
                const messages = currentContext.messages || [];
                
                // Создаем tool message
                const toolMessage = {
                    role: 'tool',
                    tool_call_id: toolCallId,
                    name: name,
                    content: content
                };
                
                // Добавляем в контекст
                messages.push(toolMessage);
                
                // Сохраняем контекст
                await api.setCurrentContext(currentContext.name || '', messages);
                
                api.showSuccess('Tool message добавлен в контекст');
                
                // Очищаем поле content
                formSection.querySelector('.tool-message-content').value = '';
                
                // Обновляем вкладку контекста без перезагрузки страницы
                if (typeof window.reloadContext === 'function') {
                    await window.reloadContext();
                }
                
                // Обновляем вкладку ответов на инструменты (удаляем обработанный tool_call)
                await window.updateToolResponses();
            } catch (error) {
                // Ошибка уже показана в API клиенте
            }
        });
        
        content.appendChild(infoSection);
        content.appendChild(formSection);
        
        // Обработчик клика на заголовок
        header.addEventListener('click', () => {
            item.classList.toggle('active');
            const toggle = header.querySelector('.accordion-toggle');
            toggle.textContent = item.classList.contains('active') ? '▲' : '▼';
        });
        
        item.appendChild(header);
        item.appendChild(content);
        
        return item;
    }
    
    // Инициализация - показываем пустое состояние
    container.innerHTML = '<p style="color: #858585;">Нет активных запросов инструментов</p>';
}

// Экспорт функций
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initToolResponsesTab };
}

