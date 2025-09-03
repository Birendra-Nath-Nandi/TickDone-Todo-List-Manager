const todoForm = document.querySelector('form');
const todoInput = document.getElementById('todo-input');
const todoListUL = document.getElementById('todo-list');
const API_URL = 'api/api.php';

let allTodos = [];

// --- API Communication Functions ---

async function fetchTodos() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        allTodos = await response.json();
        updateTodoList();
    } catch (error) {
        console.error('Failed to fetch todos:', error);
    }
}

async function addTodo() {
    const todoText = todoInput.value.trim();
    if (todoText.length > 0) {
        try {
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', text: todoText })
            });
            await fetchTodos();
            todoInput.value = "";
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    }
}

async function deleteTodoItem(todoId) {
    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id: todoId })
        });
        allTodos = allTodos.filter(todo => todo.id !== todoId);
        updateTodoList();
    } catch (error) {
        console.error('Error deleting todo:', error);
    }
}

async function updateTodoStatus(todoId, completed) {
    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_status', id: todoId, completed: completed })
        });

        // --- FIX STARTS HERE ---
        // Find the todo in the local array and update its completed status
        const todo = allTodos.find(t => t.id === todoId);
        if (todo) {
            todo.completed = completed;
        }
        // --- FIX ENDS HERE ---

    } catch (error) {
        console.error('Error updating todo status:', error);
    }
}

async function renameTodo(todoId, newText) {
    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'rename', id: todoId, text: newText })
        });
        const todo = allTodos.find(t => t.id === todoId);
        if (todo) todo.task = newText;
        updateTodoList();
    } catch (error) {
        console.error('Error renaming todo:', error);
    }
}

async function saveOrder() {
    const orderedIds = Array.from(todoListUL.children).map(li => parseInt(li.dataset.id));
    const newOrder = orderedIds.map(id => allTodos.find(todo => todo.id === id));
    allTodos = newOrder;

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reorder', order: orderedIds })
        });
    } catch (error) {
        console.error('Error saving order:', error);
    }
}


// --- DOM Manipulation (This part has no changes) ---

function updateTodoList() {
    todoListUL.innerHTML = "";
    allTodos.forEach((todo) => {
        const todoItem = createTodoItem(todo);
        todoListUL.append(todoItem);
    });
}

function createTodoItem(todo) {
    const todoId = "todo-" + todo.id;
    const todoLI = document.createElement("li");
    todoLI.className = "todo";
    todoLI.dataset.id = todo.id;
    todoLI.innerHTML = `
        <input type="checkbox" id="${todoId}">
        <label class="custom-checkbox" for="${todoId}">
            <svg fill="transparent" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
        </label>
        <label for="${todoId}" class="todo-text">
            ${todo.task}
        </label>
        <button class="icon-button edit-button">
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-528q12-12 27-18t31-6q16 0 31 6t26 18l57 57q12 11 18 26t6 31q0 16-6 31t-18 27L290-120H120Zm640-640-57-57 57 57ZM200-200Zm360-360Z"/></svg>
        </button>
        <button class="icon-button delete-button">
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
        </button>
    `;

    const deleteButton = todoLI.querySelector(".delete-button");
    deleteButton.addEventListener("click", () => deleteTodoItem(todo.id));
    const checkbox = todoLI.querySelector("input");
    checkbox.checked = todo.completed;
    checkbox.addEventListener("change", () => updateTodoStatus(todo.id, checkbox.checked));
    const editButton = todoLI.querySelector(".edit-button");
    editButton.addEventListener("click", () => {
        const todoTextLabel = todoLI.querySelector(".todo-text");
        const oldText = todoTextLabel.innerText;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = oldText;
        input.className = 'edit-input';
        todoTextLabel.replaceWith(input);
        input.focus();
        const save = () => {
            const newText = input.value.trim();
            if (newText && newText !== oldText) {
                renameTodo(todo.id, newText);
            } else {
                input.replaceWith(todoTextLabel);
            }
            editButton.style.display = 'flex';
        };
        editButton.style.display = 'none';
        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') {
                input.replaceWith(todoTextLabel);
                editButton.style.display = 'flex';
            }
        });
    });
    return todoLI;
}

// --- Initial Setup ---
todoForm.addEventListener('submit', function (e) {
    e.preventDefault();
    addTodo();
});
document.addEventListener('DOMContentLoaded', async () => {
    await fetchTodos();
    new Sortable(todoListUL, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: () => {
            saveOrder();
        }
    });
});