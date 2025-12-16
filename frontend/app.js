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
    let isResizing = false;
    let startY = 0;
    let startTopHeight = 0;
    
    splitter.addEventListener('mousedown', (e) => {
        isResizing = true;
        startY = e.clientY;
        startTopHeight = topPanel.offsetHeight;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const deltaY = e.clientY - startY;
        const newTopHeight = startTopHeight + deltaY;
        const containerHeight = document.querySelector('.container').offsetHeight;
        const minHeight = 100;
        
        if (newTopHeight >= minHeight && newTopHeight <= containerHeight - minHeight) {
            topPanel.style.height = `${newTopHeight}px`;
            bottomPanel.style.flex = '1';
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
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

