document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const tableBody = document.querySelector("#suppliersTable tbody");
  const countEl = document.getElementById("supplierCount");

  // Load suppliers
  function loadSuppliers() {
    let suppliers = JSON.parse(localStorage.getItem("suppliers")) || [];
    if (tableBody) {
      tableBody.innerHTML = "";
      suppliers.forEach((sup, index) => {
        const row = `
              <tr>
                <td>${sup.name}</td>
                <td>${sup.company}</td>
                <td>${sup.phone}</td>
                <td>${sup.address}</td>
                <td>
                  <a href="supplier-details.html?index=${index}" class="btn-edit">View</a>
                  <a href="edit-supplier.html?index=${index}" class="btn-edit">Edit</a>
                  <button onclick="deleteSupplier(${index})" class="btn-delete">Delete</button>
                </td>
              </tr>
            `;

        tableBody.innerHTML += row;
      });

      if (countEl) countEl.textContent = `Total Suppliers: ${suppliers.length}`;
    }
  }

  // Save / Update supplier
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let suppliers = JSON.parse(localStorage.getItem("suppliers")) || [];

      const name = document.getElementById("supplierName").value.trim();
      const company = document.getElementById("supplierCompany").value.trim();
      const phone = document.getElementById("supplierPhone").value.trim();
      const address = document.getElementById("supplierAddress").value.trim();

      if (!name) {
        alert("Supplier name required");
        return;
      }

      // Check if we are editing
      const urlParams = new URLSearchParams(window.location.search);
      const index = urlParams.get("index");

      if (index !== null) {
        suppliers[index] = { name, company, phone, address };
      } else {
        suppliers.push({ name, company, phone, address });
      }

      localStorage.setItem("suppliers", JSON.stringify(suppliers));

      // ✅ রিডাইরেক্ট Add/Edit এর পর
      window.location.href = "suppliers.html";
    });
  }

  // Delete function (global so it works with onclick)
  window.deleteSupplier = function (index) {
    let suppliers = JSON.parse(localStorage.getItem("suppliers")) || [];
    if (confirm("Are you sure to delete this supplier?")) {
      suppliers.splice(index, 1);
      localStorage.setItem("suppliers", JSON.stringify(suppliers));
      loadSuppliers();
    }
  };

  // Pre-fill edit form
  const urlParams = new URLSearchParams(window.location.search);
  const editIndex = urlParams.get("index");
  if (editIndex !== null && form) {
    let suppliers = JSON.parse(localStorage.getItem("suppliers")) || [];
    if (suppliers[editIndex]) {
      document.getElementById("supplierName").value = suppliers[editIndex].name;
      document.getElementById("supplierCompany").value = suppliers[editIndex].company;
      document.getElementById("supplierPhone").value = suppliers[editIndex].phone;
      document.getElementById("supplierAddress").value = suppliers[editIndex].address;
    }
  }

  // Initial load
  loadSuppliers();
});
// Supplier Details page
const detailName = document.getElementById("dName");
if (detailName) {
  const urlParams = new URLSearchParams(window.location.search);
  const index = urlParams.get("index");
  let suppliers = JSON.parse(localStorage.getItem("suppliers")) || [];

  if (suppliers[index]) {
    document.getElementById("dName").textContent = suppliers[index].name;
    document.getElementById("dCompany").textContent = suppliers[index].company;
    document.getElementById("dPhone").textContent = suppliers[index].phone;
    document.getElementById("dAddress").textContent = suppliers[index].address;

    // Edit button
    document.getElementById("editBtn").href = `edit-supplier.html?index=${index}`;

    // Delete button
    document.getElementById("deleteBtn").addEventListener("click", () => {
      if (confirm("Are you sure you want to delete this supplier?")) {
        suppliers.splice(index, 1);
        localStorage.setItem("suppliers", JSON.stringify(suppliers));
        window.location.href = "suppliers.html";
      }
    });
  } else {
    document.querySelector(".main-content").innerHTML = "<p>Supplier not found!</p>";
  }
}
