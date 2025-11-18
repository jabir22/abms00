const form = document.getElementById("accountForm");

    form.addEventListener("submit", function(e) {
      e.preventDefault();

      // ফর্ম থেকে ডাটা নেওয়া
      const name = document.getElementById("accName").value;
      const type = document.getElementById("accType").value;
      const balance = document.getElementById("accBalance").value;

      // পুরানো ডাটা আনো LocalStorage থেকে
      let accounts = JSON.parse(localStorage.getItem("accounts")) || [];

      // নতুন account object বানাও
      accounts.push({ name, type, balance });

      // LocalStorage এ সেট করো
      localStorage.setItem("accounts", JSON.stringify(accounts));

      // Accounts list পেজে পাঠাও
      window.location.href = "accounts.html";
    });