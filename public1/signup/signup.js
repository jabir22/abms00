// signup.js

const form = document.getElementById('signupForm');

form.addEventListener('submit', (e) => {
  e.preventDefault(); // prevent default submit to do validation first

  clearErrors();

  const fullname = form.fullname.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;

  let isValid = true;

  if (fullname.length < 3) {
    showError('fullname', 'Full name must be at least 3 characters');
    isValid = false;
  }

  if (!validateEmail(email)) {
    showError('email', 'Please enter a valid email');
    isValid = false;
  }

  if (!validatePhone(phone)) {
    showError('phone', 'Please enter a valid Bangladeshi phone number');
    isValid = false;
  }

  if (password.length < 6) {
    showError('password', 'Password must be at least 6 characters');
    isValid = false;
  }

  if (password !== confirmPassword) {
    showError('confirmPassword', 'Passwords do not match');
    isValid = false;
  }

  if (isValid) {
    form.submit();  // submit if all good
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
  errors.forEach((el) => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

function validateEmail(email) {
  // simple regex for email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  // Bangladeshi phone number regex: +8801XXXXXXXXX or 01XXXXXXXXX
  return /^(\+?88)?01[3-9]\d{8}$/.test(phone);
}
