// logout.js
document.addEventListener("DOMContentLoaded", () => {
  const logoutLinks = document.querySelectorAll('#logoutBtn');

  logoutLinks.forEach(logoutLink => {
    logoutLink.addEventListener('click', async (e) => {
      e.preventDefault();

      try {
        const res = await fetch('/logout', {
          method: 'GET',
          credentials: 'same-origin'
        });

        if (res.redirected) {
          window.location.href = res.url; // redirect from server
        } else {
          window.location.href = '/login'; // fallback
        }
      } catch (err) {
        console.error('Logout error:', err);
        alert('Logout failed, please try again.');
      }
    });
  });
});
