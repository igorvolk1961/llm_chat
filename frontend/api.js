/** API клиент для работы с backend */

const API_BASE_URL = 'http://localhost:8080';

class ApiClient {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        // Показываем индикатор загрузки
        this.showLoading();
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const error = await response.json();
                    errorMessage = error.detail || error.message || errorMessage;
                } catch (e) {
                    // Если не удалось распарсить JSON, используем текст ответа
                    const text = await response.text().catch(() => '');
                    errorMessage = text || errorMessage;
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            this.hideLoading();
            return data;
        } catch (error) {
            this.hideLoading();
            console.error('API request failed:', error);
            
            // Показываем уведомление об ошибке
            this.showError(error.message);
            throw error;
        }
    }
    
    showLoading() {
        // Создаем индикатор загрузки, если его еще нет
        if (!document.getElementById('loadingIndicator')) {
            const loader = document.createElement('div');
            loader.id = 'loadingIndicator';
            loader.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: #007acc;
                color: white;
                padding: 12px 20px;
                border-radius: 4px;
                z-index: 10000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            `;
            loader.textContent = 'Загрузка...';
            document.body.appendChild(loader);
        }
    }
    
    hideLoading() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.remove();
        }
    }
    
    showError(message) {
        // Показываем диалоговое окно с ошибкой
        if (typeof showErrorDialog === 'function') {
            showErrorDialog(message);
        } else {
            // Fallback на старое уведомление, если функция еще не загружена
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: #f48771;
                color: white;
                padding: 12px 20px;
                border-radius: 4px;
                z-index: 10001;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                max-width: 400px;
            `;
            notification.textContent = `Ошибка: ${message}`;
            document.body.appendChild(notification);
            
            // Удаляем через 5 секунд
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    }
    
    showSuccess(message) {
        // Создаем уведомление об успехе
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #4ec9b0;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10001;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            max-width: 400px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Промпты
    async listPrompts() {
        return this.request('/api/prompts');
    }
    
    async getPrompt(name) {
        return this.request(`/api/prompts/${encodeURIComponent(name)}`);
    }
    
    async savePrompt(name, content, extension = '.txt') {
        return this.request(`/api/prompts/${encodeURIComponent(name)}`, {
            method: 'POST',
            body: JSON.stringify({ content, extension })
        });
    }
    
    async deletePrompt(name) {
        return this.request(`/api/prompts/${encodeURIComponent(name)}`, {
            method: 'DELETE'
        });
    }
    
    // Контексты
    async listContexts() {
        return this.request('/api/contexts');
    }
    
    async getContext(name) {
        return this.request(`/api/contexts/${encodeURIComponent(name)}`);
    }
    
    async saveContext(name, messages) {
        return this.request(`/api/contexts/${encodeURIComponent(name)}`, {
            method: 'POST',
            body: JSON.stringify({ name, messages })
        });
    }
    
    async deleteContext(name) {
        return this.request(`/api/contexts/${encodeURIComponent(name)}`, {
            method: 'DELETE'
        });
    }
    
    async renameContext(oldName, newName) {
        return this.request(`/api/contexts/${encodeURIComponent(oldName)}/rename`, {
            method: 'POST',
            body: JSON.stringify({ new_name: newName })
        });
    }
    
    // Текущее состояние
    async getCurrentPrompt() {
        return this.request('/api/current/prompt');
    }
    
    async setCurrentPrompt(content) {
        return this.request('/api/current/prompt', {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    }
    
    async getCurrentSystemPrompt() {
        return this.request('/api/current/system-prompt');
    }
    
    async setCurrentSystemPrompt(content) {
        return this.request('/api/current/system-prompt', {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    }
    
    async getCurrentTools() {
        return this.request('/api/current/tools');
    }
    
    async setCurrentTools(tools) {
        return this.request('/api/current/tools', {
            method: 'POST',
            body: JSON.stringify({ tools })
        });
    }
    
    async getCurrentContext() {
        return this.request('/api/current/context');
    }
    
    async setCurrentContext(name, messages) {
        return this.request('/api/current/context', {
            method: 'POST',
            body: JSON.stringify({ name, messages })
        });
    }
    
    async clearCurrentContext() {
        return this.request('/api/current/context', {
            method: 'DELETE'
        });
    }
    
    async getCurrentContent() {
        return this.request('/api/current/content');
    }
    
    async getCurrentToolCall() {
        return this.request('/api/current/tool-call');
    }
    
    async getCurrentStats() {
        return this.request('/api/current/stats');
    }
    
    // OpenAI API
    async chatCompletions(request) {
        return this.request('/v1/chat/completions', {
            method: 'POST',
            body: JSON.stringify(request)
        });
    }
    
    // Конфигурация
    async getConfig() {
        return this.request('/api/config');
    }
    
    async saveConfig(configData) {
        return this.request('/api/config', {
            method: 'POST',
            body: JSON.stringify(configData)
        });
    }
    
    async getConfigRaw() {
        return this.request('/api/config/raw');
    }
    
    async saveConfigRaw(content) {
        return this.request('/api/config/raw', {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    }
    
    async updateSystemPromptPath(path) {
        return this.request('/api/config/system-prompt-path', {
            method: 'POST',
            body: JSON.stringify({ system_prompt_path: path })
        });
    }
}

// Глобальный экземпляр API клиента
const api = new ApiClient();

// Делаем доступным глобально через window для совместимости
if (typeof window !== 'undefined') {
    window.api = api;
}

