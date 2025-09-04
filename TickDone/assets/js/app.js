document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let state = {
        todos: [],
        lists: [],
        currentView: { type: 'view', id: 'today' },
        selectedTaskId: null,
    };

    // --- DOM SELECTORS ---
    const viewTitle = document.getElementById('view-title');
    const taskCountBadge = document.getElementById('task-count-badge');
    const todoListUL = document.getElementById('todo-list');
    const listsContainer = document.getElementById('lists-container');
    const mainNavLinks = document.getElementById('main-nav-links');
    const addTaskToggleBtn = document.getElementById('add-task-toggle-btn');
    const addTaskFormLi = document.getElementById('add-task-form-li');
    const todoInput = document.getElementById('todo-input');
    // REMOVED: const dueDateInput = document.getElementById('due-date-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn');
    
    // Details Panel Selectors
    const detailsPanel = document.getElementById('task-details-panel');
    const closePanelBtn = document.getElementById('close-panel-btn');
    const detailsTaskName = document.getElementById('details-task-name');
    const detailsTaskDesc = document.getElementById('details-task-desc');
    const detailsListSelect = document.getElementById('details-list-select');
    const dueDateSelect = document.getElementById('due-date-select');
    const detailsDueDate = document.getElementById('details-due-date');
    const saveChangesBtn = document.getElementById('save-changes-btn');
    const deleteTaskBtn = document.getElementById('delete-task-btn');

    // Add List Modal Selectors
    const addListModal = document.getElementById('add-list-modal');
    const newListNameInput = document.getElementById('new-list-name-input');
    const saveNewListBtn = document.getElementById('save-new-list-btn');
    const cancelNewListBtn = document.getElementById('cancel-new-list-btn');
    const addListBtn = document.getElementById('add-list-btn');

    // --- API HELPER ---
    const api = {
        async getInitialData() {
            const r = await fetch('api/api.php?resource=initial_data');
            if (!r.ok) throw new Error('Could not load application data.');
            return r.json();
        },
        async getTodoDetails(id) {
            const r = await fetch(`api/api.php?resource=todos&id=${id}`);
            return r.json();
        },
        async addTask(text, list_id, due_date) {
            const r = await fetch('api/api.php?resource=todos', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', text, list_id, due_date, description: '' })
            });
            return r.json();
        },
        async addList(name) {
            const r = await fetch('api/api.php?resource=lists', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', name })
            });
            return r.json();
        },
        async deleteList(id) {
            await fetch('api/api.php?resource=lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id })
            });
        },
        async updateStatus(id, completed) {
            await fetch('api/api.php?resource=todos', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_status', id, completed })
            });
        },
        async updateDetails(details) {
            await fetch('api/api.php?resource=todos', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_details', ...details })
            });
        },
        async deleteTask(id) {
             await fetch('api/api.php?resource=todos', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id })
            });
        },
        async saveOrder(order) {
            await fetch('api/api.php?resource=todos', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reorder', order })
            });
        }
    };

    // --- RENDER FUNCTIONS ---
    function render() {
        renderSidebarLists();
        renderMainContent();
        updateSidebarCounts();
    }

    function renderSidebarLists() {
        listsContainer.innerHTML = '';
        state.lists.forEach(list => {
            const li = document.createElement('li');
            li.innerHTML = `
                <a href="#" class="nav-link" data-view-type="list" data-view-id="${list.id}">
                    <span class="list-color-dot"></span>
                    <span class="nav-text">${list.name}</span>
                    <span class="nav-count">0</span>
                </a>
                <button class="delete-list-btn" data-list-id="${list.id}" title="Delete List">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px">
                        <path d="M0 0h24v24H0V0z" fill="none"/>
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5z"/>
                    </svg>
                </button>
            `;
            listsContainer.appendChild(li);
        });
        updateActiveNav();
    }
    
    function renderMainContent() {
        let currentTasks = [];
        let title = '';

        if (state.currentView.type === 'view') {
            title = state.currentView.id.charAt(0).toUpperCase() + state.currentView.id.slice(1);
            const today = new Date().toISOString().split('T')[0];
            if (state.currentView.id === 'today') {
                currentTasks = state.todos.filter(t => t.due_date === today);
            } else if (state.currentView.id === 'upcoming') {
                currentTasks = state.todos.filter(t => t.due_date && t.due_date > today);
            }
        } else { 
            const list = state.lists.find(l => l.id == state.currentView.id);
            if (list) {
                title = list.name;
                currentTasks = state.todos.filter(t => t.list_id == state.currentView.id);
            } else {
                handleViewChange('view', 'today');
                return;
            }
        }

        viewTitle.textContent = title;
        taskCountBadge.textContent = currentTasks.filter(t => !t.completed).length;
        
        todoListUL.querySelectorAll('.todo').forEach(item => item.remove());

        currentTasks.forEach(todo => {
            todoListUL.insertBefore(createTodoItem(todo), addTaskToggleBtn.parentElement);
        });
    }

    function createTodoItem(todo) {
        const li = document.createElement('li');
        li.className = 'todo';
        li.dataset.id = todo.id;
        if (state.selectedTaskId == todo.id) li.classList.add('selected');
        const todoId = `todo-${todo.id}`;
        li.innerHTML = `
            <input type="checkbox" id="${todoId}" ${todo.completed ? 'checked' : ''}>
            <div class="todo-content">
                <label class="custom-checkbox" for="${todoId}">
                    <svg fill="transparent" viewBox="0 -960 960 960"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
                </label>
                <span class="todo-text">${todo.task}</span>
                ${todo.due_date ? `<span class="due-date-text">${new Date(todo.due_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>` : ''}
            </div>
            <svg class="task-chevron" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="m321-80-57-57 240-240-240-240 57-57 297 297L321-80Z"/></svg>
        `;
        li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => handleUpdateStatus(e, todo.id));
        li.addEventListener('click', () => handleSelectTask(todo.id));
        return li;
    }
    
    function updateSidebarCounts() {
        const today = new Date().toISOString().split('T')[0];
        const todayCount = state.todos.filter(t => t.due_date === today && !t.completed).length;
        const upcomingCount = state.todos.filter(t => t.due_date && t.due_date > today && !t.completed).length;
        
        mainNavLinks.querySelector('[data-view-id="today"] .nav-count').textContent = todayCount;
        mainNavLinks.querySelector('[data-view-id="upcoming"] .nav-count').textContent = upcomingCount;

        state.lists.forEach(list => {
            const listCount = state.todos.filter(t => t.list_id == list.id && !t.completed).length;
            const listLink = listsContainer.querySelector(`.nav-link[data-view-id="${list.id}"] .nav-count`);
            if (listLink) listLink.textContent = listCount;
        });
    }

    function updateActiveNav() {
        document.querySelectorAll('.sidebar-nav .nav-link.active').forEach(link => link.classList.remove('active'));
        const { type, id } = state.currentView;
        const activeLink = document.querySelector(`.nav-link[data-view-type="${type}"][data-view-id="${id}"]`);
        if (activeLink) activeLink.classList.add('active');
    }

    // --- MODAL, PANEL & FORM LOGIC ---
    function openAddListModal() {
        newListNameInput.value = '';
        addListModal.classList.add('visible');
        newListNameInput.focus();
    }

    function closeAddListModal() {
        addListModal.classList.remove('visible');
    }

    function closeDetailsPanel() {
        if(state.selectedTaskId !== null) {
            state.selectedTaskId = null;
            detailsPanel.classList.remove('visible');
            renderMainContent();
        }
    }

    function resetAddTaskForm() {
        todoInput.value = '';
        // REMOVED: dueDateInput.value = '';
        addTaskFormLi.style.display = 'none';
        addTaskToggleBtn.parentElement.style.display = 'list-item';
    }

    function getFormattedDate(offset = 0) {
        const date = new Date();
        date.setDate(date.getDate() + offset);
        return date.toISOString().split('T')[0];
    }

    // --- EVENT HANDLERS ---
    function handleViewChange(type, id) {
        state.currentView = { type, id: String(id) };
        updateActiveNav();
        renderMainContent();
        closeDetailsPanel();
    }
    
    async function handleUpdateStatus(event, todoId) {
        event.stopPropagation();
        const todoToUpdate = state.todos.find(t => t.id == todoId);
        if(todoToUpdate) todoToUpdate.completed = event.target.checked;
        await api.updateStatus(todoId, event.target.checked);
        updateSidebarCounts();
        renderMainContent();
    }

    async function handleSelectTask(id) {
        state.selectedTaskId = id;
        try {
            const taskData = await api.getTodoDetails(id);
            detailsTaskName.value = taskData.task;
            detailsTaskDesc.value = taskData.description || '';
            
            const today = getFormattedDate(0);
            const tomorrow = getFormattedDate(1);

            if (!taskData.due_date) {
                dueDateSelect.value = 'no_date';
                detailsDueDate.style.display = 'none';
            } else if (taskData.due_date === today) {
                dueDateSelect.value = 'today';
                detailsDueDate.style.display = 'none';
            } else if (taskData.due_date === tomorrow) {
                dueDateSelect.value = 'tomorrow';
                detailsDueDate.style.display = 'none';
            } else {
                dueDateSelect.value = 'choose';
                detailsDueDate.style.display = 'block';
                detailsDueDate.value = taskData.due_date;
            }

            detailsListSelect.innerHTML = '';
            state.lists.forEach(list => {
                const option = new Option(list.name, list.id);
                if (list.id == taskData.list_id) option.selected = true;
                detailsListSelect.appendChild(option);
            });
            detailsPanel.classList.add('visible');
            renderMainContent();
        } catch (error) {
            console.error(error);
            state.selectedTaskId = null;
        }
    }
    
    async function handleSaveChanges() {
        const id = state.selectedTaskId;
        let dueDate = null;
        if (dueDateSelect.value === 'today') dueDate = getFormattedDate(0);
        else if (dueDateSelect.value === 'tomorrow') dueDate = getFormattedDate(1);
        else if (dueDateSelect.value === 'choose') dueDate = detailsDueDate.value || null;

        const updatedData = {
            id,
            task: detailsTaskName.value.trim(),
            description: detailsTaskDesc.value.trim(),
            list_id: detailsListSelect.value,
            due_date: dueDate
        };

        await api.updateDetails(updatedData);
        const todoIndex = state.todos.findIndex(t => t.id == id);
        if (todoIndex > -1) state.todos[todoIndex] = { ...state.todos[todoIndex], ...updatedData };
        closeDetailsPanel();
        render();
    }

    async function handleDeleteTask() {
        if (!confirm('Are you sure you want to delete this task?')) return;
        const id = state.selectedTaskId;
        await api.deleteTask(id);
        state.todos = state.todos.filter(t => t.id != id);
        closeDetailsPanel();
        render();
    }
    
    async function handleAddTask() {
        const text = todoInput.value.trim();
        // REMOVED: const dueDate = dueDateInput.value;
        if (!text) return;
        let listId = (state.currentView.type === 'list') ? state.currentView.id : (state.lists[0]?.id || null);
        if (!listId) { alert('Please create a list first to add tasks.'); return; }
        const newTask = await api.addTask(text, listId, null); // MODIFIED: Pass null for due_date
        state.todos.push(newTask);
        resetAddTaskForm();
        render();
    }

    async function handleAddList() {
        const name = newListNameInput.value.trim();
        if (!name) return;
        try {
            const newList = await api.addList(name);
            state.lists.push(newList);
            closeAddListModal();
            render();
            handleViewChange('list', newList.id);
        } catch (error) {
            console.error('Failed to add list:', error);
            alert('Could not add list. Please try again.');
        }
    }

    async function handleDeleteList(listId) {
        const list = state.lists.find(l => l.id == listId);
        if (!list) return;
        if (confirm(`Are you sure you want to delete the "${list.name}" list?\nTasks in this list will become uncategorized.`)) {
            try {
                await api.deleteList(listId);
                if (state.currentView.type === 'list' && state.currentView.id == listId) {
                    state.currentView = { type: 'view', id: 'today' };
                }
                await reloadData();
            } catch (error) {
                console.error("Failed to delete list:", error);
                alert("Could not delete the list. Please try again.");
            }
        }
    }

    async function reloadData() {
        try {
            const data = await api.getInitialData();
            state.lists = data.lists || [];
            state.todos = data.todos || [];
            render();
        } catch (error) {
            console.error("Failed to reload data:", error);
            document.body.innerHTML = `<div class="loading-error">${error.message}. Please try again later.</div>`;
        }
    }
    
    // --- INITIALIZATION ---
    async function init() {
        document.querySelector('.sidebar-nav').addEventListener('click', (e) => {
            const link = e.target.closest('.nav-link');
            const deleteBtn = e.target.closest('.delete-list-btn');
            if (link && link.dataset.viewId) {
                e.preventDefault();
                handleViewChange(link.dataset.viewType, link.dataset.viewId);
            } else if (deleteBtn && deleteBtn.dataset.listId) {
                e.preventDefault();
                handleDeleteList(deleteBtn.dataset.listId);
            }
        });

        addTaskToggleBtn.addEventListener('click', () => {
            addTaskFormLi.style.display = 'block';
            addTaskToggleBtn.parentElement.style.display = 'none';
            todoInput.focus();
        });
        addTaskBtn.addEventListener('click', handleAddTask);
        cancelAddTaskBtn.addEventListener('click', resetAddTaskForm);
        todoInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAddTask(); });
        
        addListBtn.addEventListener('click', openAddListModal);
        cancelNewListBtn.addEventListener('click', closeAddListModal);
        saveNewListBtn.addEventListener('click', handleAddList);
        addListModal.addEventListener('click', (e) => {
            if (e.target === addListModal) closeAddListModal();
        });
        newListNameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAddList(); });
        
        closePanelBtn.addEventListener('click', closeDetailsPanel);
        saveChangesBtn.addEventListener('click', handleSaveChanges);
        deleteTaskBtn.addEventListener('click', handleDeleteTask);

        dueDateSelect.addEventListener('change', () => {
            detailsDueDate.style.display = (dueDateSelect.value === 'choose') ? 'block' : 'none';
            if (dueDateSelect.value === 'choose') detailsDueDate.focus();
        });
        
        new Sortable(todoListUL, {
            animation: 150,
            filter: '.add-task-toggle, .add-task-form-container',
            onEnd: async (evt) => {
                const orderedIds = Array.from(evt.target.querySelectorAll('.todo')).map(li => parseInt(li.dataset.id));
                await api.saveOrder(orderedIds);
                await reloadData();
            }
        });

        await reloadData();
    }

    init().catch(error => {
        console.error("Initialization failed:", error);
        document.body.innerHTML = `<div class="loading-error">${error.message}. Please try again later.</div>`;
    });
});