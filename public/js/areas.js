// ============ AREAS MANAGEMENT JAVASCRIPT ============

let allAreas = [];
let allUsers = [];
let currentEditingAreaId = null;

// ============ DOM READY ============
$(document).ready(function () {
    loadAreas();
    loadUsers();
    attachEventListeners();
});

// ============ EVENT LISTENERS ============
function attachEventListeners() {
    // Add Area Button
    $('#addAreaBtn').click(() => openAreaModal());

    // Close Modals
    $('#closeAreaModal').click(() => closeAreaModal());
    $('#closeAssignModal').click(() => closeAssignModal());
    $('#cancelAreaBtn').click(() => closeAreaModal());
    $('#cancelAssignBtn').click(() => closeAssignModal());

    // Form Submission
    $('#areaForm').submit(handleAreaFormSubmit);
    $('#assignUserForm').submit(handleAssignUserSubmit);

    // Search and Filter
    $('#searchInput').on('keyup', filterAreas);
    $('#regionFilter').change(filterAreas);
    $('#statusFilter').change(filterAreas);

    // Confirm Dialog
    $('#confirmCancel').click(() => closeConfirmPopup());
}

// ============ LOAD DATA ============
function loadAreas() {
    $.ajax({
        url: '/api/areas/all',
        type: 'GET',
        dataType: 'json',
        success: function (response) {
            if (response.success) {
                allAreas = response.data;
                renderAreasTable(allAreas);
                updateStats();
            }
        },
        error: function (error) {
            console.error('Error loading areas:', error);
            showToast('Failed to load areas', 'error');
        }
    });
}

function loadUsers() {
    // Try the API path first; some deployments expose users at /users
    $.ajax({
        url: '/api/users/all',
        type: 'GET',
        dataType: 'json'
    }).done(function (response) {
        if (response && response.success && Array.isArray(response.data)) {
            allUsers = response.data;
            populateUserSelect();
            return;
        }
        // Some implementations return { success: true, users: [...] }
        if (response && response.success && Array.isArray(response.users)) {
            allUsers = response.users;
            populateUserSelect();
            return;
        }
        // Fallback to /users
        $.ajax({ url: '/users', type: 'GET', dataType: 'json' }).done(function (r2) {
            if (r2 && r2.success && Array.isArray(r2.users)) {
                allUsers = r2.users;
                populateUserSelect();
            } else if (Array.isArray(r2)) {
                allUsers = r2;
                populateUserSelect();
            } else {
                console.error('Unexpected users response', r2);
            }
        }).fail(function (err2) {
            console.error('Error loading users (fallback):', err2);
        });
    }).fail(function (err) {
        // If /api/users/all 404s, try /users
        $.ajax({ url: '/users', type: 'GET', dataType: 'json' }).done(function (r2) {
            if (r2 && r2.success && Array.isArray(r2.users)) {
                allUsers = r2.users;
                populateUserSelect();
            } else if (Array.isArray(r2)) {
                allUsers = r2;
                populateUserSelect();
            } else {
                console.error('Unexpected users response', r2);
            }
        }).fail(function (err2) {
            console.error('Error loading users (both endpoints failed):', err, err2);
        });
    });
}

