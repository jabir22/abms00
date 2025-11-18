let roles = [];
let currentRoleId = null;
let rolesTable = null;

// Read CSRF token injected into pages by server (if running through EJS)
const csrfToken = (typeof document !== 'undefined')
  ? document.querySelector('meta[name="csrf-token"]')?.content
  : null;

let PERMISSIONS = {};
let PERMISSION_GROUPS = {};
let permissionsGridInitialized = false;

async function loadPermissions() {
  try {
    console.log('Loading permissions...');
    const res = await fetch('/admin/permissions', {
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {})
      }
    });
    const data = await res.json();
    console.log('Permissions response:', data);

    if (data.success) {
      // Accept either object map or array from server
      if (Array.isArray(data.permissions)) {
        PERMISSIONS = {};
        data.permissions.forEach(p => { if (p && p.name) PERMISSIONS[p.name] = p; });
      } else {
        PERMISSIONS = data.permissions || {};
      }
      PERMISSION_GROUPS = data.groups || {};
      console.log('Loaded permissions:', PERMISSIONS);
      console.log('Loaded permission groups:', PERMISSION_GROUPS);
      return true;
    }
    console.error('Error loading permissions:', data);
    return false;
  } catch (err) {
    console.error('Failed to load permissions:', err);
    return false;
  }
}

function initPermissionsGrid() {
  console.log('Initializing permissions grid...');
  const grid = document.getElementById('permissionsGrid');
  if (!grid) {
    console.error('Permission grid element not found');
    return;
  }

  if (!PERMISSIONS || Object.keys(PERMISSIONS).length === 0) {
    console.error('No permissions loaded', { PERMISSIONS, PERMISSION_GROUPS });
    grid.innerHTML = '<div class="alert alert-danger">পারমিশন লোড করতে সমস্যা হয়েছে</div>';
    return;
  }

  console.log('Available permissions:', PERMISSIONS);
  console.log('Permission groups:', PERMISSION_GROUPS); grid.innerHTML = '';

  // Group permissions by category
  const groupedPermissions = {};
  Object.entries(PERMISSIONS).forEach(([key, perm]) => {
    if (!groupedPermissions[perm.group]) {
      groupedPermissions[perm.group] = [];
    }
    groupedPermissions[perm.group].push({ ...perm, key });
  });

  // Create permission groups
  Object.entries(groupedPermissions).forEach(([group, perms]) => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'permission-group';

    const groupTitle = document.createElement('h4');
    groupTitle.className = 'permission-group-title';
    groupTitle.textContent = PERMISSION_GROUPS[group] || group;
    groupDiv.appendChild(groupTitle);

    const permsDiv = document.createElement('div');
    permsDiv.className = 'permission-items';

    perms.forEach(perm => {
      const item = document.createElement('div');
      item.className = 'permission-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `perm_${perm.name}`;
      checkbox.value = perm.name;

      const label = document.createElement('label');
      label.htmlFor = `perm_${perm.name}`;
      label.textContent = perm.label;

      item.appendChild(checkbox);
      item.appendChild(label);
      permsDiv.appendChild(item);
    });

    groupDiv.appendChild(permsDiv);
    grid.appendChild(groupDiv);
  });
}

function formatPermissions(permissions) {
  if (!permissions) return '-';
  try {
    const perms = typeof permissions === 'string' ? JSON.parse(permissions) : permissions;
    return perms.map(p => PERMISSIONS[p]?.label || p).join(', ');
  } catch (err) {
    console.error('Error parsing permissions:', err);
    return '-';
  }
}

