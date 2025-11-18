document.addEventListener('DOMContentLoaded', () => {
    const profileBtn = document.getElementById('profileBtn');
    if (!profileBtn) return;
    profileBtn.addEventListener('click', function () {
        window.location.href = '/profile';
    });
});