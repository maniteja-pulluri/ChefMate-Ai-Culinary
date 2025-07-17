// src/components/DashboardSidebar.jsx

import "../styles/DashboardSidebar.css";
import chefMateLogo from "../assets/img/logo/logo2.png";
import { useNavigate } from "react-router-dom";
import {
  Utensils,
  BookOpenCheck,
  ChefHat,
  Heart,
  ClipboardList,
  Brain,
  Image,
  Mic,
  Bot,
  Calendar,
  ListTodo,
  CookingPot,
  ShieldCheck,
  ShoppingCart,
  Medal,
  Bell,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import { useState, useEffect } from "react";
// Remove these imports as they're no longer needed
// import { Sun, Moon } from "lucide-react";

const DashboardSidebar = ({
  isOpen: parentSidebarState,
  setSidebarOpen,
  selectedMenu,
  setSelectedMenu,
}) => {
  const navigate = useNavigate();

  const navItems = [
    { label: "Explore", icon: Utensils },
    { label: "My Recipes", icon: BookOpenCheck },
    { label: "Add Recipe", icon: ChefHat },
    { label: "Favorites", icon: Heart },
    { label: "What’s in My Kitchen", icon: ClipboardList },
    { label: "Healthy Plate", icon: Brain },
    { label: "Image Search", icon: Image },
    { label: "Voice Search", icon: Mic },
    { label: "AI Assistant", icon: Bot },
    { label: "Meal Planner", icon: Calendar },
    { label: "My Meal Plans", icon: ListTodo },
    { label: "Shopping List", icon: ShoppingCart },
    { label: "Cooking Mode", icon: CookingPot },
    { label: "Preferences", icon: ShieldCheck },
    { label: "Achievements", icon: Medal },
    { label: "Notifications", icon: Bell },
    { label: "Community", icon: Users },
  ];

  return (
    <aside
      className={clsx(
        "dashboard-sidebar",
        parentSidebarState ? "sidebar-expanded" : "sidebar-collapsed",
        "transition-all duration-300 ease-in-out"
      )}
    >
      {/* Logo and Brand Name */}
      <div className="sidebar-header">
        <div className="sidebar-brand" onClick={() => navigate("/")}>
          <div className="logo-container">
            <img
              src={chefMateLogo}
              alt="ChefMate Logo"
              className="sidebar-logo"
              width={50}
              height={50}
            />
          </div>
          {parentSidebarState && (
            <h2 className="brand-text">
              CHEF<span className="accent-text">MATE</span>
            </h2>
          )}
        </div>
      </div>

      <div className="px-2 space-y-2 pb-6">
        {navItems.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className={clsx(
              "sidebar-item",
              "group relative",
              selectedMenu === label && "active"
            )}
            onClick={() => setSelectedMenu(label)}
          >
            <div className="flex items-center gap-3 cursor-pointer">
              <Icon size={20} />
              {parentSidebarState ? (
                <span>{label}</span>
              ) : (
                <span className="tooltip">{label}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="collapse-button-container">
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className={clsx(
            "collapse-button",
            parentSidebarState ? "expanded" : "collapsed"
          )}
          aria-label={
            parentSidebarState ? "Collapse sidebar" : "Expand sidebar"
          }
        >
          {parentSidebarState ? (
            <ChevronLeft size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
