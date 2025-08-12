import React, { useEffect, useState, useContext } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, NavLink, useLocation } from "react-router-dom";
import ThemeToggleButton from "../helper/ThemeToggleButton";
import ChatBotPopup from "../components/ChatBotPopup";
import { AuthContext } from "../App";


const MasterLayout = ({ children }) => {
  let [sidebarActive, seSidebarActive] = useState(false);
  let [mobileMenu, setMobileMenu] = useState(false);
  const location = useLocation(); // Hook to get the current route
  const { user } = useContext(AuthContext);

  // Helper for initials
  function getInitials(nameOrEmail) {
    if (!nameOrEmail) return '?';
    const parts = nameOrEmail.split('@')[0].split(/[ ._]/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }


  useEffect(() => {
    const handleDropdownClick = (event) => {
      event.preventDefault();
      const clickedLink = event.currentTarget;
      const clickedDropdown = clickedLink.closest(".dropdown");

      if (!clickedDropdown) return;

      const isActive = clickedDropdown.classList.contains("open");

      // Close all dropdowns
      const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
      allDropdowns.forEach((dropdown) => {
        dropdown.classList.remove("open");
        const submenu = dropdown.querySelector(".sidebar-submenu");
        if (submenu) {
          submenu.style.maxHeight = "0px"; // Collapse submenu
        }
      });

      // Toggle the clicked dropdown
      if (!isActive) {
        clickedDropdown.classList.add("open");
        const submenu = clickedDropdown.querySelector(".sidebar-submenu");
        if (submenu) {
          submenu.style.maxHeight = `${submenu.scrollHeight}px`; // Expand submenu
        }
      }
    };

    // Attach click event listeners to all dropdown triggers
    const dropdownTriggers = document.querySelectorAll(
      ".sidebar-menu .dropdown > a, .sidebar-menu .dropdown > Link"
    );

    dropdownTriggers.forEach((trigger) => {
      trigger.addEventListener("click", handleDropdownClick);
    });

    const openActiveDropdown = () => {
      const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
      allDropdowns.forEach((dropdown) => {
        const submenuLinks = dropdown.querySelectorAll(".sidebar-submenu li a");
        submenuLinks.forEach((link) => {
          if (
            link.getAttribute("href") === location.pathname ||
            link.getAttribute("to") === location.pathname
          ) {
            dropdown.classList.add("open");
            const submenu = dropdown.querySelector(".sidebar-submenu");
            if (submenu) {
              submenu.style.maxHeight = `${submenu.scrollHeight}px`; // Expand submenu
            }
          }
        });
      });
    };

    // Open the submenu that contains the active route
    openActiveDropdown();

    // Cleanup event listeners on unmount
    return () => {
      dropdownTriggers.forEach((trigger) => {
        trigger.removeEventListener("click", handleDropdownClick);
      });
    };
  }, [location.pathname]);

  let sidebarControl = () => {
    seSidebarActive(!sidebarActive);
  };

  let mobileMenuControl = () => {
    setMobileMenu(!mobileMenu);
  };

  return (
    <section className={mobileMenu ? "overlay active" : "overlay "}>
      {/* sidebar */}
      <aside
        className={
          sidebarActive
            ? "sidebar active "
            : mobileMenu
            ? "sidebar sidebar-open"
            : "sidebar"
        }
      >
        <button
          onClick={mobileMenuControl}
          type='button'
          className='sidebar-close-btn'
        >
          <Icon icon='radix-icons:cross-2' />
        </button>
        <div>
          <Link to='/' className='sidebar-logo'>
            <img
              src='assets/images/logo.png'
              alt='site logo'
              className='light-logo'
            />
            <img
              src='assets/images/logo-light.png'
              alt='site logo'
              className='dark-logo'
            />
            <img
              src='assets/images/logo-icon.png'
              alt='site logo'
              className='logo-icon'
            />
          </Link>
        </div>
        <div className='sidebar-menu-area'>
          <ul className='sidebar-menu' id='sidebar-menu'>
            <li>
          <NavLink
                    to='/dashboard'
                    cclassName={(navData) => (navData.isActive ? "active-page" : "")}
                    >
                      <Icon icon='solar:calendar-outline' className='menu-icon' />
                    <span>Dashboard</span>
                  </NavLink></li>

          
           
            <li>
              <NavLink
                to='/calendar-main'
                className={(navData) => (navData.isActive ? "active-page" : "")}
              >
                <Icon icon='solar:calendar-outline' className='menu-icon' />
                <span>Calendar</span>
              </NavLink>
            </li>
          
            

            
            

            <li>
          <NavLink
                    to='/form-validation'
                    cclassName={(navData) => (navData.isActive ? "active-page" : "")}
                    >
                      <Icon icon='solar:calendar-outline' className='menu-icon' />
                    <span>Insert records</span>
                  </NavLink></li>


            {/* Table Dropdown */}
            <li className='dropdown'>
              <Link to='#'>
                <Icon icon='mingcute:storage-line' className='menu-icon' />
                <span>Transactions</span>
              </Link>
              <ul className='sidebar-submenu'>
                <li>
                  <NavLink
                    to='/table-basic'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-primary-600 w-auto' />{" "}
                    View recodrs
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to='/table-data'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-warning-main w-auto' />{" "}
                    Edit records
                  </NavLink>
                </li>
              </ul>
            </li>

            {/* Chart Dropdown */}
            <li className='dropdown'>
              <Link to='#'>
                <Icon icon='solar:pie-chart-outline' className='menu-icon' />
                <span>Data Visualization</span>
              </Link>
              <ul className='sidebar-submenu'>
                <li>
                  <NavLink
                    to='/line-chart'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-danger-main w-auto' />{" "}
                    Line Chart
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to='/column-chart'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-warning-main w-auto' />{" "}
                    Column Chart
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to='/pie-chart'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    <i className='ri-circle-fill circle-icon text-success-main w-auto' />{" "}
                    Pie Chart
                  </NavLink>
                  <div style={{ position: 'relative', zIndex: 9999 }}>
<ChatBotPopup />
</div> 
                </li>
              </ul>
            </li>

            
            

            
            
          
      
        
          
            

           
             
          </ul>
        </div>
      </aside>

      <main
        className={sidebarActive ? "dashboard-main active" : "dashboard-main"}
      >
        <div className='navbar-header'>
          <div className='row align-items-center justify-content-between'>
            <div className='col-auto'>
              <div className='d-flex flex-wrap align-items-center gap-4'>
                <button
                  type='button'
                  className='sidebar-toggle'
                  onClick={sidebarControl}
                >
                  {sidebarActive ? (
                    <Icon
                      icon='iconoir:arrow-right'
                      className='icon text-2xl non-active'
                    />
                  ) : (
                    <Icon
                      icon='heroicons:bars-3-solid'
                      className='icon text-2xl non-active '
                    />
                  )}
                </button>
                <button
                  onClick={mobileMenuControl}
                  type='button'
                  className='sidebar-mobile-toggle'
                >
                  <Icon icon='heroicons:bars-3-solid' className='icon' />
                </button>
                <form className='navbar-search'>
                  <input type='text' name='search' placeholder='Search' />
                  <Icon icon='ion:search-outline' className='icon' />
                </form>
              </div>
            </div>
            <div className='col-auto d-flex align-items-center gap-4'>
              {/* Profile dropdown start */}
              <div className='dropdown'>
                <button
                  className='d-flex justify-content-center align-items-center rounded-circle'
                  type='button'
                  data-bs-toggle='dropdown'
                >
                  {user && user.profile_image ? (
                    <img
                      src={`data:image/png;base64,${user.profile_image}`}
                      alt='user'
                      className='w-40-px h-40-px object-fit-cover rounded-circle'
                    />
                  ) : (
                    <span className='w-40-px h-40-px bg-info-subtle text-info-main rounded-circle d-flex justify-content-center align-items-center flex-shrink-0 fw-bold' style={{ fontSize: 18 }}>
                      {/* Show only first letter of username or email for avatar, capitalized */}
                      {((user?.username || user?.email || '?')[0] || '').toUpperCase()}
                    </span>
                  )}
                </button>
                <div className='dropdown-menu to-top dropdown-menu-sm'>
                  <div className='py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2'>
                    <div>
                      <h6 className='text-lg text-primary-light fw-semibold mb-2'>
                        {/* Show only first 10 letters of username or email */}
                        {(user?.username || user?.email || 'User').substring(0, 10)}
                      </h6>
                      {user?.role && (
                        <span className='text-secondary-light fw-medium text-sm'>
                          {user.role}
                        </span>
                      )}
                    </div>
                    <button type='button' className='hover-text-danger'>
                      <Icon
                        icon='radix-icons:cross-1'
                        className='icon text-xl'
                      />
                    </button>
                  </div>
                  <ul className='to-top-list'>
                    <li>
                      <Link
                        className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'
                        to='/view-profile'
                      >
                        <Icon
                          icon='solar:user-linear'
                          className='icon text-xl'
                        />{" "}
                        My Profile
                      </Link>
                    </li>
                    <li>
                      <button
                        className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-danger d-flex align-items-center gap-3'
                        onClick={async () => {
                          try {
                            await fetch('http://localhost:5000/api/logout', {
                              method: 'POST',
                              credentials: 'include'
                            });
                            window.location.href = '/';
                          } catch (error) {
                            console.error('Logout failed:', error);
                          }
                        }}
                        style={{ background: 'transparent', border: 'none', width: '100%' }}
                      >
                        <Icon icon='lucide:power' className='icon text-xl' />
                        Log Out
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              {/* Profile dropdown end */}
            </div>
          </div>
        </div>

        {/* dashboard-main-body */}
        <div className='dashboard-main-body'>{children}</div>

        {/* Footer section */}
        <footer className='d-footer'>
          <div className='row align-items-center justify-content-between'>
            <div className='col-auto'>
              <p className='mb-0'>© 2024 | All Rights Reserved.</p>
            </div>
            <div className='col-auto'>
              <p className='mb-0'>
                Made by <span className='text-primary-600'>Theekshana Nadun</span>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </section>
  );
};

export default MasterLayout;