function initDataTable() {
  if (!document.getElementById('rolesTable')) return;

  rolesTable = $('#rolesTable').DataTable({
    ajax: {
      url: '/admin/roles/data',
      dataSrc: function (json) {
        // server returns { success: true, roles: [...] }
        roles = (json && json.roles) ? json.roles : [];
        try {
          const cntEl = document.getElementById('rolesCount');
          if (cntEl) cntEl.textContent = roles.length;
        } catch (e) {
          console.warn('Could not update rolesCount:', e);
        }
        return roles;
      }
    },
    columns: [
      { data: 'name' },
      { data: 'slug', defaultContent: '-' },
      { data: 'description', render: d => d ? (d.length > 80 ? d.substring(0,80) + '…' : d) : '-' },
      { data: 'created_by_name', defaultContent: '-', render: d => d || '-' },
      { data: 'tenant_name', defaultContent: '-', render: d => d || '-' },
      { data: 'users_count', defaultContent: 0, render: d => `<span class="badge">${d}</span>` },
      { data: 'permissions', orderable: false, render: function (d, t, row) {
          const perms = Array.isArray(row.permissions) ? row.permissions : (typeof row.permissions === 'string' ? JSON.parse(row.permissions || '[]') : []);
          if (!perms || perms.length === 0) return '-';
          const slice = perms.slice(0,3).map(p => `<span class="perm-chip">${(PERMISSIONS[p]?.label) || p}</span>`).join(' ');
          return `<div title="${perms.map(p=> (PERMISSIONS[p]?.label)||p).join(', ')}">${slice}${perms.length>3? ' <span class="more">+${perms.length-3}</span>':''}</div>`;
        }
      },
      { data: 'created_at', render: d => d ? moment(d).format('DD/MM/YYYY HH:mm') : '-' },
      { data: 'updated_at', render: d => d ? moment(d).format('DD/MM/YYYY HH:mm') : '-' },
      {
        data: null, orderable: false, render: function (row) {
            return `
              <div class="action-cell">
                <div class="action-buttons" role="group">
                  <button class="view-btn" data-id="${row.id}" title="View Details"><i class="fas fa-eye"></i></button>
                  <button class="edit-btn" data-id="${row.id}" title="Edit"><i class="fas fa-edit"></i></button>
                  <button class="delete-btn" data-id="${row.id}" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
              </div>`;
        }
      }
    ],
    order: [[7, 'desc']]
  });

  // Wire external search input
  const searchInput = document.getElementById('rolesSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        rolesTable.search(e.target.value).draw();
      });
    }

  // Row action handlers (delegated)
  $('#rolesTable tbody').on('click', 'button.view-btn', function () {
    const id = $(this).data('id');
    window.event && window.event.stopPropagation();
    showRoleDetails(id);
  });

  $('#rolesTable tbody').on('click', 'button.edit-btn', function () {
    const id = $(this).data('id');
    window.event && window.event.stopPropagation();
    openRoleModal(id);
  });

  $('#rolesTable tbody').on('click', 'button.delete-btn', function () {
    const id = $(this).data('id');
    window.event && window.event.stopPropagation();
    showDeleteModal(id);
  });

  // clicking outside table closes any open actions
  $(document).on('click', function (e) {
    if (!$(e.target).closest('#rolesTable').length) {
      $('#rolesTable tbody tr.actions-visible').removeClass('actions-visible');
    }
  });
}

function refreshTable() {
  if (rolesTable) rolesTable.ajax.reload(null, false);
}

// Modal elements
let roleModal = typeof document !== 'undefined' ? document.getElementById('roleModal') : null;
let deleteModal = typeof document !== 'undefined' ? document.getElementById('deleteModal') : null;

