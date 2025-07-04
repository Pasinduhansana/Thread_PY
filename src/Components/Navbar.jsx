import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaChartLine,
  FaTable,
  FaBars,
  FaTimes,
  FaDatabase,
  FaShareAlt,
  FaDashcube,
  FaAlgolia,
  FaChartBar,
  FaBookOpen,
} from "react-icons/fa";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();

  // Track scroll position to add shadow when scrolled and hide/show navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Determine if we should show or hide the navbar
      if (currentScrollY > lastScrollY && currentScrollY > 150) {
        // Scrolling down & past threshold - hide navbar
        setVisible(false);
      } else {
        // Scrolling up or at top - show navbar
        setVisible(true);
      }

      // Update lastScrollY
      setLastScrollY(currentScrollY);

      // Apply shadow effect
      setScrolled(currentScrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Navigation links config
  const navLinks = [
    {
      to: "/supplier-dashboard",
      label: "Supplier Dashboard",
      icon: <FaChartBar className="mr-2" />,
    },
    {
      to: "/",
      label: "Thread Dashboard",
      icon: <FaChartLine className="mr-2" />,
    },
    {
      to: "/rop-thread",
      label: "ROP Thread",
      icon: <FaBookOpen className="mr-2" />,
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
      className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300
        ${
          scrolled
            ? "backdrop-blur-lg bg-white/70"
            : "backdrop-blur-md bg-white/50"
        } 
        ${visible ? "translate-y-0" : "-translate-y-full"}
        border-b border-white/20 shadow-sm`}
    >
      <div className="mx-10px px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center text-left">
              <FaDatabase className="text-[#696fcf] h-8 w-8 filter drop-shadow-md" />
              <span className="ml-2 text-xl font-semibold text-gray-800">
                Thread<span className="text-[#696fcf]">PY</span>
                <p className="text-sm font-normal text-gray-500">
                  Analyze the thread data and generate insights.
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
                      ? "bg-gradient-to-r from-[#9fa0ff]/90 to-[#696fcf]/90 text-white backdrop-blur-md shadow-md"
                      : "text-gray-700 hover:bg-white/30 hover:backdrop-blur-lg"
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
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-[#696fcf] hover:bg-white/30"
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
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 backdrop-blur-xl bg-white/80 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-gradient-to-r from-[#9fa0ff]/90 to-[#696fcf]/90 text-white"
                  : "text-gray-700 hover:bg-white/50"
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
