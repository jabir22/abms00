const form = document.getElementById('loginForm');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  clearErrors();

  const username = form.username.value.trim();
  const password = form.password.value;

  let isValid = true;

  if (username.length < 3) {
    showError('username', 'Username must be at least 3 characters');
    isValid = false;
  }

  if (password.length < 4) {
    showError('password', 'Password must be at least 4 characters');
    isValid = false;
  }

  if (isValid) {
    form.submit();
  }
});

function showError(fieldId, message) {
  const inputGroup = document.getElementById(fieldId).parentElement;
  const errorSpan = inputGroup.querySelector('.error');
  errorSpan.textContent = message;
  errorSpan.style.display = 'block';
}

function clearErrors() {
  const errors = form.querySelectorAll('.error');
  errors.forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}
