// Users management page JavaScript

let usersTable;
let CAN_ASSIGN_ROLE = false;
const csrfMeta = document.querySelector('meta[name="csrf-token"]');
const csrfToken = csrfMeta ? csrfMeta.content : '';

// Check if CSRF token is available
if (!csrfToken) {
  console.error('CSRF token not found. Please ensure the meta tag is present in your HTML.');
}

// ================= Initialize DataTable =================
document.addEventListener('DOMContentLoaded', () => {
  (async () => {
    await loadMyPermissions();
    await loadRoles();
    try {
      if (typeof $ !== 'undefined' && $.fn && $.fn.DataTable && document.getElementById('usersTable')) {
        initializeDataTable();
      } else {
        console.warn('DataTable not initialized: jQuery/DataTable or #usersTable not found.');
      }
    } catch (err) {
      console.error('Error initializing DataTable:', err);
    }
  })();
});

function initializeDataTable() {
  usersTable = $('#usersTable').DataTable({
    ajax: {
      // use the admin JSON endpoint (adjust if your server exposes a different one)
      url: '/admin/users/data',
      type: 'GET',
      dataType: 'json',
      // ensure server session cookie is sent for same-origin requests
      beforeSend: function (xhr) {
        if (csrfToken) xhr.setRequestHeader('X-CSRF-TOKEN', csrfToken);
      },
      // robust dataSrc: accept { users: [...] }, { data: [...] }, direct array, or fallback to empty array
      dataSrc: function (json) {
        try {
          if (!json) return [];
          if (Array.isArray(json)) return json;
          if (Array.isArray(json.users)) return json.users;
          if (Array.isArray(json.data)) return json.data;
          // some servers return { success: true, users: [...] }
          for (const key of ['users', 'data']) {
            if (json[key] && Array.isArray(json[key])) return json[key];
          }
          // if server returned HTML (page), log it for debugging
          if (typeof json === 'string') {
            console.warn('DataTable received string response (likely HTML). Response starts:', json.slice(0, 200));
            return [];
          }
        } catch (e) {
          console.error('Error processing DataTable response:', e, json);
        }
        return [];
      },
      error: function (xhr, error, thrown) {
        console.error('DataTable Ajax error:', xhr.status, thrown, xhr.responseText ? xhr.responseText.slice(0, 500) : '');
        showToast('ইউজার তালিকা লোড করতে সমস্যা হয়েছে (ওয়াচ কনসোল)', 'error');
      }
    },
    createdRow: function (row, data, dataIndex) {
      try {
        // Add data-label attributes to each TD using header text for responsive CSS
        const headers = Array.from(document.querySelectorAll('#usersTable thead th'));
        const tds = Array.from(row.querySelectorAll('td'));
        tds.forEach((td, i) => {
          const label = headers[i] ? headers[i].textContent.trim() : '';
          td.setAttribute('data-label', label);
        });
      } catch (e) {
        // fail silently
      }
    },
    columns: [
      {
        data: null,
        render: function (data) {
          return data.name_bn || data.name || '';
        }
      },
      { data: 'email' },
      { data: 'phone' },
      { data: 'role_name' },
      {
        data: 'status',
        render: function (data) {
          return data ? '<span class="badge badge-success">সক্রিয়</span>'
            : '<span class="badge badge-danger">নিষ্ক্রিয়</span>';
        }
      },
      {
        data: null,
        render: function (data) {
              const assignBtn = CAN_ASSIGN_ROLE ? `
                  <button class="btn-icon" onclick="openAssignRoleModal(${data.id})" title="পদবী বরাদ্দ">
                    <i class="fas fa-exchange-alt"></i>
                  </button>
                ` : '';

              return `
                <div class="action-buttons">
                  <button class="btn-icon" onclick="editUser(${data.id})" title="সম্পাদনা">
                    <i class="fas fa-edit"></i>
                  </button>
                  ${assignBtn}
                  <button class="btn-icon" onclick="showDeleteModal(${data.id})" title="মুছে ফেলুন">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              `;
        }
      }
    ],
    order: [[0, 'asc']],
    language: {
      "decimal": "",
      "emptyTable": "কোন তথ্য পাওয়া যায়নি",
      "info": "মোট _TOTAL_ টি এন্ট্রির মধ্যে _START_ থেকে _END_ পর্যন্ত দেখানো হচ্ছে",
      "infoEmpty": "কোন এন্ট্রি নেই",
      "infoFiltered": "(মোট _MAX_ টি এন্ট্রি থেকে ফিল্টার করা হয়েছে)",
      "infoPostFix": "",
      "thousands": ",",
      "lengthMenu": "_MENU_ টি এন্ট্রি দেখুন",
      "loadingRecords": "লোড হচ্ছে...",
      "processing": "প্রসেস করা হচ্ছে...",
      "search": "অনুসন্ধান:",
      "zeroRecords": "কোন মিল পাওয়া যায়নি",
      "paginate": {
        "first": "প্রথম",
        "last": "শেষ",
        "next": "পরবর্তী",
        "previous": "পূর্ববর্তী"
      }
    }
  });
}

