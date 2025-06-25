import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaChartLine,
  FaTable,
  FaBars,
  FaTimes,
  FaDatabase,
  FaShareAlt,
} from "react-icons/fa";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Track scroll position to add shadow when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation links config
  const navLinks = [
    {
      to: "/",
      label: "Thread Dashboard",
      icon: <FaChartLine className="mr-2" />,
    },
    {
      to: "/shared-data",
      label: "Shared Data",
      icon: <FaShareAlt className="mr-2" />,
    },
    // Add more navigation links as needed
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
        scrolled ? "shadow-md bg-white" : "bg-white/90 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center text-left">
              <FaDatabase className="text-[#696fcf] h-8 w-8" />
              <span className="ml-2 text-xl font-semibold text-gray-800">
                Thread<span className="text-[#696fcf]">PY</span>
                <p className="text-sm font-normal text-gray-400">
                  Analize the thread data and generate insights.
                </p>
              </span>
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center">
            <div className="flex space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? "bg-gradient-to-r from-[#9fa0ff] to-[#696fcf] text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {link.icon} {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-[#696fcf] hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <FaTimes className="h-6 w-6" />
              ) : (
                <FaBars className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-gradient-to-r from-[#9fa0ff] to-[#696fcf] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
