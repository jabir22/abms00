// ================= Initial User Data =================
let userData = {
  profile_photo: document.getElementById("profilePhoto").src,
  name_en: document.getElementById("nameEnCell").innerText,
  name_bn: document.getElementById("nameBnCell").innerText,
  father_name: document.getElementById("fatherCell").innerText,
  mother_name: document.getElementById("motherCell").innerText,
  dob: document.getElementById("dobCell").innerText,
  gender: document.getElementById("genderCell").innerText,
  email: document.getElementById("emailCell").innerText,
  phone: document.getElementById("displayPhone").innerText,
  role: document.getElementById("displayRole").innerText,
  role_id: document.getElementById("displayRole").dataset.roleId,
  permanent_address: document.getElementById("permanentAddress").innerText,
  current_address: document.getElementById("currentAddress").innerText,
};

// ================= Calculate Profile Completeness =================
function calculateProfileCompleteness() {
  const requiredFields = [
    'name_en', 'name_bn', 'father_name', 'mother_name',
    'dob', 'gender', 'email', 'phone',
    'permanent_address', 'current_address'
  ];

  let completedFields = 0;
  requiredFields.forEach(field => {
    const value = userData[field];
    if (value && value.trim() !== "" && !value.includes("প্রয়োজন")) {
      completedFields++;
    }
  });

  const percentage = Math.round((completedFields / requiredFields.length) * 100);

  // Update UI
  const completenessElement = document.getElementById("profileCompleteness");
  if (completenessElement) {
    completenessElement.innerText = percentage + "%";
  }

  return percentage;
}

// ================= Tab Switching =================
function switchTab(tabName) {
  // Hide all tabs
  const tabs = document.querySelectorAll('.profile-tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));

  // Remove active class from all buttons
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  // Show selected tab
  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }

  // Add active class to clicked button
  event.target.closest('.tab-btn').classList.add('active');
}

// ================= Populate DOM =================
function populateProfile() {
  document.getElementById("profilePhoto").src = userData.profile_photo;
  document.getElementById("displayName").innerText = (userData.name_bn || "(নাম প্রয়োজন)").trim();
  document.getElementById("displayEmail").innerText = (userData.email || "(ইমেইল প্রয়োজন)").trim();
  document.getElementById("displayRole").innerText = (userData.role || "(পদবি প্রয়োজন)").trim();
  document.getElementById("displayRole").dataset.roleId = userData.role_id || "";
  document.getElementById("displayPhone").innerText = (userData.phone || "(মোবাইল নম্বর প্রয়োজন)").trim();

  document.getElementById("nameEnCell").textContent = (userData.name_en || '').trim();
  if (!userData.name_en) document.getElementById("nameEnCell").innerHTML = '<span class="required-field">ইংরেজি নাম প্রয়োজন</span>';

  document.getElementById("nameBnCell").textContent = (userData.name_bn || '').trim();
  if (!userData.name_bn) document.getElementById("nameBnCell").innerHTML = '<span class="required-field">বাংলা নাম প্রয়োজন</span>';

  document.getElementById("fatherCell").textContent = (userData.father_name || '').trim();
  if (!userData.father_name) document.getElementById("fatherCell").innerHTML = '<span class="required-field">পিতার নাম প্রয়োজন</span>';

  document.getElementById("motherCell").textContent = (userData.mother_name || '').trim();
  if (!userData.mother_name) document.getElementById("motherCell").innerHTML = '<span class="required-field">মাতার নাম প্রয়োজন</span>';

  document.getElementById("dobCell").textContent = (userData.dob || '').trim();
  if (!userData.dob) document.getElementById("dobCell").innerHTML = '<span class="required-field">জন্মতারিখ প্রয়োজন</span>';

  document.getElementById("genderCell").textContent = (userData.gender || '').trim();
  if (!userData.gender) document.getElementById("genderCell").innerHTML = '<span class="required-field">লিঙ্গ নির্বাচন করুন</span>';

  document.getElementById("emailCell").textContent = (userData.email || '').trim();
  if (!userData.email) document.getElementById("emailCell").innerHTML = '<span class="required-field">ইমেইল প্রয়োজন</span>';

  document.getElementById("phoneCell").textContent = (userData.phone || '').trim();
  if (!userData.phone) document.getElementById("phoneCell").innerHTML = '<span class="required-field">মোবাইল নম্বর প্রয়োজন</span>';

  document.getElementById("permanentAddress").textContent = (userData.permanent_address || '').trim();
  if (!userData.permanent_address) document.getElementById("permanentAddress").innerHTML = '<span class="required-field">স্থায়ী ঠিকানা প্রয়োজন</span>';

  document.getElementById("currentAddress").textContent = (userData.current_address || '').trim();
  if (!userData.current_address) document.getElementById("currentAddress").innerHTML = '<span class="required-field">বর্তমান ঠিকানা প্রয়োজন</span>';

  // Calculate and update profile completeness
  calculateProfileCompleteness();
}

