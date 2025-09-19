// Global variables
let groups = [];
let currentGroupId = new URLSearchParams(window.location.search).get('id');
let editingExpenseId = null;
let editingGroupId = null;
let deletingGroupId = null;

// Check localStorage availability (mobile browser compatibility)
function isLocalStorageAvailable() {
    try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        console.warn('localStorage not available:', e);
        return false;
    }
}

// Initialize groups with error handling
function initializeGroups() {
    if (isLocalStorageAvailable()) {
        try {
            groups = JSON.parse(localStorage.getItem('spliteasy_groups')) || [];
        } catch (error) {
            console.error('Error parsing groups from localStorage:', error);
            groups = [];
            localStorage.removeItem('spliteasy_groups'); // Clear corrupted data
        }
    } else {
        console.warn('localStorage not available, using memory storage');
        groups = [];
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    console.log('User Agent:', navigator.userAgent);
    console.log('localStorage available:', isLocalStorageAvailable());

    initializeGroups();
    console.log('Groups loaded:', groups.length);

    initializePage();
    setupEventListeners();
});

function initializePage() {
    loadSharedGroup(); // Load shared group if URL contains shared data

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('Current page:', currentPage);

    switch(currentPage) {
        case 'index.html':
            loadGroups();
            break;
        case 'group-detail.html':
            loadGroupDetail();
            break;
        default:
            loadGroups(); // Load groups for homepage
            break;
    }
}

// Enhanced shared group loading with compression support
function loadSharedGroup() {
    try {
        const urlParams = new URLSearchParams(window.location.search);

        // Check for compressed data first (new format)
        let sharedData = urlParams.get('c');
        let isCompressed = true;

        // Fallback to old uncompressed format
        if (!sharedData) {
            sharedData = urlParams.get('shared');
            isCompressed = false;
        }

        console.log('Shared data found:', !!sharedData);
        console.log('Is compressed:', isCompressed);

        if (sharedData && sharedData.trim()) {
            let decodedData;

            if (isCompressed) {
                // Decompress using LZ-String (requires library)
                if (typeof LZString !== 'undefined') {
                    decodedData = LZString.decompressFromEncodedURIComponent(sharedData);
                    console.log('Decompressed data successfully');
                } else {
                    console.error('LZString library not available for decompression');
                    alert('❌ Compression library not loaded. Please refresh the page.');
                    return;
                }
            } else {
                // Old format - direct decode
                decodedData = decodeURIComponent(sharedData);
                console.log('Using legacy uncompressed format');
            }

            if (!decodedData) {
                throw new Error('Failed to decompress data');
            }

            const sharedGroup = JSON.parse(decodedData);
            console.log('Successfully parsed group:', sharedGroup.name);

            // Check if group already exists
            const existingGroup = groups.find(g => g.id === sharedGroup.id);
            if (!existingGroup) {
                groups.push(sharedGroup);

                // Save if localStorage is available
                if (isLocalStorageAvailable()) {
                    localStorage.setItem('spliteasy_groups', JSON.stringify(groups));
                }

                // Refresh groups display
                if (document.getElementById('groupsList')) {
                    loadGroups();
                }

                // Show success message
                setTimeout(() => {
                    alert(`📁 Shared group "${sharedGroup.name}" has been added to your app! You can now view all expenses and settlements.`);
                }, 1000);
            } else {
                // Refresh groups display for existing groups too
                if (document.getElementById('groupsList')) {
                    loadGroups();
                }

                setTimeout(() => {
                    alert(`📁 Group "${sharedGroup.name}" already exists in your app.`);
                }, 1000);
            }

            // Clean URL after processing
            if (window.history.replaceState) {
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            }

        }
    } catch (error) {
        console.error('Error loading shared group:', error);
        alert('❌ Error loading shared group. The link may be corrupted or too large for mobile browsers.');

        // Clean URL even on error
        if (window.history.replaceState) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }
}

