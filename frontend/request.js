/** Функциональность отправки запросов к LLM */

// Отправка запроса к LLM
async function sendRequest() {
    const sendBtn = document.getElementById('sendRequestBtn');
    const originalText = sendBtn.textContent;
    
    try {
        sendBtn.disabled = true;
        sendBtn.textContent = 'Отправка...';
        
        // Собираем данные из всех вкладок верхней панели
        const prompt = document.getElementById('promptInput').value.trim();
        const systemPrompt = document.getElementById('systemPromptInput').value.trim();
        const toolsText = document.getElementById('toolsInput').value.trim();
        
        // Парсим tools
        let tools = null;
        if (toolsText) {
            try {
                tools = JSON.parse(toolsText);
            } catch (error) {
                alert('Ошибка парсинга tools JSON: ' + error.message);
                return;
            }
        }
        
        // Собираем контекст (messages)
        const messages = [];
        
        // Получаем текущий контекст
        const currentContext = await api.getCurrentContext();
        const contextMessages = await getContextMessages();
        
        // Проверяем, есть ли системный промпт в контексте
        const hasSystemMessage = contextMessages.some(msg => msg.role === 'system');
        
        // Если системного промпта нет в контексте и он указан - добавляем его в контекст
        if (systemPrompt && !hasSystemMessage) {
            const systemMessage = {
                role: 'system',
                content: systemPrompt
            };
            
            // Добавляем системный промпт в контекст для сохранения
            const updatedMessages = [systemMessage, ...contextMessages];
            await api.setCurrentContext(currentContext.name || '', updatedMessages);
            
            // Обновляем вкладку Контекст
            if (typeof window.reloadContext === 'function') {
                await window.reloadContext();
            }
            
            // Получаем обновленные messages из контекста
            const updatedContextMessages = await getContextMessages();
            messages.push(...updatedContextMessages);
        } else {
            // Используем существующие messages из контекста
            messages.push(...contextMessages);
        }
        
        // Добавляем промпт пользователя, если есть
        let userPromptMessage = null;
        if (prompt) {
            userPromptMessage = {
                role: 'user',
                content: prompt
            };
            messages.push(userPromptMessage);
            
            // Сохраняем промпт пользователя в контекст ПЕРЕД отправкой запроса
            // Используем массив messages, который уже содержит системный промпт и промпт пользователя
            const currentContextForSave = await api.getCurrentContext();
            await api.setCurrentContext(currentContextForSave.name || '', messages);
        }
        
        // Формируем запрос
        // model не указываем - будет использоваться из конфигурации на backend
        const request = {
            messages: messages
        };
        
        if (tools) {
            request.tools = tools;
        }
        
        // Отправляем запрос
        const response = await api.chatCompletions(request);
        
        // Обрабатываем ответ
        if (response.choices && response.choices[0] && response.choices[0].message) {
            const message = response.choices[0].message;
            
            // Добавляем ответ модели в контекст
            // Используем массив messages, который уже содержит все предыдущие сообщения
            messages.push(message);
            const currentContext = await api.getCurrentContext();
            await api.setCurrentContext(currentContext.name || '', messages);
            
            // Очищаем поле промпта после успешной отправки
            const promptInput = document.getElementById('promptInput');
            if (promptInput) {
                promptInput.value = '';
            }
            
            // Обновляем вкладку Контекст
            if (typeof window.reloadContext === 'function') {
                await window.reloadContext();
            }
            
            // Обновляем нижнюю панель ТОЛЬКО если есть соответствующие данные в ответе
            // Content обновляем только если есть content в ответе (не только tool_calls)
            if (message.content && typeof window.updateContent === 'function') {
                await window.updateContent();
            } else if (!message.content && typeof window.updateContent === 'function') {
                // Если content нет, очищаем отображение
                const contentOutput = document.getElementById('contentOutput');
                if (contentOutput) {
                    contentOutput.innerHTML = '<p style="color: #858585;">Нет данных</p>';
                }
            }
            
            // Tool calls обновляем только если есть tool_calls
            if (message.tool_calls && message.tool_calls.length > 0 && typeof window.updateToolCalls === 'function') {
                await window.updateToolCalls();
            } else if ((!message.tool_calls || message.tool_calls.length === 0) && typeof window.updateToolCalls === 'function') {
                // Если tool_calls нет, очищаем отображение
                const toolCallOutput = document.getElementById('toolCallOutput');
                if (toolCallOutput) {
                    toolCallOutput.innerHTML = '<p style="color: #858585;">Инструменты не использованы</p>';
                }
            }
            
            // Метаданные обновляем всегда (они есть в любом ответе)
            if (typeof window.updateMetadata === 'function') {
                await window.updateMetadata();
            }
            
            // Обновляем верхнюю панель - вкладку ответов на инструменты
            if (typeof window.updateToolResponses === 'function') {
                await window.updateToolResponses();
                
                // Если есть tool_calls, переключаемся на вкладку "Ответы на инструменты" и раскрываем первый шаблон
                if (message.tool_calls && message.tool_calls.length > 0) {
                    // Переключаемся на вкладку "Ответы на инструменты"
                    if (typeof switchTopTab === 'function') {
                        switchTopTab('tool-responses');
                    }
                    
                    // Раскрываем первый шаблон ответа и фокусируемся на textarea
                    setTimeout(() => {
                        if (typeof window.expandFirstToolResponse === 'function') {
                            window.expandFirstToolResponse();
                        }
                    }, 100); // Небольшая задержка для завершения рендеринга
                }
            }
        }
        
        api.showSuccess('Запрос выполнен успешно');
        
    } catch (error) {
        console.error('Request failed:', error);
        // Ошибка уже показана в API клиенте
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = originalText;
    }
}

