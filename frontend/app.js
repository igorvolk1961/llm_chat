/** Базовый JavaScript для управления UI */

// Управление вкладками
function initTabs() {
    // Верхние вкладки
    const topTabs = document.querySelectorAll('#topTabs .tab-button');
    topTabs.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTopTab(tabName);
        });
    });
    
    // Нижние вкладки
    const bottomTabs = document.querySelectorAll('#bottomTabs .tab-button');
    bottomTabs.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchBottomTab(tabName);
        });
    });
}

function switchTopTab(tabName) {
    // Деактивируем все вкладки
    document.querySelectorAll('#topTabs .tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.top-panel .tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Активируем выбранную вкладку
    document.querySelector(`#topTabs .tab-button[data-tab="${tabName}"]`).classList.add('active');
    document.querySelector(`#tab-${tabName}`).classList.add('active');
}

// Делаем функцию доступной глобально
window.switchTopTab = switchTopTab;

function switchBottomTab(tabName) {
    // Деактивируем все вкладки
    document.querySelectorAll('#bottomTabs .tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.bottom-panel .tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Активируем выбранную вкладку
    document.querySelector(`#bottomTabs .tab-button[data-tab="${tabName}"]`).classList.add('active');
    document.querySelector(`#tab-${tabName}`).classList.add('active');
}

// Управление сплитером
function initSplitter() {
    const splitter = document.getElementById('splitter');
    const topPanel = document.getElementById('topPanel');
    const bottomPanel = document.getElementById('bottomPanel');
    
    if (!splitter || !topPanel || !bottomPanel) {
        console.error('Splitter elements not found');
        return;
    }
    
    let isResizing = false;
    let startY = 0;
    let startTopHeight = 0;
    
    // Устанавливаем начальную высоту верхней панели (50% экрана)
    const container = document.querySelector('.container');
    if (container && !topPanel.style.height) {
        const initialHeight = Math.floor(container.offsetHeight / 2);
        topPanel.style.height = `${initialHeight}px`;
        topPanel.style.flex = '0 0 auto';
        bottomPanel.style.flex = '1 1 auto';
    }
    
    splitter.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isResizing = true;
        startY = e.clientY;
        startTopHeight = topPanel.offsetHeight;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        e.preventDefault();
        const deltaY = e.clientY - startY;
        const newTopHeight = startTopHeight + deltaY;
        const containerHeight = container.offsetHeight;
        const splitterHeight = splitter.offsetHeight;
        const minHeight = 100;
        const maxHeight = containerHeight - splitterHeight - minHeight;
        
        if (newTopHeight >= minHeight && newTopHeight <= maxHeight) {
            topPanel.style.height = `${newTopHeight}px`;
            topPanel.style.flex = '0 0 auto';
            bottomPanel.style.flex = '1 1 auto';
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
    
    // Обработка изменения размера окна
    window.addEventListener('resize', () => {
        if (!isResizing && topPanel.style.height) {
            // При изменении размера окна сохраняем пропорции
            const containerHeight = container.offsetHeight;
            const currentTopHeight = parseInt(topPanel.style.height) || containerHeight / 2;
            const splitterHeight = splitter.offsetHeight;
            const maxHeight = containerHeight - splitterHeight - minHeight;
            
            if (currentTopHeight > maxHeight) {
                topPanel.style.height = `${maxHeight}px`;
            }
        }
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    initTabs();
    initSplitter();
    
    // Инициализация вкладок верхней панели
    await initPromptTab();
    await initSystemPromptTab();
    await initToolsTab();
    await initToolResponsesTab();
    await initContextTab();
    await initConfigTab();
    
    // Инициализация вкладок нижней панели
    initContentTab();
    initToolCallTab();
    initMetadataTab();
    
    // Инициализация кнопки отправки
    initSendButton();
    
    console.log('LLM Chat Debugger initialized');
});