function setupEventListeners() {
    // Create Group buttons
    const createGroupBtn = document.getElementById('createGroupBtn');
    const createFirstGroupBtn = document.getElementById('createFirstGroupBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const addMemberBtn = document.getElementById('addMemberBtn');
    const createGroupForm = document.getElementById('createGroupForm');

    // Edit Group buttons
    const editGroupBtn = document.getElementById('editGroupBtn');
    const closeEditGroupModalBtn = document.getElementById('closeEditGroupModalBtn');
    const cancelEditGroupBtn = document.getElementById('cancelEditGroupBtn');
    const addEditMemberBtn = document.getElementById('addEditMemberBtn');
    const editGroupForm = document.getElementById('editGroupForm');

    // Add/Edit Expense buttons
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const closeExpenseModalBtn = document.getElementById('closeExpenseModalBtn');
    const cancelExpenseBtn = document.getElementById('cancelExpenseBtn');
    const deleteExpenseBtn = document.getElementById('deleteExpenseBtn');
    const addExpenseForm = document.getElementById('addExpenseForm');
    const backBtn = document.getElementById('backBtn');
    const shareBtn = document.getElementById('shareBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');

    // Group Actions Event Listeners
    const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const deleteGroupBtn = document.getElementById('deleteGroupBtn');

    // Create Group Event Listeners
    if (createGroupBtn) {
        createGroupBtn.addEventListener('click', showCreateGroupModal);
    }

    if (createFirstGroupBtn) {
        createFirstGroupBtn.addEventListener('click', showCreateGroupModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', addMember);
    }

    if (createGroupForm) {
        createGroupForm.addEventListener('submit', handleCreateGroup);
    }

    // Edit Group Event Listeners
    if (editGroupBtn) {
        editGroupBtn.addEventListener('click', showEditGroupModal);
    }

    if (closeEditGroupModalBtn) {
        closeEditGroupModalBtn.addEventListener('click', closeEditGroupModal);
    }

    if (cancelEditGroupBtn) {
        cancelEditGroupBtn.addEventListener('click', closeEditGroupModal);
    }

    if (addEditMemberBtn) {
        addEditMemberBtn.addEventListener('click', addEditMember);
    }

    if (editGroupForm) {
        editGroupForm.addEventListener('submit', handleEditGroup);
    }

    // Add/Edit Expense Event Listeners
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Add Expense button clicked');
            showAddExpenseModal();
        });
    }

    if (closeExpenseModalBtn) {
        closeExpenseModalBtn.addEventListener('click', closeAddExpenseModal);
    }

    if (cancelExpenseBtn) {
        cancelExpenseBtn.addEventListener('click', closeAddExpenseModal);
    }

    if (deleteExpenseBtn) {
        deleteExpenseBtn.addEventListener('click', handleDeleteExpense);
    }

    if (addExpenseForm) {
        addExpenseForm.addEventListener('submit', handleAddExpense);
    }

    // Back Button Event Listener
    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Back button clicked');
            window.location.href = 'index.html';
        });
    }

    // Share Button Event Listener with compression
    if (shareBtn) {
        shareBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Share button clicked');
            shareGroup();
        });
    }

    // Checkbox actions
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', selectAllMembers);
    }

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllMembers);
    }

    // Group Actions Event Listeners
    if (closeDeleteModalBtn) {
        closeDeleteModalBtn.addEventListener('click', closeDeleteConfirmModal);
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteConfirmModal);
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteGroup);
    }

    if (deleteGroupBtn) {
        deleteGroupBtn.addEventListener('click', handleDeleteFromEditModal);
    }

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const createGroupModal = document.getElementById('createGroupModal');
        const editGroupModal = document.getElementById('editGroupModal');
        const addExpenseModal = document.getElementById('addExpenseModal');
        const deleteConfirmModal = document.getElementById('deleteConfirmModal');

        if (event.target === createGroupModal) {
            closeModal();
        } else if (event.target === editGroupModal) {
            closeEditGroupModal();
        } else if (event.target === addExpenseModal) {
            closeAddExpenseModal();
        } else if (event.target === deleteConfirmModal) {
            closeDeleteConfirmModal();
        }
    });

    console.log('All event listeners set up');
}

// Create Group Modal functions
function showCreateGroupModal() {
    const modal = document.getElementById('createGroupModal');
    if (modal) {
        modal.style.display = 'block';
        const form = document.getElementById('createGroupForm');
        if (form) form.reset();
        const membersList = document.getElementById('membersList');
        if (membersList) {
            membersList.innerHTML = '<input type="text" class="member-input" placeholder="Member 1 name" required>';
        }
    }
}

