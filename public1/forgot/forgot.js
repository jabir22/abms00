const form = document.getElementById('forgotForm');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors();

  const email = form.email.value.trim();
  let isValid = true;

  if (!validateEmail(email)) {
    showError('email', 'Please enter a valid email address');
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

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