async function openRoleModal(roleId = null) {
  currentRoleId = roleId;
  try {
    console.debug('openRoleModal', roleId);
    const titleEl = document.querySelector('.modal-title');

    // Lazy-init permissions: load from server and build grid on first open
    if (!permissionsGridInitialized) {
      const ok = await loadPermissions();
      if (ok) {
        try { initPermissionsGrid(); } catch (e) { console.warn('initPermissionsGrid failed', e); }
      }
      permissionsGridInitialized = true;
    }

    if (roleId) {
      const role = roles.find(r => r.id === roleId);
      if (!role) return;
      if (titleEl) titleEl.textContent = 'রোল এডিট';
      const nameEl = document.getElementById('roleName');
      const slugEl = document.getElementById('roleSlug');
      const descEl = document.getElementById('roleDescription');
      if (nameEl) nameEl.value = role.name || '';
      if (slugEl) slugEl.value = role.slug || '';
      if (descEl) descEl.value = role.description || '';

      const permissions = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : (role.permissions || []);
      Object.values(PERMISSIONS).forEach(perm => {
        const el = document.getElementById(`perm_${perm.name}`);
        if (el) el.checked = permissions.includes(perm.name);
      });
    } else {
      if (titleEl) titleEl.textContent = 'নতুন রোল';
      const form = document.getElementById('roleForm');
      if (form) form.reset();
    }

    if (!roleModal) {
      // attempt to find modal element if initial lookup failed
      try { roleModal = document.getElementById('roleModal'); } catch (e) { /* ignore */ }
    }

    if (roleModal) {
      roleModal.style.display = 'flex';
      roleModal.setAttribute('aria-hidden', 'false');
    } else {
      console.warn('roleModal element not found');
    }

    // focus first input for accessibility and UX
    setTimeout(() => {
      const nameEl = document.getElementById('roleName');
      if (nameEl) nameEl.focus();
    }, 80);
  } catch (err) {
    console.error('Failed to open role modal:', err);
  }
}

function closeRoleModal() {
  try {
    // Re-enable form inputs if they were disabled (from view mode)
    const form = document.getElementById('roleForm');
    if (form) {
      Array.from(form.querySelectorAll('input, textarea, select')).forEach(el => {
        el.disabled = false;
      });
    }
    
    // Restore all permission items visibility (undo the filtering from view mode)
    const grid = document.getElementById('permissionsGrid');
    if (grid) {
      Array.from(grid.querySelectorAll('.permission-item, .permission-group')).forEach(el => {
        el.style.display = '';
      });
    }
    
    // Show save button if it was hidden
    const saveBtn = document.getElementById('saveRole');
    if (saveBtn) saveBtn.style.display = '';
  } catch (e) {
    console.warn('Error re-enabling form on modal close:', e);
  }

  if (roleModal) roleModal.style.display = 'none';
  const form = document.getElementById('roleForm');
  if (form) form.reset();
  currentRoleId = null;
}

// Show role in read-only view mode
async function showRoleDetails(roleId) {
  try {
    // First open the modal normally (which populates the data)
    await openRoleModal(roleId);
    
    // Get the role object to extract its permissions
    const role = roles.find(r => r.id === roleId);
    if (!role) return;
    
    // Get role's permissions
    const rolePerms = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : (role.permissions || []);
    
    // Clear and rebuild permissions grid to show only assigned permissions (checked, rest hidden)
    const grid = document.getElementById('permissionsGrid');
    if (grid) {
      // Hide all permission items, then show only those assigned to this role
      Array.from(grid.querySelectorAll('.permission-item')).forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) {
          // Check if this permission is in the role's permission list
          if (rolePerms.includes(checkbox.value)) {
            item.style.display = 'flex';
            checkbox.checked = true;
            checkbox.disabled = true;
          } else {
            item.style.display = 'none';
          }
        }
      });
      
      // Hide empty permission groups (those with no visible items)
      Array.from(grid.querySelectorAll('.permission-group')).forEach(group => {
        const visibleItems = Array.from(group.querySelectorAll('.permission-item')).filter(item => item.style.display !== 'none');
        if (visibleItems.length === 0) {
          group.style.display = 'none';
        } else {
          group.style.display = 'block';
        }
      });
    }
    
    // Then disable all form inputs
    const form = document.getElementById('roleForm');
    if (form) {
      Array.from(form.querySelectorAll('input, textarea, select')).forEach(el => {
        el.disabled = true;
      });
    }
    
    // Hide the save button
    const saveBtn = document.getElementById('saveRole');
    if (saveBtn) saveBtn.style.display = 'none';
    
    // Update title to indicate read-only mode
    const titleEl = document.querySelector('.modal-title');
    if (titleEl) titleEl.textContent = 'রোল দেখুন (Read-only)';
  } catch (err) {
    console.error('Error in showRoleDetails:', err);
    showToast('ত্রুটি: রোল তথ্য দেখাতে ব্যর্থ', 'error');
  }
}

