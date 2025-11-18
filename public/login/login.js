const form = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const submitBtn = form.querySelector('button');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.textContent = '';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';

  const phone = document.getElementById('phone').value.trim();
  const password = passwordInput.value;

  if (!phone || !password) {
    errorMsg.textContent = '⚠️ Phone and password are required.';
    resetButton();
    return;
  }

  try {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

    const res = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken
      },
      credentials: 'same-origin',
      body: JSON.stringify({ phone, password })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      document.body.style.opacity = '0.7';
      setTimeout(() => (window.location.href = data.redirect || '/dashboard'), 500);
    } else {
      errorMsg.textContent = data?.message || '❌ Invalid credentials.';
      resetButton();
    }
  } catch (err) {
    console.error(err);
    errorMsg.textContent = '🚨 Server error. Please try again later.';
    resetButton();
  }
});

togglePassword.addEventListener('click', () => {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;
  togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
});

function resetButton() {
  submitBtn.disabled = false;
  submitBtn.textContent = 'Login';
}
