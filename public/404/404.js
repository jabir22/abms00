const countdownEl = document.getElementById('countdown');
let timeLeft = 5;

const timer = setInterval(() => {
  timeLeft--;
  countdownEl.textContent = timeLeft;
  if (timeLeft <= 0) {
    clearInterval(timer);
    window.location.href = '/';
  }
}, 1000);