// ================= Modal Handling =================
let currentField = null;

function handleKeyPress(e) {
  const saveBtn = document.querySelector('.modal-save');
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!saveBtn.disabled) saveModal();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeModal();
  }
}

function openModal(field) {
  currentField = field;
  const modalOverlay = document.getElementById("modalOverlay");
  const modalBox = document.getElementById("genericModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");

  modalOverlay.classList.add("show");
  modalBox.classList.add("show");

  let value = userData[field] || "";

  switch (field) {
    case "profile_photo":
      modalTitle.innerHTML = '<i class="fas fa-camera"></i> প্রোফাইল ছবি পরিবর্তন';
      modalBody.innerHTML = `
        <div class="modal-input-group">
          <label for="modalInput"><i class="fas fa-image"></i> ছবি নির্বাচন করুন</label>
          <input type="file" id="modalInput" accept="image/*">
        </div>
      `;
      break;

    case "password":
      modalTitle.innerHTML = '<i class="fas fa-lock"></i> পাসওয়ার্ড পরিবর্তন';
      modalBody.innerHTML = `
        <div class="modal-input-group">
          <label for="modalInput"><i class="fas fa-key"></i> নতুন পাসওয়ার্ড</label>
          <input type="password" id="modalInput" placeholder="নতুন পাসওয়ার্ড (৬+ অক্ষর)">
        </div>
      `;
      break;

    case "gender":
      modalTitle.innerHTML = '<i class="fas fa-venus-mars"></i> লিঙ্গ নির্বাচন';
      modalBody.innerHTML = `
        <div class="modal-input-group">
          <label for="modalInput"><i class="fas fa-venus-mars"></i> লিঙ্গ</label>
          <select id="modalInput">
            <option value="">লিঙ্গ নির্বাচন করুন</option>
            <option value="পুরুষ" ${value === "পুরুষ" ? "selected" : ""}>পুরুষ</option>
            <option value="মহিলা" ${value === "মহিলা" ? "selected" : ""}>মহিলা</option>
            <option value="অন্যান্য" ${value === "অন্যান্য" ? "selected" : ""}>অন্যান্য</option>
          </select>
        </div>
      `;
      break;

    case "dob":
      modalTitle.innerHTML = '<i class="fas fa-birthday-cake"></i> জন্মতারিখ';
      modalBody.innerHTML = `
        <div class="modal-input-group">
          <label for="modalInput"><i class="fas fa-calendar-alt"></i> জন্মতারিখ নির্বাচন করুন</label>
          <input type="date" id="modalInput" value="${value}">
        </div>
      `;
      break;

    case "role":
      modalTitle.innerHTML = '<i class="fas fa-briefcase"></i> পদবি নির্বাচন';
      modalBody.innerHTML = `
        <div class="modal-input-group">
          <label for="modalInput"><i class="fas fa-briefcase"></i> পদবি</label>
          <select id="modalInput"><option value="">লোড হচ্ছে...</option></select>
        </div>
      `;
      const _csrf_for_role_fetch = document.querySelector('meta[name="csrf-token"]') ? document.querySelector('meta[name="csrf-token"]').getAttribute('content') : null;
      fetch('/profile/roles/list', { credentials: 'same-origin', headers: { 'Accept': 'application/json', ...(_csrf_for_role_fetch ? { 'X-CSRF-TOKEN': _csrf_for_role_fetch } : {}) } })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const select = document.getElementById('modalInput');
            select.innerHTML = '<option value="">পদবি নির্বাচন করুন</option>' +
              data.roles.map(role => `<option value="${role.id}" ${role.id == userData.role_id ? 'selected' : ''}>${role.name}</option>`).join('');
          }
        }).catch(err => console.error(err));
      break;

    default:
      let placeholder = "";
      let inputType = "text";
      let label = field.replace(/_/g, ' ').charAt(0).toUpperCase() + field.replace(/_/g, ' ').slice(1);

      if (field.includes("name")) {
        placeholder = field.includes("en") ? "John Doe" : "জন ডো";
        label = field.includes("en") ? "নাম (ইংরেজি)" : "নাম (বাংলা)";
      }
      if (field.includes("address")) {
        placeholder = field.includes("permanent") ? "গ্রাম/মহল্লা, ডাকঘর, থানা, জেলা" : "বাসা/হোল্ডিং, রোড, এলাকা";
        label = field.includes("permanent") ? "স্থায়ী ঠিকানা" : "বর্তমান ঠিকানা";
      }
      if (field === "father_name") {
        label = "পিতার নাম";
        placeholder = "পিতার নাম বাংলায় লিখুন";
      }
      if (field === "mother_name") {
        label = "মাতার নাম";
        placeholder = "মাতার নাম বাংলায় লিখুন";
      }
      if (field === "email") {
        placeholder = "example@domain.com";
        inputType = "email";
        label = "ইমেইল ঠিকানা";
      }
      if (field === "phone") {
        placeholder = "01XXXXXXXXX";
        inputType = "tel";
        label = "মোবাইল নম্বর";
      }

      let icon = "fa-user";
      if (field.includes("address")) icon = "fa-map-marker-alt";
      if (field.includes("email")) icon = "fa-envelope";
      if (field.includes("phone")) icon = "fa-phone";
      if (field.includes("name")) icon = "fa-heading";

      modalTitle.innerHTML = `<i class="fas ${icon}"></i> ${label}`;
      modalBody.innerHTML = `
        <div class="modal-input-group">
          <label for="modalInput"><i class="fas ${icon}"></i> ${label}</label>
          <input type="${inputType}" id="modalInput" value="${value}" placeholder="${placeholder}">
        </div>
      `;

      if (field === "phone") {
        const phoneInput = document.getElementById("modalInput");
        phoneInput.maxLength = 11;
        phoneInput.oninput = function () { this.value = this.value.replace(/[^0-9]/g, ''); };
        phoneInput.addEventListener('input', function () {
          const isValid = this.value.length === 11 && this.value.startsWith('01');
          this.classList.toggle('invalid', !isValid);
          document.querySelector('.modal-save').disabled = !isValid;
        });
      }
      break;
  }

  const modalInput = modalBody.querySelector('input, textarea, select');
  if (modalInput) {
    modalInput.addEventListener('keydown', handleKeyPress);
    setTimeout(() => modalInput.focus(), 100);
  }
}

