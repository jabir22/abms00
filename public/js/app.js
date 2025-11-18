// app.js
document.addEventListener("DOMContentLoaded", () => {
  const layout = document.querySelector('.layout');
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  const profileMenu = document.querySelector('.profile-menu');
  const profileName = document.querySelector('.profile-name');
  const dropdown = document.querySelector('.profile-menu .dropdown');
  const breakpoint = 900;

  // ===== Utility =====
  const isMobile = () => window.innerWidth <= breakpoint;

  // ===== Sidebar =====
  const closeMobileSidebar = () => sidebar.classList.remove('sidebar-open');

  const toggleSidebar = () => {
    if (isMobile()) {
      sidebar.classList.toggle('sidebar-open');
      layout.classList.remove('sidebar-collapsed');
    } else {
      const collapsed = layout.classList.toggle('sidebar-collapsed');
      localStorage.setItem('bh_sidebarCollapsed', collapsed ? 'true' : 'false');
      sidebar.classList.remove('sidebar-open');
    }
  };

  // restore collapsed state
  if (localStorage.getItem('bh_sidebarCollapsed') === 'true') {
    layout.classList.add('sidebar-collapsed');
  }

  // ===== Profile Dropdown =====
  const toggleProfileDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling to document
    dropdown && dropdown.classList.toggle('open');
  };
  const closeProfileDropdown = () => dropdown && dropdown.classList.remove('open');

  // ===== Anywhere Click =====
  const handleDocumentClick = (e) => {
    if (dropdown && !profileMenu.contains(e.target)) closeProfileDropdown();
    if (sidebar && sidebar.classList.contains('sidebar-open')) {
      if (!sidebar.contains(e.target) && toggleBtn && !toggleBtn.contains(e.target)) {
        closeMobileSidebar();
      }
    }
  };

  const handleEsc = (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closeProfileDropdown();
      closeMobileSidebar();
    }
  };

  // ===== Sidebar active link =====
  const setActiveSidebarLink = () => {
    const links = document.querySelectorAll('.sidebar a');
    const current = window.location.pathname.split('/').pop() || 'index.html';
    links.forEach(a => {
      const href = a.getAttribute('href') || '';
      const target = href.split('/').pop();
      if (target === current) a.classList.add('active');
      else a.classList.remove('active');
    });
  };

  // ===== Attach Events =====
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleSidebar);
    toggleBtn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSidebar();
      }
    });
  }

  if (profileName) {
    profileName.addEventListener('click', toggleProfileDropdown);
    profileName.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleProfileDropdown(e);
      }
    });
  }

  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keydown', handleEsc);
  window.addEventListener('resize', () => { if (!isMobile()) closeMobileSidebar(); });
  setActiveSidebarLink();

  // ===== Sidebar Accordion =====
  const initSidebarAccordion = () => {
    const toggles = document.querySelectorAll('.submenu-toggle');
    if (!toggles) return;

    const openSubmenu = (parent, submenu) => {
      parent.classList.add('open');
      const btn = parent.querySelector('.submenu-toggle');
      if (btn) btn.setAttribute('aria-expanded', 'true');
      submenu.style.display = 'block';
      submenu.style.maxHeight = submenu.scrollHeight + 'px';
    };

    const closeSubmenu = (parent, submenu) => {
      parent.classList.remove('open');
      const btn = parent.querySelector('.submenu-toggle');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      submenu.style.maxHeight = submenu.scrollHeight + 'px';
      requestAnimationFrame(() => submenu.style.maxHeight = '0px');
      submenu.addEventListener('transitionend', function onEnd(e) {
        if (e.propertyName === 'max-height' && !parent.classList.contains('open')) {
          submenu.style.display = 'none';
          submenu.removeEventListener('transitionend', onEnd);
        }
      });
    };

    const closeOtherSubmenus = (exceptParent) => {
      document.querySelectorAll('.has-sub.open').forEach(p => {
        if (p !== exceptParent) {
          const sm = p.querySelector('.submenu');
          if (sm) closeSubmenu(p, sm);
        }
      });
    };

    document.querySelectorAll('.submenu').forEach(sm => {
      sm.style.display = 'none';
      sm.style.maxHeight = '0px';
    });

    toggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const parent = btn.closest('.has-sub');
        if (!parent) return;
        const submenu = parent.querySelector('.submenu');
        if (!submenu) return;

        if (parent.classList.contains('open')) closeSubmenu(parent, submenu);
        else {
          closeOtherSubmenus(parent);
          openSubmenu(parent, submenu);
        }
      });

      btn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });
  };

  initSidebarAccordion();
});