// ================= Load Roles Dropdown =================
async function loadRoles() {
  try {
    const response = await fetch('/admin/roles/data', {
      credentials: 'same-origin',
      headers: {
        'X-CSRF-TOKEN': csrfToken,
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    const data = await response.json();

    if (data.success) {
      const roleSelect = document.getElementById('role');
      if (roleSelect) {
        roleSelect.innerHTML = '<option value="">পদবী নির্বাচন করুন</option>' +
          data.roles.map(role =>
            `<option value="${role.id}">${role.name}</option>`
          ).join('');
      }

      // Also populate assign role select if present
      const assignSelect = document.getElementById('assignRoleTo');
      if (assignSelect) {
        assignSelect.innerHTML = '<option value="">পদবী নির্বাচন করুন</option>' +
          data.roles.map(role =>
            `<option value="${role.id}">${role.name}</option>`
          ).join('');
      }
    }
  } catch (err) {
    console.error('Error loading roles:', err);
    showToast('পদবী লোড করতে সমস্যা হয়েছে', 'error');
  }
}

// Load current user's permissions for UI decisions
async function loadMyPermissions() {
  try {
    const res = await fetch('/users/me/permissions', {
      credentials: 'same-origin',
      headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
    });
    const data = await res.json();
    if (data && data.success && Array.isArray(data.permissions)) {
      CAN_ASSIGN_ROLE = data.permissions.includes('assign_role');
    } else {
      CAN_ASSIGN_ROLE = false;
    }
  } catch (err) {
    console.error('Error loading my permissions:', err);
    CAN_ASSIGN_ROLE = false;
  }
}

// ================= Modal Functions =================
async function openModal(mode, userData = null) {
  const modal = document.getElementById('userModal');
  const form = document.getElementById('userForm');
  const modalTitle = document.getElementById('modalTitle');
  const passwordGroup = document.querySelector('.password-group');
  const passwordInput = document.getElementById('password');
  const passwordRequired = document.querySelector('.password-required');

  form.reset();

  // Ensure roles are loaded before showing modal so role select can be set correctly
  const roleSelect = document.getElementById('role');
  if (roleSelect && roleSelect.options.length <= 1) {
    try {
      await loadRoles();
    } catch (e) {
      console.warn('roles load failed before opening modal:', e);
    }
  }

  if (mode === 'create') {
    modalTitle.innerHTML = '<i class="fas fa-user-plus"></i> নতুন ইউজার যোগ করুন';
    document.getElementById('userId').value = '';
    passwordGroup.style.display = 'block';
    passwordRequired.style.display = 'inline';
    passwordInput.required = true;
  } else {
    modalTitle.innerHTML = '<i class="fas fa-user-edit"></i> ইউজার তথ্য সম্পাদনা';
    document.getElementById('userId').value = userData.id;
    passwordGroup.style.display = 'block';
    passwordRequired.style.display = 'none';
    passwordInput.required = false;

    // Populate form
    document.getElementById('name').value = userData.name || '';
    document.getElementById('name_bn').value = userData.name_bn || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('phone').value = userData.phone || '';
    if (roleSelect) {
      roleSelect.value = userData.role_id || '';
    }
  }

  modal.style.display = 'flex';
}

function closeModal() {
  document.getElementById('userModal').style.display = 'none';
  document.getElementById('userForm').reset();
}

// ================= User CRUD Operations =================
async function saveUser() {
  const form = document.getElementById('userForm');
  const userId = document.getElementById('userId').value;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Validate required fields
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const role_id = document.getElementById('role').value.trim();
  const password = document.getElementById('password').value;

  if (!name || !email || !role_id) {
    showToast('অনুগ্রহ করে সব প্রয়োজনীয় তথ্য পূরণ করুন', 'error');
    return;
  }

  if (!userId && !password) {
    showToast('পাসওয়ার্ড দিতে হবে', 'error');
    return;
  }

  const formData = {
    name: name,
    name_bn: document.getElementById('name_bn').value.trim(),
    email: email,
    phone: document.getElementById('phone').value.trim(),
    role_id: role_id,
    password: password
  };

  try {
    const url = userId ? `/users/${userId}` : '/users';
    const method = userId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken
      },
      credentials: 'same-origin',
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (data.success) {
      showToast(userId ? 'ইউজার আপডেট হয়েছে' : 'নতুন ইউজার যোগ করা হয়েছে', 'success');
      closeModal();
      usersTable.ajax.reload();
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error('Error saving user:', err);
    showToast(err.message || 'ইউজার সেভ করতে সমস্যা হয়েছে', 'error');
  }
}

async function editUser(id) {
  try {
    const response = await fetch(`/users/${id}`, {
      credentials: 'same-origin',
      headers: {
        'X-CSRF-TOKEN': csrfToken,
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    // guard: if response is not JSON (HTML redirect or error page), handle gracefully
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) {
      // try to parse JSON error if possible
      if (contentType.includes('application/json')) {
        const errJson = await response.json();
        throw new Error(errJson.message || 'Server error');
      } else {
        const text = await response.text();
        console.error('Non-JSON response fetching user:', text.slice(0, 500));
        throw new Error('সার্ভার থেকে অবৈধ রেসপন্স এসেছে');
      }
    }

    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Expected JSON but received:', text.slice(0, 500));
      throw new Error('সার্ভার প্রত্যাশিত JSON ফেরত দেয়নি');
    }

    const data = await response.json();
    if (data.success) {
      openModal('edit', data.user);
    } else {
      throw new Error(data.message || 'ইউজার লোড করতে সমস্যা হয়েছে');
    }
  } catch (err) {
    console.error('Error fetching user:', err);
    showToast('ইউজার তথ্য লোড করতে সমস্যা হয়েছে', 'error');
  }
}

function showDeleteModal(id) {
  document.getElementById('deleteUserId').value = id;
  document.getElementById('deleteModal').style.display = 'block';
}

function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
}

// ============ Assign Role Modal ============
function openAssignRoleModal(userId) {
  if (!CAN_ASSIGN_ROLE) {
    showToast('আপনার কাছে পদবী বরাদ্দ করার অনুমতি নেই', 'error');
    return;
  }
  document.getElementById('assignUserId').value = userId;
  // Fetch user to show current role
  fetch(`/users/${userId}`, { 
    credentials: 'same-origin', 
    headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } 
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        document.getElementById('assignRoleFrom').textContent = data.user.role_name || '-';
        const assignSelect = document.getElementById('assignRoleTo');
        if (assignSelect) assignSelect.value = data.user.role_id || '';
        document.getElementById('assignRoleModal').style.display = 'block';
      } else {
        showToast('ইউজার তথ্য লোড করতে সমস্যা হয়েছে', 'error');
      }
    })
    .catch(err => {
      console.error('Error loading user for assign role:', err);
      showToast('ইউজার তথ্য লোড করতে সমস্যা হয়েছে', 'error');
    });
}

function closeAssignRoleModal() {
  document.getElementById('assignRoleModal').style.display = 'none';
  document.getElementById('assignUserId').value = '';
}

async function confirmAssignRole() {
  const userId = document.getElementById('assignUserId').value;
  const roleId = document.getElementById('assignRoleTo').value;

  if (!roleId) {
    showToast('অনুগ্রহ করে একটি পদবী নির্বাচন করুন', 'error');
    return;
  }

  try {
    const response = await fetch(`/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken
      },
      credentials: 'same-origin',
      body: JSON.stringify({ role_id: roleId })
    });

    const data = await response.json();
    if (data.success) {
      showToast('পদবী সফলভাবে বাড়ানো হয়েছে', 'success');
      closeAssignRoleModal();
      if (usersTable && usersTable.ajax) usersTable.ajax.reload();
    } else {
      throw new Error(data.message || 'Assign failed');
    }
  } catch (err) {
    console.error('Error assigning role:', err);
    showToast(err.message || 'পদবী বরাদ্দ করতে সমস্যা হয়েছে', 'error');
  }
}

async function confirmDelete() {
  const userId = document.getElementById('deleteUserId').value;

  try {
    const response = await fetch(`/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-TOKEN': csrfToken
      },
      credentials: 'same-origin'
    });

    const data = await response.json();

    if (data.success) {
      showToast('ইউজার মুছে ফেলা হয়েছে', 'success');
      closeDeleteModal();
      usersTable.ajax.reload();
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    console.error('Error deleting user:', err);
    showToast(err.message || 'ইউজার মুছে ফেলতে সমস্যা হয়েছে', 'error');
  }
}

// ================= Utility Functions =================
function togglePassword() {
  const passwordInput = document.getElementById('password');
  const icon = document.querySelector('.toggle-password i');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    passwordInput.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }, 100);
}

// At the end expose functions used by inline onclick attributes so they are always available
// (some browsers/pages run scripts in strict scopes; ensure global access)
window.openModal = openModal;
window.closeModal = closeModal;
window.saveUser = saveUser;
window.editUser = editUser;
window.showDeleteModal = showDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.togglePassword = togglePassword;
window.openAssignRoleModal = openAssignRoleModal;
window.closeAssignRoleModal = closeAssignRoleModal;
window.confirmAssignRole = confirmAssignRole;