// ============ RENDER TABLE ============
function renderAreasTable(areas) {
    const tbody = $('#areasTableBody');
    tbody.empty();

    if (areas.length === 0) {
        tbody.html(`
      <tr class="loading-row">
        <td colspan="8" class="text-center" style="padding: 40px;">
          <i class="fas fa-inbox" style="font-size: 48px; color: #ddd; margin-bottom: 10px;"></i>
          <p style="color: #888;">No areas found</p>
        </td>
      </tr>
    `);
        return;
    }

    areas.forEach(area => {
        const nameBn = (area.name_bn || '').toString();
        const nameEn = (area.name_en || '').toString();
        const createdAt = area.created_at ? new Date(area.created_at) : null;
        const createdDate = createdAt ? createdAt.toLocaleDateString('bn-BD') : '-';
        const statusClass = area.is_active ? 'status-active' : 'status-inactive';
        const statusText = area.is_active ? 'Active' : 'Inactive';
        const userCount = area.user_count || 0;
        const code = area.code || '';
        const region = area.region || 'N/A';

        const safeNameEnForAttr = nameEn.replace(/'/g, "\\'");

        const row = `
            <tr>
                <td>
                    <span class="area-name-bn">${nameBn.trim()}</span>
                </td>
                <td>${nameEn.trim()}</td>
                <td>
                    <span class="area-code">${code}</span>
                </td>
                <td>
                    <span class="region-badge">${region}</span>
                </td>
                <td>
                    <span class="user-count">${userCount} user${userCount !== 1 ? 's' : ''}</span>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <span class="created-date">${createdDate}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn action-assign" onclick="openAssignModal(${area.id})" title="Assign User">
                            <i class="fas fa-user-plus"></i>
                        </button>
                        <button class="action-btn action-edit" onclick="openAreaModal(${area.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn action-delete" onclick="confirmDelete(${area.id}, '${safeNameEnForAttr}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;

        tbody.append(row);
    });
}

// ============ MODAL FUNCTIONS ============
function openAreaModal(areaId = null) {
    currentEditingAreaId = areaId;

    // Clear form
    $('#areaForm')[0].reset();
    $('#areaId').val('');

    if (areaId) {
        // Edit mode
        $('#modalTitle').text('Edit Area');

        const area = allAreas.find(a => a.id === areaId);
        if (area) {
            $('#nameBn').val(area.name_bn.trim());
            $('#nameEn').val(area.name_en.trim());
            $('#code').val(area.code);
            $('#region').val(area.region || '');
            $('#descriptionBn').val(area.description_bn || '');
            $('#descriptionEn').val(area.description_en || '');
            $('#areaId').val(areaId);
        }
    } else {
        // Add mode
        $('#modalTitle').text('Add New Area');
    }

    $('#areaModal').addClass('active');
}

function closeAreaModal() {
    $('#areaModal').removeClass('active');
    $('#areaForm')[0].reset();
    currentEditingAreaId = null;
    clearErrors();
}

function openAssignModal(areaId) {
    $('#assignAreaId').val(areaId);
    $('#assignUserForm')[0].reset();
    $('#assignUserModal').addClass('active');
    clearErrors();
}

function closeAssignModal() {
    $('#assignUserModal').removeClass('active');
    $('#assignUserForm')[0].reset();
    clearErrors();
}

// ============ FORM HANDLERS ============
function handleAreaFormSubmit(e) {
    e.preventDefault();

    // Validate
    if (!validateAreaForm()) {
        return;
    }

    const areaId = $('#areaId').val();
    const data = {
        name_bn: $('#nameBn').val().trim(),
        name_en: $('#nameEn').val().trim(),
        code: $('#code').val().trim(),
        region: $('#region').val(),
        description_bn: $('#descriptionBn').val().trim(),
        description_en: $('#descriptionEn').val().trim(),
        _csrf: $('input[name="_csrf"]').val()
    };

    const url = areaId ? `/api/areas/${areaId}` : '/api/areas/create';
    const method = areaId ? 'PUT' : 'POST';

    $.ajax({
        url: url,
        type: method,
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (response) {
            if (response.success) {
                showToast(areaId ? 'Area updated successfully' : 'Area created successfully', 'success');
                closeAreaModal();
                loadAreas();
            } else {
                showToast(response.message, 'error');
            }
        },
        error: function (error) {
            const message = error.responseJSON?.message || 'Failed to save area';
            showToast(message, 'error');
        }
    });
}

function handleAssignUserSubmit(e) {
    e.preventDefault();

    const areaId = $('#assignAreaId').val();
    const userId = $('#userSelect').val();

    if (!userId) {
        showError('userSelect', 'Please select a user');
        return;
    }

    const data = {
        areaId: parseInt(areaId),
        userId: parseInt(userId),
        _csrf: $('input[name="_csrf"]').val()
    };

    $.ajax({
        url: '/api/areas/assign-user',
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (response) {
            if (response.success) {
                showToast('User assigned to area successfully', 'success');
                closeAssignModal();
                loadAreas();
            } else {
                showToast(response.message, 'error');
            }
        },
        error: function (error) {
            const message = error.responseJSON?.message || 'Failed to assign user';
            showToast(message, 'error');
        }
    });
}

// ============ VALIDATION ============
function validateAreaForm() {
    clearErrors();
    let isValid = true;

    const nameBn = $('#nameBn').val().trim();
    const nameEn = $('#nameEn').val().trim();
    const code = $('#code').val().trim();

    if (!nameBn) {
        showError('nameBn', 'Bengali name is required');
        isValid = false;
    }

    if (!nameEn) {
        showError('nameEn', 'English name is required');
        isValid = false;
    }

    if (!code) {
        showError('code', 'Area code is required');
        isValid = false;
    }

    if (code && code.length > 10) {
        showError('code', 'Area code must be 10 characters or less');
        isValid = false;
    }

    return isValid;
}

function showError(fieldId, message) {
    const errorEl = $(`#${fieldId}Error`);
    errorEl.text(message).addClass('show');
}

function clearErrors() {
    $('.error-msg').removeClass('show').text('');
}

// ============ FILTER & SEARCH ============
function filterAreas() {
    const search = $('#searchInput').val().toLowerCase();
    const region = $('#regionFilter').val();
    const status = $('#statusFilter').val();

    let filtered = allAreas.filter(area => {
        const matchesSearch = !search ||
            area.name_bn.toLowerCase().includes(search) ||
            area.name_en.toLowerCase().includes(search) ||
            area.code.toLowerCase().includes(search);

        const matchesRegion = !region || area.region === region;

        let matchesStatus = true;
        if (status === 'active') {
            matchesStatus = area.is_active;
        } else if (status === 'inactive') {
            matchesStatus = !area.is_active;
        }

        return matchesSearch && matchesRegion && matchesStatus;
    });

    renderAreasTable(filtered);
}

// ============ DELETE FUNCTION ============
function confirmDelete(areaId, areaName) {
    $('#confirmTitle').text('Delete Area?');
    $('#confirmMessage').text(`Are you sure you want to delete "${areaName}"? This action cannot be undone.`);

    $('#confirmOk').off('click').on('click', function () {
        deleteArea(areaId);
    });

    $('#confirmOverlay').addClass('active');
}

function deleteArea(areaId) {
    // include CSRF token (csurf expects token for non-GET requests)
    const csrf = ($('input[name="_csrf"]').first().val() || $('meta[name="csrf-token"]').attr('content')) || '';

    $.ajax({
        url: `/api/areas/${areaId}`,
        type: 'DELETE',
        dataType: 'json',
        contentType: 'application/json',
        headers: { 'X-CSRF-Token': csrf },
        data: JSON.stringify({ _csrf: csrf }),
        success: function (response) {
            if (response.success) {
                showToast('Area deleted successfully', 'success');
                closeConfirmPopup();
                loadAreas();
            } else {
                showToast(response.message, 'error');
            }
        },
        error: function (error) {
            const message = error.responseJSON?.message || (error.responseText || 'Failed to delete area');
            console.error('deleteArea error', error);
            showToast(message, 'error');
        }
    });
}

function closeConfirmPopup() {
    $('#confirmOverlay').removeClass('active');
}

// ============ STATS ============
function updateStats() {
    const totalAreas = allAreas.length;
    const activeAreas = allAreas.filter(a => a.is_active).length;
    const totalUsers = allAreas.reduce((sum, area) => sum + (area.user_count || 0), 0);

    $('#totalAreas').text(totalAreas);
    $('#activeAreas').text(activeAreas);
    $('#totalUsers').text(totalUsers);
}

// ============ USER SELECT ============
function populateUserSelect() {
    const select = $('#userSelect');
    select.empty();
    select.append('<option value="">Choose a user...</option>');

    allUsers.forEach(user => {
        select.append(`<option value="${user.id}">${user.name}</option>`);
    });
}

// ============ TOAST NOTIFICATION ============
function showToast(message, type = 'success') {
    const toast = $('#toast');
    const icon = toast.find('.toast-icon');

    // Remove all type classes
    toast.removeClass('success error warning');

    // Add new type class
    toast.addClass(type);

    // Update icon based on type
    icon.removeClass('fa-check-circle fa-exclamation-circle fa-warning');
    switch (type) {
        case 'success':
            icon.addClass('fa-check-circle');
            break;
        case 'error':
            icon.addClass('fa-exclamation-circle');
            break;
        case 'warning':
            icon.addClass('fa-warning');
            break;
    }

    $('#toastMessage').text(message);
    toast.addClass('show');

    // Auto hide after 3 seconds
    setTimeout(() => {
        toast.removeClass('show');
    }, 3000);
}
