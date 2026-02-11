/**
 * FIRMS MANAGEMENT TABS
 * Handles tab switching and initialization for firms management UI
 */

export function initializeFirmsManagementTabs() {
    const tabs = {
        'tab-create-firm': 'content-create-firm',
        'tab-firms': 'content-firms',
        'tab-firms-management': 'content-firms-management',
        'tab-users': 'content-users',
        'tab-user-assignment': 'content-user-assignment'
    };

    Object.keys(tabs).forEach(tabId => {
        const tabBtn = document.getElementById(tabId);
        if (!tabBtn) return;

        tabBtn.addEventListener('click', () => {
            // Update tab styles
            Object.keys(tabs).forEach(id => {
                const tab = document.getElementById(id);
                const content = document.getElementById(tabs[id]);
                if (id === tabId) {
                    tab.classList.add('text-purple-700', 'border-b-2', 'border-purple-700');
                    tab.classList.remove('text-gray-500');
                    content.classList.remove('hidden');
                } else {
                    tab.classList.remove('text-purple-700', 'border-b-2', 'border-purple-700');
                    tab.classList.add('text-gray-500');
                    content.classList.add('hidden');
                }
            });

            // Load data when switching to tabs
            if (tabId === 'tab-firms') window.loadFirms?.();
            if (tabId === 'tab-firms-management') window.loadFirmsManagement?.();
            if (tabId === 'tab-users') window.loadPendingUsers?.();
            if (tabId === 'tab-user-assignment') window.loadUserAssignment?.();
        });
    });
}
