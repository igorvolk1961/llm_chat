/** Утилиты для уведомлений и подтверждений */

// Красивое подтверждение вместо стандартного confirm
function showConfirm(message, callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 10002;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background-color: #252526;
        border: 1px solid #3e3e42;
        border-radius: 4px;
        padding: 20px;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.cssText = `
        color: #d4d4d4;
        margin-bottom: 20px;
    `;
    
    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = `
        display: flex;
        gap: 8px;
        justify-content: flex-end;
    `;
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Отмена';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.addEventListener('click', () => {
        overlay.remove();
    });
    
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Подтвердить';
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.addEventListener('click', () => {
        overlay.remove();
        if (callback) callback();
    });
    
    buttonGroup.appendChild(cancelBtn);
    buttonGroup.appendChild(confirmBtn);
    dialog.appendChild(messageEl);
    dialog.appendChild(buttonGroup);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
}

// Красивый prompt вместо стандартного
function showPrompt(message, defaultValue = '', callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 10002;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background-color: #252526;
        border: 1px solid #3e3e42;
        border-radius: 4px;
        padding: 20px;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.cssText = `
        color: #d4d4d4;
        margin-bottom: 12px;
    `;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultValue;
    input.style.cssText = `
        width: 100%;
        padding: 8px;
        background-color: #1e1e1e;
        border: 1px solid #3e3e42;
        color: #d4d4d4;
        border-radius: 4px;
        margin-bottom: 20px;
    `;
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmBtn.click();
        }
    });
    
    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = `
        display: flex;
        gap: 8px;
        justify-content: flex-end;
    `;
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Отмена';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.addEventListener('click', () => {
        overlay.remove();
        if (callback) callback(null);
    });
    
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'OK';
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.addEventListener('click', () => {
        const value = input.value.trim();
        overlay.remove();
        if (callback) callback(value || null);
    });
    
    buttonGroup.appendChild(cancelBtn);
    buttonGroup.appendChild(confirmBtn);
    dialog.appendChild(messageEl);
    dialog.appendChild(input);
    dialog.appendChild(buttonGroup);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Фокус на input
    setTimeout(() => input.focus(), 100);
}

// Диалоговое окно для ошибок с возможностью копирования
function showErrorDialog(message) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 10003;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background-color: #252526;
        border: 1px solid #f48771;
        border-radius: 4px;
        padding: 20px;
        max-width: 600px;
        max-height: 80vh;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        flex-direction: column;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Ошибка';
    title.style.cssText = `
        color: #f48771;
        margin: 0 0 16px 0;
        font-size: 18px;
        font-weight: 600;
    `;
    
    const messageContainer = document.createElement('div');
    messageContainer.style.cssText = `
        background-color: #1e1e1e;
        border: 1px solid #3e3e42;
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 16px;
        max-height: 400px;
        overflow-y: auto;
        word-break: break-word;
    `;
    
    const messageText = document.createElement('pre');
    messageText.textContent = message;
    messageText.style.cssText = `
        color: #d4d4d4;
        margin: 0;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 13px;
        white-space: pre-wrap;
        word-wrap: break-word;
    `;
    
    messageContainer.appendChild(messageText);
    
    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = `
        display: flex;
        gap: 8px;
        justify-content: flex-end;
    `;
    
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Копировать';
    copyBtn.className = 'btn btn-secondary';
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(message);
            copyBtn.textContent = 'Скопировано!';
            copyBtn.style.backgroundColor = '#007acc';
            setTimeout(() => {
                copyBtn.textContent = 'Копировать';
                copyBtn.style.backgroundColor = '';
            }, 2000);
        } catch (error) {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = message;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                copyBtn.textContent = 'Скопировано!';
                copyBtn.style.backgroundColor = '#007acc';
                setTimeout(() => {
                    copyBtn.textContent = 'Копировать';
                    copyBtn.style.backgroundColor = '';
                }, 2000);
            } catch (err) {
                copyBtn.textContent = 'Ошибка копирования';
            }
            document.body.removeChild(textArea);
        }
    });
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Закрыть';
    closeBtn.className = 'btn btn-primary';
    closeBtn.addEventListener('click', () => {
        overlay.remove();
    });
    
    // Закрытие по клику на overlay
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
    
    // Закрытие по Escape
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    buttonGroup.appendChild(copyBtn);
    buttonGroup.appendChild(closeBtn);
    dialog.appendChild(title);
    dialog.appendChild(messageContainer);
    dialog.appendChild(buttonGroup);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Фокус на кнопке закрыть
    setTimeout(() => closeBtn.focus(), 100);
}

// Экспорт функций
if (typeof window !== 'undefined') {
    window.showConfirm = showConfirm;
    window.showPrompt = showPrompt;
    window.showErrorDialog = showErrorDialog;
}

