// edit-account.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("editForm");
  const accName = document.getElementById("accName");
  const accType = document.getElementById("accType");
  const accBalance = document.getElementById("accBalance");
  const accIndex = document.getElementById("accIndex");
  const deleteBtn = document.getElementById("deleteBtn");
  // URL থেকে index পড়া
  const params = new URLSearchParams(window.location.search);
  const index = params.get("index");

  let accounts = JSON.parse(localStorage.getItem("accounts")) || [];

  if (index !== null && accounts[index]) {
    const acc = accounts[index];
    accName.value = acc.name;
    accType.value = acc.type;
    accBalance.value = acc.balance;
    accIndex.value = index;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const updated = {
      name: accName.value.trim(),
      type: accType.value,
      balance: accBalance.value,
    };

    accounts[accIndex.value] = updated;
    localStorage.setItem("accounts", JSON.stringify(accounts));

    alert("Account updated successfully ✅");
    window.location.href = "accounts.html";
  });

  
  // Delete account
  deleteBtn.addEventListener("click", () => {
    if (confirm("⚠️ Are you sure you want to delete this account?")) {
      accounts.splice(accIndex.value, 1);
      localStorage.setItem("accounts", JSON.stringify(accounts));
      alert("🗑 Account deleted successfully");
      window.location.href = "accounts.html";
    }
  });
});