function closeModal() {
    const modal = document.getElementById('createGroupModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Edit Group Modal functions
function showEditGroupModal() {
    const groupId = currentGroupId || editingGroupId;
    if (!groupId) return;

    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    editingGroupId = groupId;

    const modal = document.getElementById('editGroupModal');
    if (!modal) return;

    // Populate group name
    const editGroupName = document.getElementById('editGroupName');
    const editingGroupIdInput = document.getElementById('editingGroupId');

    if (editGroupName) editGroupName.value = group.name;
    if (editingGroupIdInput) editingGroupIdInput.value = groupId;

    // Populate members
    populateEditMembers(group.members);

    modal.style.display = 'block';
}

function closeEditGroupModal() {
    const modal = document.getElementById('editGroupModal');
    if (modal) {
        modal.style.display = 'none';
    }
    editingGroupId = null;
}

function populateEditMembers(members) {
    const editMembersList = document.getElementById('editMembersList');
    if (!editMembersList) return;

    editMembersList.innerHTML = '';

    members.forEach((member, index) => {
        const memberItem = document.createElement('div');
        memberItem.className = 'edit-member-item';
        memberItem.innerHTML = `
            <input type="text" class="edit-member-input" value="${member}" required>
            <button type="button" class="btn-remove-member" onclick="removeMember(this)" title="Remove member">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        `;
        editMembersList.appendChild(memberItem);
    });
}

function addEditMember() {
    const editMembersList = document.getElementById('editMembersList');
    if (!editMembersList) return;

    const memberCount = editMembersList.children.length + 1;

    const memberItem = document.createElement('div');
    memberItem.className = 'edit-member-item';
    memberItem.innerHTML = `
        <input type="text" class="edit-member-input" placeholder="Member ${memberCount} name" required>
        <button type="button" class="btn-remove-member" onclick="removeMember(this)" title="Remove member">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        </button>
    `;
    editMembersList.appendChild(memberItem);
}

function removeMember(button) {
    const memberItem = button.parentElement;
    const editMembersList = document.getElementById('editMembersList');

    // Don't allow removing if only one member left
    if (editMembersList.children.length <= 1) {
        alert('A group must have at least one member.');
        return;
    }

    memberItem.remove();
}

function handleEditGroup(e) {
    e.preventDefault();

    const groupId = editingGroupId || currentGroupId || document.getElementById('editingGroupId')?.value;
    if (!groupId) return;

    const groupName = document.getElementById('editGroupName').value.trim();
    const memberInputs = document.querySelectorAll('.edit-member-input');
    const members = Array.from(memberInputs)
        .map(input => input.value.trim())
        .filter(name => name !== '');

    if (!groupName || members.length === 0) {
        alert('Please fill in the group name and at least one member.');
        return;
    }

    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;

    // Update group
    groups[groupIndex].name = groupName;
    groups[groupIndex].members = members;

    // Update expenses to remove any references to deleted members
    groups[groupIndex].expenses = groups[groupIndex].expenses.map(expense => {
        if (!members.includes(expense.paidBy)) {
            expense.paidBy = members[0];
        }

        expense.splitBetween = expense.splitBetween.filter(member => members.includes(member));

        if (expense.splitBetween.length === 0) {
            expense.splitBetween = [...members];
        }

        expense.perPersonAmount = expense.amount / expense.splitBetween.length;

        return expense;
    });

    // Save if localStorage is available
    if (isLocalStorageAvailable()) {
        localStorage.setItem('spliteasy_groups', JSON.stringify(groups));
    }

    closeEditGroupModal();

    // Check if we're on groups page or group detail page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage === 'index.html') {
        loadGroups();
    } else {
        loadGroupDetail();
    }

    console.log('Group updated successfully');
}

// Group Actions Functions (for groups page)
function showEditGroupModal(groupId) {
    event.stopPropagation();

    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    editingGroupId = groupId;

    const modal = document.getElementById('editGroupModal');
    if (!modal) return;

    // Populate group data
    const editGroupName = document.getElementById('editGroupName');
    const editingGroupIdInput = document.getElementById('editingGroupId');

    if (editGroupName) editGroupName.value = group.name;
    if (editingGroupIdInput) editingGroupIdInput.value = groupId;

    // Populate members
    populateEditMembers(group.members);

    modal.style.display = 'block';
}
function showDeleteConfirmModal(groupId) {
    event.stopPropagation();

    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    deletingGroupId = groupId;

    const modal = document.getElementById('deleteConfirmModal');
    const message = document.getElementById('deleteConfirmMessage');

    if (message) {
        message.textContent = `Are you sure you want to delete "${group.name}"? This will permanently delete all expenses and cannot be undone.`;
    }

    if (modal) {
        modal.style.display = 'block';
    }
}

function closeDeleteConfirmModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
    deletingGroupId = null;
}

function confirmDeleteGroup() {
    if (!deletingGroupId) return;

    // Remove group from array
    groups = groups.filter(g => g.id !== deletingGroupId);

    // Update localStorage if available
    if (isLocalStorageAvailable()) {
        localStorage.setItem('spliteasy_groups', JSON.stringify(groups));
    }

    // Close modal and refresh groups
    closeDeleteConfirmModal();
    loadGroups();

    console.log('Group deleted successfully');
}

function handleDeleteFromEditModal() {
    if (!editingGroupId) return;

    // Close edit modal first
    closeEditGroupModal();

    // Show delete confirmation
    deletingGroupId = editingGroupId;
    showDeleteConfirmModal(editingGroupId);
}

