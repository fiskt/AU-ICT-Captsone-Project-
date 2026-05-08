import React from 'react';
import { Outlet } from 'react-router-dom';

import bgImage from '../assets/background.webp';
import logo from '../assets/logo.png';

export default function Layout() {
  return (
    <div className="login-register-page">
      <div className="bg-image-wrapper">
        <img src={bgImage} alt="Tennis court background" className="bg-image" />
      </div>

      <header>
        <div className="logo-container">
          <img src={logo} alt="HPT Logo" className="logo-image" />
          <div className="logo-text">
            <span className="bold-title"></span>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}