let activeModalContainer = null;

const createModal = ({ type, title, message, defaultValue = '', resolve }) => {
    // Clean up any existing active modal
    if (activeModalContainer) {
        if (activeModalContainer.parentNode) {
            document.body.removeChild(activeModalContainer);
        }
        activeModalContainer = null;
    }

    const container = document.createElement('div');
    container.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 opacity-0';
    activeModalContainer = container;

    // Detect dark mode from HTML/body classes
    const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');

    const modalBox = document.createElement('div');
    modalBox.className = `w-full max-w-md p-6 rounded-2xl border shadow-xl transform scale-95 opacity-0 transition-all duration-300 ${
        isDark 
            ? 'bg-gray-900 border-gray-800 text-white shadow-black/40' 
            : 'bg-white border-gray-200 text-gray-900 shadow-gray-200/50'
    }`;

    // Header
    const headerEl = document.createElement('div');
    headerEl.className = 'flex items-center gap-3 mb-4';

    // Icon Container
    const iconContainer = document.createElement('div');
    const isDanger = message.toLowerCase().includes('delete') || 
                     message.toLowerCase().includes('remove') || 
                     message.toLowerCase().includes('block') ||
                     message.toLowerCase().includes('cancel') ||
                     message.toLowerCase().includes('too large') ||
                     message.toLowerCase().includes('invalid');
    
    if (type === 'alert') {
        if (isDanger) {
            iconContainer.className = 'p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
            iconContainer.innerHTML = `<svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
        } else {
            iconContainer.className = 'p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            iconContainer.innerHTML = `<svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
        }
    } else if (isDanger) {
        iconContainer.className = 'p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
        iconContainer.innerHTML = `<svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
    } else {
        iconContainer.className = 'p-2 rounded-lg bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
        iconContainer.innerHTML = `<svg class="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    }

    const titleEl = document.createElement('h3');
    titleEl.className = 'text-lg font-bold';
    titleEl.innerText = title;

    headerEl.appendChild(iconContainer);
    headerEl.appendChild(titleEl);
    modalBox.appendChild(headerEl);

    // Message
    const messageEl = document.createElement('p');
    messageEl.className = `text-sm leading-relaxed mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`;
    messageEl.innerText = message;
    modalBox.appendChild(messageEl);

    // Input for prompt
    let inputEl = null;
    if (type === 'prompt') {
        inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.value = defaultValue;
        inputEl.className = `w-full px-4 py-2.5 mb-6 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition ${
            isDark 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
        }`;
        modalBox.appendChild(inputEl);
    }

    // Actions Footer
    const footerEl = document.createElement('div');
    footerEl.className = 'flex gap-3 justify-end';

    const cleanUp = () => {
        container.classList.remove('opacity-100');
        modalBox.classList.remove('scale-100', 'opacity-100');
        modalBox.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            if (container.parentNode) {
                document.body.removeChild(container);
            }
            if (activeModalContainer === container) {
                activeModalContainer = null;
            }
        }, 300);
    };

    if (type === 'confirm' || type === 'prompt') {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = `px-5 py-2.5 rounded-xl text-sm font-semibold transition duration-200 cursor-pointer ${
            isDark 
                ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
                : 'bg-gray-150 text-gray-700 hover:bg-gray-200'
        }`;
        cancelBtn.innerText = 'Cancel';
        cancelBtn.onclick = () => {
            cleanUp();
            resolve(type === 'confirm' ? false : null);
        };
        footerEl.appendChild(cancelBtn);
    }

    const confirmBtn = document.createElement('button');
    let btnColor = 'bg-blue-600 hover:bg-blue-700 text-white';
    if (isDanger) {
        btnColor = 'bg-red-600 hover:bg-red-700 text-white';
    } else if (type === 'confirm') {
        btnColor = 'bg-green-600 hover:bg-green-700 text-white';
    }
    confirmBtn.className = `px-5 py-2.5 rounded-xl text-sm font-semibold transition duration-200 cursor-pointer ${btnColor}`;
    confirmBtn.innerText = type === 'alert' ? 'OK' : (isDanger ? 'Confirm' : 'Continue');
    confirmBtn.onclick = () => {
        cleanUp();
        if (type === 'alert') resolve();
        else if (type === 'confirm') resolve(true);
        else resolve(inputEl ? inputEl.value : null);
    };
    footerEl.appendChild(confirmBtn);

    modalBox.appendChild(footerEl);
    container.appendChild(modalBox);
    document.body.appendChild(container);

    // Trigger animations
    requestAnimationFrame(() => {
        container.classList.add('opacity-100');
        modalBox.classList.add('scale-100', 'opacity-100');
    });

    // Auto-focus input for prompt or confirm button
    setTimeout(() => {
        if (inputEl) {
            inputEl.focus();
            inputEl.select();
            inputEl.onkeydown = (e) => {
                if (e.key === 'Enter') confirmBtn.click();
                if (e.key === 'Escape') {
                    cleanUp();
                    resolve(null);
                }
            };
        } else {
            confirmBtn.focus();
        }
    }, 50);
};

export const customAlert = (message, title = 'Notification') => {
    return new Promise((resolve) => createModal({ type: 'alert', title, message, resolve }));
};

export const customConfirm = (message, title = 'Are you sure?') => {
    return new Promise((resolve) => createModal({ type: 'confirm', title, message, resolve }));
};

export const customPrompt = (message, defaultValue = '', title = 'Action Required') => {
    return new Promise((resolve) => createModal({ type: 'prompt', title, message, defaultValue, resolve }));
};