// Add/Edit Expense Modal functions
function showAddExpenseModal(expenseId = null) {
    const modal = document.getElementById('addExpenseModal');
    if (!modal) {
        console.error('Add expense modal not found');
        return;
    }

    editingExpenseId = expenseId;

    // Update modal title and buttons
    const modalTitle = document.getElementById('expenseModalTitle');
    const saveBtn = document.getElementById('saveExpenseBtn');
    const deleteBtn = document.getElementById('deleteExpenseBtn');
    const editingExpenseIdInput = document.getElementById('editingExpenseId');

    if (expenseId) {
        // Editing existing expense
        if (modalTitle) modalTitle.textContent = 'Edit Expense';
        if (saveBtn) saveBtn.textContent = 'Save Changes';
        if (deleteBtn) deleteBtn.style.display = 'block';
        if (editingExpenseIdInput) editingExpenseIdInput.value = expenseId;

        // Populate form with existing data
        populateExpenseForm(expenseId);
    } else {
        // Adding new expense
        if (modalTitle) modalTitle.textContent = 'Add Expense';
        if (saveBtn) saveBtn.textContent = 'Add Expense';
        if (deleteBtn) deleteBtn.style.display = 'none';
        if (editingExpenseIdInput) editingExpenseIdInput.value = '';

        // Reset form
        const form = document.getElementById('addExpenseForm');
        if (form) form.reset();

        // Select all members by default
        setTimeout(selectAllMembers, 100);
    }

    // Populate dropdowns and checkboxes
    populateWhoPaidDropdown();
    populateSplitBetweenCheckboxes();

    modal.style.display = 'block';

    console.log('Expense modal shown');
}

function populateExpenseForm(expenseId) {
    if (!currentGroupId) return;

    const group = groups.find(g => g.id === currentGroupId);
    if (!group) return;

    const expense = group.expenses.find(e => e.id === expenseId);
    if (!expense) return;

    // Populate form fields
    const expenseName = document.getElementById('expenseName');
    const expenseAmount = document.getElementById('expenseAmount');
    const whoPaid = document.getElementById('whoPaid');

    if (expenseName) expenseName.value = expense.name;
    if (expenseAmount) expenseAmount.value = expense.amount;

    // Wait for dropdowns to be populated
    setTimeout(() => {
        if (whoPaid) whoPaid.value = expense.paidBy;

        // Set split between checkboxes with visual states
        const splitBetween = expense.splitBetween || group.members;
        const checkboxes = document.querySelectorAll('input[name="splitBetween"]');
        const checkboxItems = document.querySelectorAll('.checkbox-item');

        checkboxes.forEach((checkbox, index) => {
            const isChecked = splitBetween.includes(checkbox.value);
            checkbox.checked = isChecked;

            if (checkboxItems[index]) {
                updateCheckboxVisualState(checkboxItems[index], isChecked);
            }
        });
    }, 100);
}

function closeAddExpenseModal() {
    const modal = document.getElementById('addExpenseModal');
    if (modal) {
        modal.style.display = 'none';
    }
    editingExpenseId = null;
}

function handleDeleteExpense() {
    if (!editingExpenseId || !currentGroupId) return;

    if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
        return;
    }

    const groupIndex = groups.findIndex(g => g.id === currentGroupId);
    if (groupIndex === -1) return;

    const expenseIndex = groups[groupIndex].expenses.findIndex(e => e.id === editingExpenseId);
    if (expenseIndex === -1) return;

    const expense = groups[groupIndex].expenses[expenseIndex];

    // Remove expense from group
    groups[groupIndex].expenses.splice(expenseIndex, 1);
    groups[groupIndex].totalExpenses -= expense.amount;

    if (isLocalStorageAvailable()) {
        localStorage.setItem('spliteasy_groups', JSON.stringify(groups));
    }

    closeAddExpenseModal();
    loadGroupDetail();
}

function populateWhoPaidDropdown() {
    if (!currentGroupId) return;

    const group = groups.find(g => g.id === currentGroupId);
    if (!group) return;

    const whoPaidSelect = document.getElementById('whoPaid');
    if (!whoPaidSelect) return;

    whoPaidSelect.innerHTML = '<option value="" disabled selected>Select who paid</option>';

    group.members.forEach(member => {
        const option = document.createElement('option');
        option.value = member;
        option.textContent = member;
        whoPaidSelect.appendChild(option);
    });
}

// Split Between Checkboxes - Clickable everywhere
function populateSplitBetweenCheckboxes() {
    if (!currentGroupId) return;

    const group = groups.find(g => g.id === currentGroupId);
    if (!group) return;

    const splitBetweenGroup = document.getElementById('splitBetweenGroup');
    if (!splitBetweenGroup) return;

    splitBetweenGroup.innerHTML = '';

    group.members.forEach((member, index) => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';

        checkboxItem.innerHTML = `
            <input type="checkbox" id="split_${index}" name="splitBetween" value="${member}">
            <div class="checkbox-custom"></div>
            <label for="split_${index}" class="checkbox-label">${member}</label>
        `;

        // Add click event listener to the entire checkbox item
        const checkbox = checkboxItem.querySelector('input[type="checkbox"]');

        checkboxItem.addEventListener('click', function(e) {
            // Prevent double-clicking if clicking directly on checkbox
            if (e.target.type !== 'checkbox') {
                checkbox.checked = !checkbox.checked;
            }

            // Update visual state
            updateCheckboxVisualState(checkboxItem, checkbox.checked);

            // Trigger change event for any other listeners
            checkbox.dispatchEvent(new Event('change'));
        });

        // Handle direct checkbox clicks
        checkbox.addEventListener('change', function() {
            updateCheckboxVisualState(checkboxItem, this.checked);
        });

        splitBetweenGroup.appendChild(checkboxItem);
    });
}