// Получение messages из контекста
async function getContextMessages() {
    try {
        const context = await api.getCurrentContext();
        if (!context || !context.messages) {
            return [];
        }
        
        // Собираем данные из всех messages в гармошке
        const messages = [];
        const accordion = document.getElementById('contextAccordion');
        
        if (accordion && accordion.children.length > 0) {
            // Если гармошка загружена и есть элементы, собираем из DOM
            const items = accordion.querySelectorAll('.accordion-item');
            // Получаем исходные данные из глобального массива messages для правильного role
            const sourceMessages = window.messages || context.messages || [];
            
            items.forEach((item, index) => {
                const content = item.querySelector('.accordion-content');
                if (!content) return;
                
                // Получаем role - либо из select (если редактируемое), либо из исходного сообщения
                const roleSelect = content.querySelector('.message-role');
                let role;
                if (roleSelect) {
                    // Редактируемое сообщение - берем из select
                    role = roleSelect.value;
                } else {
                    // Нередактируемое сообщение - берем из исходных данных
                    if (sourceMessages[index]) {
                        role = sourceMessages[index].role;
                    } else {
                        // Fallback - пытаемся получить из заголовка
                        const header = item.querySelector('.accordion-title');
                        if (header) {
                            const match = header.textContent.match(/Message \d+: (\w+)/);
                            role = match ? match[1] : 'user';
                        } else {
                            role = 'user';
                        }
                    }
                }
                
                const messageContent = content.querySelector('.message-content')?.value;
                const name = content.querySelector('.message-name')?.value;
                const toolCallsText = content.querySelector('.message-tool-calls')?.value;
                const toolCallId = content.querySelector('.message-tool-call-id')?.value;
                
                const message = {
                    role: role || 'user'
                };
                
                if (messageContent) {
                    message.content = messageContent;
                }
                
                if (name) {
                    message.name = name;
                }
                
                if (toolCallsText) {
                    try {
                        message.tool_calls = JSON.parse(toolCallsText);
                    } catch (e) {
                        console.warn('Failed to parse tool_calls:', e);
                    }
                }
                
                if (toolCallId) {
                    message.tool_call_id = toolCallId;
                }
                
                messages.push(message);
            });
        } else {
            // Если гармошка не загружена, используем данные из API
            return context.messages || [];
        }
        
        return messages;
    } catch (error) {
        console.error('Failed to get context messages:', error);
        return [];
    }
}

// Простой markdown рендеринг (дублируется из output.js)
function renderMarkdown(text) {
    if (!text) return '<p style="color: #858585;">Нет данных</p>';
    
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code style="background-color: #1e1e1e; padding: 2px 4px; border-radius: 3px;">$1</code>');
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code style="display: block; background-color: #1e1e1e; padding: 12px; border-radius: 4px; overflow-x: auto;">${code.trim()}</code></pre>`;
    });
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #4ec9b0;">$1</a>');
    html = html.replace(/\n/g, '<br>');
    
    return html;
}

// Инициализация кнопки отправки
function initSendButton() {
    const sendBtn = document.getElementById('sendRequestBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendRequest);
    }
}

// Экспорт функций
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sendRequest, initSendButton };
}