function showDeleteModal(roleId) {
  currentRoleId = roleId;
  // ensure role modal is closed when showing delete confirmation
  try { closeRoleModal(); } catch (e) { /* ignore */ }

  // populate confirmation with details and guard delete when not allowed
  try {
    const role = roles.find(r => r.id === roleId);
    const msgEl = deleteModal ? deleteModal.querySelector('.modal-body p') : null;
    const confirmBtn = deleteModal ? deleteModal.querySelector('.btn-danger') : null;
    if (msgEl) {
      if (role) {
        msgEl.textContent = `আপনি কি নিশ্চিত যে "${role.name}" রোলটি ডিলিট করতে চান?`;
      } else {
        msgEl.textContent = 'আপনি কি নিশ্চিত যে এই রোলটি ডিলিট করতে চান?';
      }
    }

    // Prevent deleting roles that have users or are system owner
    let canDelete = true;
    if (role) {
      if ((role.users_count || 0) > 0) {
        canDelete = false;
      }
      if (role.slug === 'owner' || role.slug === 'super-admin') {
        canDelete = false;
      }
    }

    if (confirmBtn) {
      confirmBtn.disabled = !canDelete;
      confirmBtn.title = canDelete ? '' : 'এই রোলটিতে ইউজার আছে বা সিস্টেম রোল, সরাসরি ডিলিট করা যাবে না';
    }
    // Show or hide force-delete button: visible when role has users and is not owner/super-admin
    try {
      const forceBtn = document.getElementById('forceDeleteBtn');
      if (forceBtn) {
        if (role && (role.users_count || 0) > 0 && role.slug !== 'owner' && role.slug !== 'super-admin') {
          forceBtn.style.display = 'inline-block';
          forceBtn.disabled = false;
        } else {
          forceBtn.style.display = 'none';
        }
      }
    } catch (e) {
      // ignore
    }
  } catch (e) {
    console.warn('Error preparing delete modal:', e);
  }

  if (deleteModal) deleteModal.style.display = 'block';
}

function closeDeleteModal() {
  if (deleteModal) deleteModal.style.display = 'none';
  currentRoleId = null;
}

async function saveRole() {
  try {
    console.log('saveRole clicked, currentRoleId=', currentRoleId);

    // Get form elements
    const nameEl = document.getElementById('roleName');
    const slugEl = document.getElementById('roleSlug');
    const descEl = document.getElementById('roleDescription');

    // Get and validate values
    const name = nameEl ? nameEl.value.trim() : '';
    const slug = slugEl ? slugEl.value.trim() : '';
    const description = descEl ? descEl.value.trim() : '';

    if (!name || !slug) {
      showToast('নাম এবং স্লাগ পূরণ করুন', 'error');
      return;
    }

    const permissions = [];
    Object.values(PERMISSIONS).forEach(perm => {
      const el = document.getElementById(`perm_${perm.name}`);
      if (el && el.checked) permissions.push(perm.name);
    });

    const payload = { name, slug, description, permissions };
    const url = currentRoleId ? `/admin/roles/${currentRoleId}` : '/admin/roles';

    try {
      console.debug('roles.save: payload, csrfToken=', payload, csrfToken);
      const res = await fetch(url, {
        method: currentRoleId ? 'PUT' : 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' },
          csrfToken ? {
            'x-csrf-token': csrfToken,
            'x-xsrf-token': csrfToken,
            'csrf-token': csrfToken,
            'X-CSRF-TOKEN': csrfToken
          } : {}
        ),
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });
      const contentType = res.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.warn('Non-JSON response from server:', res.status, text);
        try {
          data = JSON.parse(text);
        } catch (e) {
          showToast('সার্ভার রেসপন্স অচেনা ফরম্যাট: ' + res.status, 'error');
          return;
        }
      }
      if (data.success) {
        showToast(currentRoleId ? 'রোল আপডেট হয়েছে' : 'নতুন রোল তৈরি হয়েছে', 'success');
        closeRoleModal();
        refreshTable();
      } else {
        showToast(data.message || 'রোল সেভ করতে সমস্যা হয়েছে', 'error');
      }
    } catch (err) {
      console.error('Error saving role:', err);
      showToast('রোল সেভ করতে সমস্যা হয়েছে', 'error');
    }
  } catch (err) {
    console.error('Error in saveRole:', err);
    showToast('রোল সেভ করতে সমস্যা হয়েছে', 'error');
  }
}