// ================= Close Modal =================
async function closeModal() {
  const modalOverlay = document.getElementById("modalOverlay");
  const modalBox = document.getElementById("genericModal");
  const modalBody = document.getElementById("modalBody");
  const modalInput = modalBody.querySelector('input, textarea, select');
  if (modalInput) modalInput.removeEventListener('keydown', handleKeyPress);

  modalOverlay.classList.remove("show");
  modalBox.classList.remove("show");
}

// ================= Input Validation =================
function validateInput(field, value) {
  switch (field) {
    case 'name_en':
      if (!value.trim()) return 'নাম খালি রাখা যাবে না';
      if (!/^[A-Za-z\s.'-]+$/.test(value)) return 'ইংরেজি নাম সঠিক নয়';
      return true;
    case 'name_bn':
    case 'father_name':
    case 'mother_name':
      if (!value.trim()) return 'নাম খালি রাখা যাবে না';
      if (!/^[\u0980-\u09FF\s.'-]+$/.test(value)) return 'বাংলা নাম সঠিক নয়';
      return true;
    case 'email':
      if (!value.trim()) return 'ইমেইল খালি';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'ইমেইল সঠিক নয়';
      return true;
    case 'phone':
      if (!/^01[0-9]{9}$/.test(value)) return 'মোবাইল নম্বর সঠিক নয়';
      return true;
    case 'dob':
      if (!value) return 'জন্মতারিখ খালি';
      const age = Math.floor((new Date() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) return 'বয়স কমপক্ষে ১৮ বছর হতে হবে';
      return true;
    case 'permanent_address':
    case 'current_address':
      if (!value.trim()) return 'ঠিকানা খালি';
      if (value.length < 10) return 'ঠিকানা খুব ছোট';
      return true;
    case 'password':
      if (!value.trim() || value.length < 6) return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে';
      return true;
    default:
      return true;
  }
}

// ================= Toast Notification =================
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '1'; }, 50);
  setTimeout(() => { toast.style.opacity = '0'; toast.addEventListener('transitionend', () => toast.remove()); }, 3500);
}

// ================= Confirm Popup =================
function showConfirmPopup(field, value, validationResult) {
  return new Promise(resolve => {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'confirm-overlay';
    const errorMessage = validationResult !== true ? validationResult : '';

    modalOverlay.innerHTML = `
      <div class="confirm-box ${errorMessage ? 'shake' : ''}">
        <h3><i class="fas fa-check-circle"></i> নিশ্চিত করুন</h3>
        <div class="confirm-content">
          <p><strong>${document.getElementById("modalTitle").innerText}:</strong></p>
          <p class="confirm-value">${value}</p>
          ${errorMessage ? `<div class="validation-error"><p class="error-title"><i class="fas fa-times-circle"></i> ${errorMessage}</p></div>` : ''}
        </div>
        <div class="confirm-buttons">
          <button class="btn-cancel"><i class="fas fa-times-circle"></i> বাতিল</button>
          <button class="btn-confirm" ${validationResult !== true ? 'disabled' : ''}><i class="fas fa-check-circle"></i> নিশ্চিত</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);

    modalOverlay.querySelector('.btn-confirm').addEventListener('click', () => { document.body.removeChild(modalOverlay); resolve(true); });
    modalOverlay.querySelector('.btn-cancel').addEventListener('click', () => { document.body.removeChild(modalOverlay); resolve(false); });
  });
}

// ================= Save Modal Data =================
async function saveModal() {
  const input = document.getElementById("modalInput");
  const value = input.type === 'file' ? input.files[0] : input.value;
  const userId = window.location.pathname.split("/").pop();
  const csrfMeta = document.querySelector('meta[name="csrf-token"]');
  const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : null;

  // ===== Password Update =====
  if (currentField === "password") {
    const validation = validateInput(currentField, value);
    if (validation !== true) { showToast(validation, 'error'); return; }
    try {
      const res = await fetch(`/profile/update-password/${userId}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken },
        body: JSON.stringify({ password: value })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✓ পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!', 'success');
        await new Promise(resolve => setTimeout(resolve, 500));
        closeModal();
      }
      else showToast(data.message || 'পাসওয়ার্ড পরিবর্তন করা যায়নি', 'error');
    } catch (err) {
      console.error(err);
      showToast('পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে', 'error');
    }
    return;
  }

  // ===== Profile Photo Update =====
  if (currentField === "profile_photo" && value) {
    const formData = new FormData();
    formData.append("profile_photo", value);
    try {
      const res = await fetch(`/profile/upload-photo/${userId}`, { method: "POST", credentials: 'same-origin', body: formData, headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json' } });
      const data = await res.json();
      if (data.success) {
        userData.profile_photo = data.profile_photo;
        populateProfile();
        closeModal();
        showToast("✓ প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে!", 'success');
      }
    } catch (err) {
      console.error(err);
      showToast("প্রোফাইল ছবি আপডেট করা যায়নি", 'error');
    }
    return;
  }

  // ===== Other Fields =====
  const validation = validateInput(currentField, value);
  const confirmed = await showConfirmPopup(currentField, value, validation === true ? true : validation);
  if (!confirmed) return;
  if (validation !== true) return;

  // Update local state
  if (currentField === "role") {
    const selectedOption = input.options[input.selectedIndex];
    userData.role = selectedOption.text;
    userData.role_id = selectedOption.value;
  } else {
    userData[currentField] = value;
  }

  populateProfile();

  // Send update request
  try {
    // Only send fields that can be updated
    const payload = {
      name_en: userData.name_en,
      name_bn: userData.name_bn,
      father_name: userData.father_name,
      mother_name: userData.mother_name,
      dob: userData.dob,
      gender: userData.gender,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      permanent_address: userData.permanent_address,
      current_address: userData.current_address
    };

    const res = await fetch(`/profile/update/${userId}`, {
      method: "POST",
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': csrfToken
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      Object.assign(userData, data.user || {});
      populateProfile();
      closeModal();
      showToast('✓ তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!', 'success');
    } else throw new Error(data.message || 'তথ্য সংরক্ষণ করা যায়নি');
  } catch (err) {
    console.error(err);
    showToast('তথ্য সংরক্ষণ করা যায়নি! দয়া করে আবার চেষ্টা করুন।', 'error');
  }
}

// ================= On Page Load =================
document.addEventListener("DOMContentLoaded", populateProfile);

// ================= Assigned Areas: Unassign Handler =================
document.addEventListener('click', async function (e) {
  const target = e.target.closest('.btn-unassign-area');
  if (!target) return;

  const areaId = target.dataset.areaId;
  if (!areaId) return;

  const userId = window.location.pathname.split('/').pop();
  const confirmed = confirm('এই ব্যবহারকারীর থেকে এই এরিয়া সরাতে চান?');
  if (!confirmed) return;

  const csrfMeta = document.querySelector('meta[name="csrf-token"]');
  const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : null;

  try {
    const res = await fetch('/admin/areas/remove-user', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {})
      },
      body: JSON.stringify({ areaId: areaId, userId: userId })
    });

    const data = await res.json();
    if (data.success) {
      // remove table row from DOM
      const tr = document.querySelector('tr.area-row[data-area-id="' + areaId + '"]');
      if (tr) tr.remove();

      // update count
      const countEl = document.getElementById('areasCount');
      if (countEl) {
        const current = parseInt(countEl.innerText) || 0;
        countEl.innerText = Math.max(0, current - 1);
      }

      showToast('এরিয়া সফলভাবে সরানো হয়েছে', 'success');
    } else {
      showToast(data.message || 'এরিয়া সরানো যায়নি', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('এরিয়া সরাতে সমস্যা হয়েছে', 'error');
  }
});
