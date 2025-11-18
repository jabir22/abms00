const form = document.getElementById('signupForm');
const errorMsg = document.getElementById('errorMsg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.textContent = '';

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const password = document.getElementById('password').value;

  try {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

    const res = await fetch('/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken
      },
      credentials: 'same-origin',
      body: JSON.stringify({ name, email, phone, password })
    });

    const text = await res.text();
    // try parse JSON if possible
    let data;
    try { data = JSON.parse(text); } catch (e) { data = null; }

    if (res.ok && data && data.success) {
      window.location.href = data.redirect || '/login';
    } else {
      // show error from JSON message or raw text
      errorMsg.textContent = (data && data.message) ? data.message : (data && data.error) ? data.error : text || 'Server error';
    }
  } catch (err) {
    console.error(err);
    errorMsg.textContent = 'Server error';
  }
});