async function confirmDelete() {
  try {
    if (!currentRoleId) return;

    console.log('Deleting role:', currentRoleId);

    const res = await fetch(`/admin/roles/${currentRoleId}`, {
      method: 'DELETE',
      headers: Object.assign({}, csrfToken ? {
        'x-csrf-token': csrfToken,
        'x-xsrf-token': csrfToken,
        'csrf-token': csrfToken,
        'X-CSRF-TOKEN': csrfToken
      } : {}),
      credentials: 'same-origin'
    });

    const contentType = res.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.warn('Non-JSON response from server (delete):', res.status, text);
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse response:', e);
        showToast('সার্ভার রেসপন্স অচেনা ফরম্যাট: ' + res.status, 'error');
        return;
      }
    }

    if (data.success) {
      showToast('রোল ডিলিট হয়েছে', 'success');
      closeDeleteModal();
      refreshTable();
    } else {
      showToast(data.message || 'রোল ডিলিট করতে সমস্যা হয়েছে', 'error');
    }
  } catch (err) {
    console.error('Error deleting role:', err);
    showToast('রোল ডিলিট করতে সমস্যা হয়েছে', 'error');
  }
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// Wire UI when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await loadPermissions();
  initDataTable();

  // buttons
  const saveBtn = document.getElementById('saveRole');
  if (saveBtn) saveBtn.addEventListener('click', saveRole);

  const confirmDeleteBtn = document.querySelector('#deleteModal .btn-danger');
  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmDelete);

  const forceDeleteBtn = document.getElementById('forceDeleteBtn');
  if (forceDeleteBtn) forceDeleteBtn.addEventListener('click', forceDeleteRole);

  // close when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === roleModal) closeRoleModal();
    if (e.target === deleteModal) closeDeleteModal();
  });

  // slug auto-generate
  const roleNameEl = document.getElementById('roleName');
  const roleSlugEl = document.getElementById('roleSlug');
  if (roleNameEl && roleSlugEl) {
    roleNameEl.addEventListener('input', (e) => {
      const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      roleSlugEl.value = slug;
    });
  }
});

// Expose functions to global scope for inline onclick handlers
try {
  window.openRoleModal = openRoleModal;
  window.closeRoleModal = closeRoleModal;
  window.showRoleDetails = showRoleDetails;
  window.showDeleteModal = showDeleteModal;
  window.closeDeleteModal = closeDeleteModal;
  window.saveRole = saveRole;
  window.confirmDelete = confirmDelete;
} catch (e) {
  // running in non-browser environment
}

// Force delete role: reassign users and remove role
async function forceDeleteRole() {
  try {
    if (!currentRoleId) return;

    const res = await fetch(`/admin/roles/${currentRoleId}/force-delete`, {
      method: 'POST',
      headers: Object.assign({}, csrfToken ? {
        'x-csrf-token': csrfToken,
        'x-xsrf-token': csrfToken,
        'csrf-token': csrfToken,
        'X-CSRF-TOKEN': csrfToken
      } : {}),
      credentials: 'same-origin'
    });

    const contentType = res.headers.get('content-type') || '';
    let data = {};
    if (contentType.includes('application/json')) data = await res.json();
    else {
      const text = await res.text();
      try { data = JSON.parse(text); } catch (e) { data = { success: false, message: text }; }
    }

    if (data.success) {
      showToast('রোল ফোর্স ডিলিট হয়েছে এবং ইউজাররা পুনরায় বরাদ্দ হয়েছে', 'success');
      closeDeleteModal();
      refreshTable();
    } else {
      showToast(data.message || 'ফোর্স ডিলিট করতে সমস্যা হয়েছে', 'error');
    }
  } catch (err) {
    console.error('Error force deleting role:', err);
    showToast('ফোর্স ডিলিট করতে সমস্যা হয়েছে', 'error');
  }
}