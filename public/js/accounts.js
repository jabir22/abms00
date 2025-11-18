const tableBody = document.querySelector("#accountsTable tbody");
const totalBalanceEl = document.getElementById("totalBalance"); // নতুন লাইন

function loadAccounts() {
  let accounts = JSON.parse(localStorage.getItem("accounts")) || [];

  tableBody.innerHTML = "";

  let total = 0; // মোট ক্যাশ রাখার ভ্যারিয়েবল

  accounts.forEach((acc, index) => {
    total += Number(acc.balance) || 0; // সব ব্যালেন্স যোগ

    const row = `
      <tr>
        <td>${acc.name}</td>
        <td>${acc.type}</td>
        <td>৳ ${acc.balance}</td>
        <td>
          <a href="account-details.html"><button class="btn-edit">View</button></a>
          <a href="edit-account.html?index=${index}"><button class="btn-edit">Edit</button></a>
        </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });

  // টোটাল আপডেট করো
  if (totalBalanceEl) {
    totalBalanceEl.textContent = `৳ ${total.toLocaleString()}`;
  }
}

loadAccounts();
