// State Management
let snippets = [];
let currentSnippetId = null;

// DOM Elements
const elements = {
    newSnippetBtn: document.getElementById('newSnippetBtn'),
    snippetsList: document.getElementById('snippetsList'),
    emptyState: document.getElementById('emptyState'),
    editorPlaceholder: document.getElementById('editorPlaceholder'),
    editorContainer: document.getElementById('editorContainer'),
    snippetTitle: document.getElementById('snippetTitle'),
    languageSelect: document.getElementById('languageSelect'),
    codeEditor: document.getElementById('codeEditor'),
    saveBtn: document.getElementById('saveBtn'),
    copyBtn: document.getElementById('copyBtn'),
    deleteBtn: document.getElementById('deleteBtn'),
    searchInput: document.getElementById('searchInput'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

// Initialize App
function init() {
    loadSnippets();
    renderSnippetsList();
    attachEventListeners();
}

// Load snippets from localStorage
function loadSnippets() {
    const stored = localStorage.getItem('codeSnippets');
    if (stored) {
        try {
            snippets = JSON.parse(stored);
        } catch (e) {
            snippets = [];
            console.error('Error loading snippets:', e);
        }
    }
}

function saveToLocalStorage() {
    localStorage.setItem('codeSnippets', JSON.stringify(snippets));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Render snippets list
function renderSnippetsList(filter = '') {
    const filteredSnippets = snippets.filter(snippet => 
        snippet.title.toLowerCase().includes(filter.toLowerCase()) ||
        snippet.language.toLowerCase().includes(filter.toLowerCase()) ||
        snippet.code.toLowerCase().includes(filter.toLowerCase())
    );

    if (filteredSnippets.length === 0) {
        elements.snippetsList.innerHTML = '';
        elements.emptyState.classList.remove('hidden');
    } else {
        elements.emptyState.classList.add('hidden');
        elements.snippetsList.innerHTML = filteredSnippets.map(snippet => `
            <div class="snippet-item ${snippet.id === currentSnippetId ? 'active' : ''}" data-id="${snippet.id}">
                <div class="snippet-item-title">${escapeHtml(snippet.title) || 'Untitled Snippet'}</div>
                <div class="snippet-item-meta">
                    <span class="snippet-item-language">${snippet.language}</span>
                    <span>${formatDate(snippet.updatedAt)}</span>
                </div>
            </div>
        `).join('');

        // Attach click handlers
        document.querySelectorAll('.snippet-item').forEach(item => {
            item.onclick = () => loadSnippet(item.getAttribute('data-id'));
        });
    }
}

function createNewSnippet() {
    const newSnippet = {
        id: generateId(),
        title: '',
        language: 'javascript',
        code: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    snippets.unshift(newSnippet);
    saveToLocalStorage();
    loadSnippet(newSnippet.id);
    showToast('New snippet created');
}

function loadSnippet(id) {
    const snippet = snippets.find(s => s.id === id);
    if (!snippet) return;

    currentSnippetId = id;
    
    elements.snippetTitle.value = snippet.title;
    elements.languageSelect.value = snippet.language;
    elements.codeEditor.value = snippet.code;

    elements.editorPlaceholder.style.display = 'none';
    elements.editorContainer.style.display = 'flex';

    renderSnippetsList(elements.searchInput.value);
}

function saveCurrentSnippet() {
    if (!currentSnippetId) return;

    const index = snippets.findIndex(s => s.id === currentSnippetId);
    if (index === -1) return;

    snippets[index].title = elements.snippetTitle.value.trim();
    snippets[index].language = elements.languageSelect.value;
    snippets[index].code = elements.codeEditor.value;
    snippets[index].updatedAt = new Date().toISOString();

    saveToLocalStorage();
    renderSnippetsList(elements.searchInput.value);
}

function deleteCurrentSnippet() {
    if (!currentSnippetId) return;

    if (confirm(`Are you sure you want to delete this snippet?`)) {
        snippets = snippets.filter(s => s.id !== currentSnippetId);
        saveToLocalStorage();
        
        currentSnippetId = null;
        elements.editorContainer.style.display = 'none';
        elements.editorPlaceholder.style.display = 'flex';
        
        renderSnippetsList(elements.searchInput.value);
        showToast('Snippet deleted');
    }
}

async function copyToClipboard() {
    const code = elements.codeEditor.value;
    if (!code) return showToast('Nothing to copy');

    try {
        await navigator.clipboard.writeText(code);
        showToast('Code copied to clipboard!', 'success');
    } catch (err) {
        showToast('Failed to copy code');
    }
}

function showToast(message, type = '') {
    elements.toastMessage.textContent = message;
    elements.toast.className = 'toast show';
    if (type === 'success') elements.toast.classList.add('success');
    setTimeout(() => elements.toast.classList.remove('show'), 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const diffMs = new Date() - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

let autoSaveTimeout;
function scheduleAutoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        if (currentSnippetId) saveCurrentSnippet();
    }, 800);
}

function attachEventListeners() {
    elements.newSnippetBtn.addEventListener('click', createNewSnippet);
    elements.saveBtn.addEventListener('click', () => {
        saveCurrentSnippet();
        showToast('Saved manually', 'success');
    });
    elements.deleteBtn.addEventListener('click', deleteCurrentSnippet);
    elements.copyBtn.addEventListener('click', copyToClipboard);
    elements.searchInput.addEventListener('input', (e) => renderSnippetsList(e.target.value));
    
    elements.snippetTitle.addEventListener('input', scheduleAutoSave);
    elements.languageSelect.addEventListener('change', scheduleAutoSave);
    elements.codeEditor.addEventListener('input', scheduleAutoSave);

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveCurrentSnippet();
            showToast('Saved', 'success');
        }
    });
}

// Start App
window.addEventListener('DOMContentLoaded', init);