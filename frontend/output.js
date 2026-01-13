/** Функциональность работы с выходными данными */

// Вкладка Ответ модели (content)
function initContentTab() {
    const contentOutput = document.getElementById('contentOutput');
    
    // Обновление content (доступно глобально)
    window.updateContent = async function() {
        try {
            const data = await api.getCurrentContent();
            const content = data.content || '';
            
            if (!content) {
                contentOutput.innerHTML = '<p style="color: #666666;">Нет данных</p>';
                return;
            }
            
            // Простой markdown рендеринг (можно заменить на библиотеку)
            contentOutput.innerHTML = renderMarkdown(content);
        } catch (error) {
            console.error('Failed to load content:', error);
            contentOutput.innerHTML = '<p style="color: #f48771;">Ошибка загрузки content</p>';
        }
    };
    
    // Инициализация - показываем пустое состояние
    contentOutput.innerHTML = '<p style="color: #666666;">Нет данных</p>';
    
    // Простой markdown рендеринг
    function renderMarkdown(text) {
        if (!text) return '<p style="color: #666666;">Нет данных</p>';
        
        // Экранирование HTML
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Заголовки
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Жирный текст
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Курсив
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Код inline
        html = html.replace(/`([^`]+)`/g, '<code style="background-color: #f0f0f0; padding: 2px 4px; border-radius: 3px; color: #333333;">$1</code>');
        
        // Блоки кода
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code style="display: block; background-color: #f8f8f8; border: 1px solid #e0e0e0; padding: 12px; border-radius: 4px; overflow-x: auto; color: #333333;">${code.trim()}</code></pre>`;
        });
        
        // Ссылки
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #4ec9b0;">$1</a>');
        
        // Переносы строк
        html = html.replace(/\n/g, '<br>');
        
        return html;
    }
    
}

// Вкладка Ответ модели (tool_call)
function initToolCallTab() {
    const toolCallOutput = document.getElementById('toolCallOutput');
    
    // Обновление tool_calls (доступно глобально)
    window.updateToolCalls = async function() {
        try {
            const data = await api.getCurrentToolCall();
            const toolCalls = data.tool_calls || [];
            
            if (toolCalls.length === 0) {
                toolCallOutput.innerHTML = '<p style="color: #666666;">Инструменты не использованы</p>';
                return;
            }
            
            // Создаем гармошку для каждого tool_call
            const accordion = document.createElement('div');
            accordion.className = 'accordion';
            accordion.id = 'toolCallsAccordion';
            
            toolCalls.forEach((toolCall, index) => {
                const item = createToolCallElement(toolCall, index);
                accordion.appendChild(item);
            });
            
            toolCallOutput.innerHTML = '';
            toolCallOutput.appendChild(accordion);
        } catch (error) {
            console.error('Failed to load tool calls:', error);
            toolCallOutput.innerHTML = '<p style="color: #f48771;">Ошибка загрузки tool_calls</p>';
        }
    }
    
    // Создание элемента tool_call в гармошке (только для отображения, без форм ввода)
    function createToolCallElement(toolCall, index) {
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
        infoSection.style.padding = '12px';
        infoSection.style.backgroundColor = '#f8f8f8';
        infoSection.style.borderRadius = '4px';
        infoSection.innerHTML = `
            <div style="margin-bottom: 8px;">
                <strong style="color: #007acc;">ID:</strong>
                <span style="color: #333333; font-family: 'Consolas', 'Monaco', monospace;">${toolCall.id}</span>
            </div>
            <div style="margin-bottom: 8px;">
                <strong style="color: #007acc;">Функция:</strong>
                <span style="color: #333333;">${toolCall.function?.name || 'N/A'}</span>
            </div>
            <div>
                <strong style="color: #007acc;">Аргументы:</strong>
                <pre style="margin-top: 4px; padding: 8px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 4px; overflow-x: auto;"><code style="color: #333333; font-family: 'Consolas', 'Monaco', monospace;">${JSON.stringify(JSON.parse(toolCall.function?.arguments || '{}'), null, 2)}</code></pre>
            </div>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
                <p style="color: #666666; font-size: 0.9em;">
                    💡 Для ввода ответа на этот запрос инструмента перейдите на вкладку <strong>"Ответы на инструменты"</strong> в верхней панели
                </p>
            </div>
        `;
        
        content.appendChild(infoSection);
        
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
    toolCallOutput.innerHTML = '<p style="color: #666666;">Нет данных</p>';
}

// Вкладка Метаданные
function initMetadataTab() {
    const metadataOutput = document.getElementById('metadataOutput');
    
    // Обновление метаданных (доступно глобально)
    window.updateMetadata = async function() {
        try {
            const stats = await api.getCurrentStats();
            
            if (!stats || Object.keys(stats).length === 0) {
                metadataOutput.innerHTML = '<p style="color: #666666;">Нет данных</p>';
                return;
            }
            
            // Форматируем метаданные
            const html = `
                <div class="metadata-item">
                    <span class="metadata-label">Временная метка:</span>
                    <span class="metadata-value">${stats.timestamp || 'N/A'}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Задержка (latency):</span>
                    <span class="metadata-value">${(stats.latency || 0).toFixed(3)} сек</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Время до первого токена:</span>
                    <span class="metadata-value">${(stats.time_to_first_token || 0).toFixed(3)} сек</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Общее время:</span>
                    <span class="metadata-value">${(stats.total_time || 0).toFixed(3)} сек</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Токены ответа:</span>
                    <span class="metadata-value">${stats.response_tokens || 0}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Слова ответа:</span>
                    <span class="metadata-value">${stats.response_words || 0}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Символы ответа:</span>
                    <span class="metadata-value">${stats.response_characters || 0}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Средняя длина токена:</span>
                    <span class="metadata-value">${(stats.avg_token_length || 0).toFixed(2)} символов</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Средняя длина слова:</span>
                    <span class="metadata-value">${(stats.avg_word_tokens || 0).toFixed(2)} токенов</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Токены контекста:</span>
                    <span class="metadata-value">${stats.context_tokens || 0}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Скорость инференса:</span>
                    <span class="metadata-value">${(stats.inference_speed || 0).toFixed(2)} токенов/сек</span>
                </div>
            `;
            
            metadataOutput.innerHTML = html;
        } catch (error) {
            console.error('Failed to load metadata:', error);
            metadataOutput.innerHTML = '<p style="color: #f48771;">Ошибка загрузки метаданных</p>';
        }
    }
    
    // Инициализация - показываем пустое состояние
    metadataOutput.innerHTML = '<p style="color: #666666;">Нет данных</p>';
}

// Экспорт функций
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initContentTab, initToolCallTab, initMetadataTab };
}

