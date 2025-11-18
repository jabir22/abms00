// JS/include.js
document.addEventListener("DOMContentLoaded", async () => {
  async function loadPartial(id, file) {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      const res = await fetch(file);
      if (!res.ok) throw new Error('Not found: ' + file);
      el.innerHTML = await res.text();
    } catch (err) {
      console.error('Error loading partial', file, err);
      el.innerHTML = '<div style="color:#900;padding:10px">Error loading ' + file + '</div>';
    }
  }

  await Promise.all([
    loadPartial('header-container', '../partials/header.html'),
    loadPartial('sidebar-container', '../partials/sidebar.html')
  ]);

  // now partials are in DOM
  if (typeof initApp === 'function') initApp();
  if (typeof initSidebarAccordion === 'function') initSidebarAccordion();
});