// Function to update visual state of checkbox
function updateCheckboxVisualState(checkboxItem, isChecked) {
    if (isChecked) {
        checkboxItem.classList.add('checked');
    } else {
        checkboxItem.classList.remove('checked');
    }
}

function selectAllMembers() {
    const checkboxes = document.querySelectorAll('input[name="splitBetween"]');
    const checkboxItems = document.querySelectorAll('.checkbox-item');

    checkboxes.forEach((checkbox, index) => {
        checkbox.checked = true;
        if (checkboxItems[index]) {
            updateCheckboxVisualState(checkboxItems[index], true);
        }
    });
}

function clearAllMembers() {
    const checkboxes = document.querySelectorAll('input[name="splitBetween"]');
    const checkboxItems = document.querySelectorAll('.checkbox-item');

    checkboxes.forEach((checkbox, index) => {
        checkbox.checked = false;
        if (checkboxItems[index]) {
            updateCheckboxVisualState(checkboxItems[index], false);
        }
    });
}

function addMember() {
    const membersList = document.getElementById('membersList');
    if (!membersList) return;

    const memberCount = membersList.children.length + 1;

    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.className = 'member-input';
    newInput.placeholder = `Member ${memberCount} name`;
    newInput.required = true;

    membersList.appendChild(newInput);
}

function handleCreateGroup(e) {
    e.preventDefault();

    const groupName = document.getElementById('groupName').value.trim();
    const memberInputs = document.querySelectorAll('.member-input');
    const members = Array.from(memberInputs)
        .map(input => input.value.trim())
        .filter(name => name !== '');

    if (groupName && members.length > 0) {
        const newGroup = {
            id: Date.now().toString(),
            name: groupName,
            members: members,
            expenses: [],
            totalExpenses: 0,
            createdAt: new Date().toISOString()
        };

        groups.push(newGroup);

        if (isLocalStorageAvailable()) {
            localStorage.setItem('spliteasy_groups', JSON.stringify(groups));
        }

        closeModal();
        window.location.href = 'index.html';
    } else {
        alert('Please fill in the group name and at least one member.');
    }
}

function handleAddExpense(e) {
    e.preventDefault();

    if (!currentGroupId) return;

    const expenseName = document.getElementById('expenseName').value.trim();
    const expenseAmount = parseFloat(document.getElementById('expenseAmount').value);
    const whoPaid = document.getElementById('whoPaid').value;

    // Get selected members for split
    const checkedBoxes = document.querySelectorAll('input[name="splitBetween"]:checked');
    const splitBetween = Array.from(checkedBoxes).map(checkbox => checkbox.value);

    if (!expenseName || !expenseAmount || expenseAmount <= 0 || !whoPaid) {
        alert('Please fill in all required fields correctly.');
        return;
    }

    if (splitBetween.length === 0) {
        alert('Please select at least one person to split the expense with.');
        return;
    }

    const groupIndex = groups.findIndex(g => g.id === currentGroupId);
    if (groupIndex === -1) return;

    if (editingExpenseId) {
        // Update existing expense
        const expenseIndex = groups[groupIndex].expenses.findIndex(e => e.id === editingExpenseId);
        if (expenseIndex !== -1) {
            const oldAmount = groups[groupIndex].expenses[expenseIndex].amount;

            groups[groupIndex].expenses[expenseIndex] = {
                ...groups[groupIndex].expenses[expenseIndex],
                name: expenseName,
                amount: expenseAmount,
                paidBy: whoPaid,
                splitBetween: splitBetween,
                perPersonAmount: expenseAmount / splitBetween.length,
                updatedAt: new Date().toISOString()
            };

            // Update total expenses
            groups[groupIndex].totalExpenses = groups[groupIndex].totalExpenses - oldAmount + expenseAmount;
        }
    } else {
        // Add new expense
        const newExpense = {
            id: Date.now().toString(),
            name: expenseName,
            amount: expenseAmount,
            paidBy: whoPaid,
            date: new Date().toISOString(),
            splitBetween: splitBetween,
            perPersonAmount: expenseAmount / splitBetween.length
        };

        groups[groupIndex].expenses.push(newExpense);
        groups[groupIndex].totalExpenses += expenseAmount;
    }

    if (isLocalStorageAvailable()) {
        localStorage.setItem('spliteasy_groups', JSON.stringify(groups));
    }

    closeAddExpenseModal();
    loadGroupDetail();
}

function loadGroups() {
    const groupsList = document.getElementById('groupsList');
    const groupCount = document.getElementById('groupCount');

    if (!groupsList) return;

    if (groupCount) {
        groupCount.textContent = `${groups.length} group${groups.length !== 1 ? 's' : ''}`;
    }

    if (groups.length === 0) {
        groupsList.innerHTML = `
            <div class="empty-state">
                <p>No groups yet. Create your first group to get started!</p>
            </div>
        `;
        return;
    }

    groupsList.innerHTML = groups.map(group => `
        <div class="group-card" onclick="goToGroup('${group.id}')">
            <div class="group-card-content">
                <div class="group-info">
                    <h3>${group.name}</h3>
                    <div class="group-meta">
                        <span>👥 ${group.members.length} members</span>
                        <span>${group.expenses.length} expenses</span>
                    </div>
                </div>
                <div class="group-amount">
                    ₹${group.totalExpenses.toFixed(2)}
                </div>
                <div class="group-actions">
                    <button class="group-action-btn edit-btn" onclick="event.stopPropagation(); showEditGroupModal('${group.id}')" title="Edit group">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                    <button class="group-action-btn delete-btn" onclick="event.stopPropagation(); showDeleteConfirmModal('${group.id}')" title="Delete group">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Add hover effects
    document.querySelectorAll('.group-card').forEach(card => {
        const actions = card.querySelector('.group-actions');

        card.addEventListener('mouseenter', () => {
            if (actions) actions.style.opacity = '1';
        });

        card.addEventListener('mouseleave', () => {
            if (actions) actions.style.opacity = '0';
        });
    });
}

function goToGroup(groupId) {
    window.location.href = `group-detail.html?id=${groupId}`;
}

// Helper function to format member names
function formatMemberNames(members) {
    return members.join(', ');
}

function loadGroupDetail() {
    if (!currentGroupId) {
        window.location.href = 'index.html';
        return;
    }

    const group = groups.find(g => g.id === currentGroupId);
    if (!group) {
        window.location.href = 'index.html';
        return;
    }

    console.log('Loading group:', group.name);

    // Update page content
    const groupNameEl = document.getElementById('groupName');
    const memberNamesEl = document.getElementById('memberNames');

    if (groupNameEl) groupNameEl.textContent = group.name;
    if (memberNamesEl) memberNamesEl.textContent = formatMemberNames(group.members);

    // Update stats
    const totalExpenses = document.getElementById('totalExpenses');

    if (totalExpenses) totalExpenses.textContent = `₹${group.totalExpenses.toFixed(2)}`;

    updateBalances(group);
    updateExpensesList(group);
}

function calculateSettlements(group) {
    const memberBalances = {};

    // Initialize balances
    group.members.forEach(member => {
        memberBalances[member] = 0;
    });

    // Calculate what each person owes/is owed
    group.expenses.forEach(expense => {
        const paidBy = expense.paidBy;
        const splitBetween = expense.splitBetween || group.members;
        const perPersonAmount = expense.amount / splitBetween.length;

        // The person who paid gets credit for the full amount
        memberBalances[paidBy] += expense.amount;

        // Each person in the split owes their share
        splitBetween.forEach(member => {
            memberBalances[member] -= perPersonAmount;
        });
    });

    // Separate creditors (positive balance) and debtors (negative balance)
    const creditors = [];
    const debtors = [];

    Object.entries(memberBalances).forEach(([member, balance]) => {
        if (balance > 0.01) {
            creditors.push({ name: member, amount: balance });
        } else if (balance < -0.01) {
            debtors.push({ name: member, amount: Math.abs(balance) });
        }
    });

    // Sort by amount for optimal settlement
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const settlements = [];
    let creditorIndex = 0;
    let debtorIndex = 0;

    // Greedy algorithm to minimize number of transactions
    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
        const creditor = creditors[creditorIndex];
        const debtor = debtors[debtorIndex];

        const settleAmount = Math.min(creditor.amount, debtor.amount);

        if (settleAmount > 0.01) {
            settlements.push({
                from: debtor.name,
                to: creditor.name,
                amount: settleAmount
            });
        }

        creditor.amount -= settleAmount;
        debtor.amount -= settleAmount;

        if (creditor.amount <= 0.01) {
            creditorIndex++;
        }
        if (debtor.amount <= 0.01) {
            debtorIndex++;
        }
    }

    return settlements;
}

function updateBalances(group) {
    const settlementsList = document.getElementById('settlementsList');

    if (!settlementsList) return;

    // Calculate settlements
    const settlements = calculateSettlements(group);

    if (settlements.length === 0) {
        settlementsList.innerHTML = `
            <div class="no-settlements">
                <div class="settlement-emoji">🎉</div>
                <div><strong>All settled up!</strong></div>
                <div>No payments needed.</div>
            </div>
        `;
    } else {
        settlementsList.innerHTML = settlements.map(settlement => `
            <div class="settlement-item">
                <div class="settlement-text">
                    <strong>${settlement.from}</strong>
                    <span class="settlement-arrow">→</span>
                    <strong>${settlement.to}</strong>
                </div>
                <div class="settlement-amount">₹${settlement.amount.toFixed(2)}</div>
            </div>
        `).join('');
    }
}

function updateExpensesList(group) {
    const expensesList = document.getElementById('expensesList');
    const emptyState = document.getElementById('emptyState');

    if (!expensesList || !emptyState) return;

    if (group.expenses.length === 0) {
        emptyState.style.display = 'block';
        expensesList.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        expensesList.style.display = 'block';

        const sortedExpenses = [...group.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

        expensesList.innerHTML = sortedExpenses.map(expense => {
            const splitBetween = expense.splitBetween || group.members;
            const perPersonAmount = expense.amount / splitBetween.length;

            return `
                <div class="expense-item">
                    <div class="expense-content">
                        <div class="expense-info">
                            <h4>${expense.name}</h4>
                            <p>Paid by ${expense.paidBy} on${formatDate(expense.date)}</p>
                            <div class="expense-split">Split between: ${splitBetween.join(', ')}</div>
                        </div>
                        <div class="expense-amount-container">
                            <div class="expense-amount">₹${expense.amount.toFixed(2)}</div>
                            <div class="expense-per-person">₹${perPersonAmount.toFixed(2)} per person</div>
                        </div>
                    </div>
                    <div class="expense-actions">
                        <button class="btn-icon" onclick="showAddExpenseModal('${expense.id}')" title="Edit expense">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
// Enhanced Share Group Function with Compression Support
function shareGroup() {
    if (!currentGroupId) {
        alert('Please select a group to share');
        return;
    }

    const group = groups.find(g => g.id === currentGroupId);
    if (!group) return;

    try {
        // Create a clean copy of group data for sharing
        const shareableGroup = {
            id: group.id,
            name: group.name,
            members: group.members,
            expenses: group.expenses.map(exp => ({
                id: exp.id,
                name: exp.name,
                amount: exp.amount,
                paidBy: exp.paidBy,
                splitBetween: exp.splitBetween || group.members,
                date: exp.date,
                perPersonAmount: exp.amount / (exp.splitBetween || group.members).length
            })),
            totalExpenses: group.totalExpenses,
            createdAt: group.createdAt || new Date().toISOString()
        };

        let shareUrl;
        let compressionUsed = false;

        // Try compression first if LZString is available
        if (typeof LZString !== 'undefined') {
            try {
                const compressedData = LZString.compressToEncodedURIComponent(JSON.stringify(shareableGroup));
                const baseUrl = window.location.origin + window.location.pathname.replace('group-detail.html', 'index.html');
                shareUrl = `${baseUrl}?c=${compressedData}`;
                compressionUsed = true;

                console.log('Original JSON length:', JSON.stringify(shareableGroup).length);
                console.log('Compressed length:', compressedData.length);
                console.log('Compression ratio:', (JSON.stringify(shareableGroup).length / compressedData.length).toFixed(2) + 'x');

                // Check if URL is still too long for mobile browsers
                if (shareUrl.length > 2000) {
                    console.warn('Compressed URL still too long:', shareUrl.length);
                    // Fall back to uncompressed if still too long
                    compressionUsed = false;
                }
            } catch (compressionError) {
                console.error('Compression failed, falling back to uncompressed:', compressionError);
                compressionUsed = false;
            }
        }

        // Fallback to uncompressed format
        if (!compressionUsed) {
            const groupData = encodeURIComponent(JSON.stringify(shareableGroup));
            const baseUrl = window.location.origin + window.location.pathname.replace('group-detail.html', 'index.html');
            shareUrl = `${baseUrl}?shared=${groupData}`;

            // Check URL length for mobile compatibility
            if (shareUrl.length > 2000) {
                alert('❌ Group data too large to share via URL. Try reducing the number of expenses or shortening member names.');
                return;
            }
        }

        // Create detailed share text
        const settlements = calculateSettlements(group);
        let shareText = `🔗 SplitEasy - ${group.name}\n\n`;
        shareText += `👥 Members: ${group.members.join(', ')}\n`;
        shareText += `💵 Total Expenses: ₹${group.totalExpenses.toFixed(2)}\n\n`;

        if (group.expenses.length > 0) {
            shareText += `📋 Recent Expenses:\n`;
            const recentExpenses = group.expenses.slice(-3);
            recentExpenses.forEach(expense => {
                shareText += `• ${expense.name}: ₹${expense.amount} (paid by ${expense.paidBy})\n`;
            });
            shareText += `\n`;
        }

        if (settlements.length > 0) {
            shareText += `🔄 Settlements Needed:\n`;
            settlements.forEach(settlement => {
                shareText += `• ${settlement.from} → ${settlement.to}: ₹${settlement.amount.toFixed(2)}\n`;
            });
        } else {
            shareText += `✅ All settled up! No payments needed.\n`;
        }

        shareText += `\n🔗 Open this group: ${shareUrl}`;
        shareText += `\n\n📱 This link will add the group to your SplitEasy app so you can view all expenses and settlements!`;

        if (compressionUsed) {
            shareText += `\n\n💡 Link optimized for mobile browsers.`;
        }

        console.log('Share URL length:', shareUrl.length);
        console.log('Compression used:', compressionUsed);

        // Try to use Web Share API if available (mobile)
        if (navigator.share) {
            navigator.share({
                title: `SplitEasy - ${group.name}`,
                text: shareText
            }).catch(err => {
                console.log('Share failed:', err);
                // Fallback to copy to clipboard
                copyToClipboard(shareText);
            });
        } else {
            // Fallback to copy to clipboard
            copyToClipboard(shareText);
        }

    } catch (error) {
        console.error('Error creating share URL:', error);
        alert('❌ Error creating shareable link. Please try again.');
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showShareSuccessMessage();
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, 99999); // For mobile devices

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showShareSuccessMessage();
        } else {
            throw new Error('Copy command failed');
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
        // Last resort - show the text in an alert for manual copying
        alert('📋 Please copy this link manually:\n\n' + text);
    }

    document.body.removeChild(textArea);
}

function showShareSuccessMessage() {
    // Remove any existing success message
    const existingMsg = document.querySelector('.share-success-message');
    if (existingMsg) {
        existingMsg.remove();
    }

    // Create and show a better success message
    const successMsg = document.createElement('div');
    successMsg.className = 'share-success-message';
    successMsg.innerHTML = `
        <div style="position: fixed; top: 2rem; right: 2rem; background: #28a745; color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000; font-weight: 500; max-width: 300px; font-size: 14px; line-height: 1.4;">
            ✅ Shareable link copied to clipboard!<br>
            <small style="opacity: 0.9;">Anyone can open this link to view the group.</small>
        </div>
    `;
    document.body.appendChild(successMsg);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (document.body.contains(successMsg)) {
            document.body.removeChild(successMsg);
        }
    }, 4000);
}

// In setupEventListeners() function, make sure this is included:
if (editGroupBtn) {
    editGroupBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showEditGroupModal(); // Call without parameters when in group detail page
    });
}

// Test compression function (for debugging)
function testCompression(group) {
    if (typeof LZString === 'undefined') {
        console.log('LZString library not available');
        return;
    }

    const original = JSON.stringify(group);
    const compressed = LZString.compressToEncodedURIComponent(original);

    console.log('=== COMPRESSION TEST ===');
    console.log(`Original size: ${original.length} characters`);
    console.log(`Compressed size: ${compressed.length} characters`);
    console.log(`Compression ratio: ${(original.length / compressed.length).toFixed(2)}x smaller`);
    console.log(`Size reduction: ${Math.round((1 - compressed.length / original.length) * 100)}%`);

    // Test decompression
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
    const isValid = decompressed === original;
    console.log(`Decompression valid: ${isValid}`);

    return {
        originalSize: original.length,
        compressedSize: compressed.length,
        ratio: original.length / compressed.length,
        reduction: Math.round((1 - compressed.length / original.length) * 100),
        valid: isValid
    };
}

// Add mobile-specific debugging
function debugMobileIssues() {
    console.log('=== MOBILE DEBUG INFO ===');
    console.log('User Agent:', navigator.userAgent);
    console.log('Screen:', window.screen.width + 'x' + window.screen.height);
    console.log('Viewport:', window.innerWidth + 'x' + window.innerHeight);
    console.log('localStorage available:', isLocalStorageAvailable());
    console.log('Groups count:', groups.length);
    console.log('LZString available:', typeof LZString !== 'undefined');
    console.log('Web Share API available:', !!navigator.share);
    console.log('Clipboard API available:', !!navigator.clipboard);

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('shared');
    const compressedData = urlParams.get('c');
    console.log('URL has shared param:', !!sharedData);
    console.log('URL has compressed param:', !!compressedData);

    if (sharedData) {
        console.log('Shared data length:', sharedData.length);
    }
    if (compressedData) {
        console.log('Compressed data length:', compressedData.length);
    }

    return {
        userAgent: navigator.userAgent,
        screen: { width: window.screen.width, height: window.screen.height },
        viewport: { width: window.innerWidth, height: window.innerHeight },
        localStorage: isLocalStorageAvailable(),
        groupsCount: groups.length,
        lzstring: typeof LZString !== 'undefined',
        webShare: !!navigator.share,
        clipboard: !!navigator.clipboard,
        urlParams: {
            shared: !!sharedData,
            compressed: !!compressedData,
            sharedLength: sharedData ? sharedData.length : 0,
            compressedLength: compressedData ? compressedData.length : 0
        }
    };
}

// Export debug function to global scope for console access
window.debugMobileIssues = debugMobileIssues;
window.testCompression = testCompression;

console.log('✅ SplitEasy script loaded successfully!');
console.log('📱 Mobile optimizations enabled');
if (typeof LZString !== 'undefined') {
    console.log('🗜️ URL compression available');
} else {
    console.log('⚠️ LZString library not loaded - compression disabled');
}
