import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  GraduationCap,
  Building2,
  Radio,
  ChevronDown,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication state based on presence of userToken
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("userToken"),
  );

  const [showExamMenu, setShowExamMenu] = useState(false);
  const [showHscMenu, setShowHscMenu] = useState(false);
  const [showBankMenu, setShowBankMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dropdown state for user icon dropdown
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  // User profile state
  const [userProfile, setUserProfile] = useState(null);

  // Dropdown refs
  const bcsDropdownRef = useRef(null);
  const hscDropdownRef = useRef(null);
  const bankDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  const examTimeoutRef = useRef(null);
  const hscTimeoutRef = useRef(null);
  const bankTimeoutRef = useRef(null);

  // Fetch user profile when authenticated
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("userToken");
      if (token) {
        try {
          const response = await fetch(`${BACKEND_URL}/user/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setUserProfile(data.user);
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      } else {
        setUserProfile(null);
      }
    };

    fetchUserProfile();
  }, [isAuthenticated]);

  // Listen for authentication changes
  useEffect(() => {
    const syncAuth = () => {
      const hasToken = !!localStorage.getItem("userToken");
      setIsAuthenticated(hasToken);
    };

    window.addEventListener("storage", syncAuth);
    window.addEventListener("authChange", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("authChange", syncAuth);
    };
  }, []);

  const handleLogOut = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
    setIsAuthenticated(false);
    setIsMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setUserProfile(null);

    window.dispatchEvent(new Event("authChange"));

    Swal.fire({
      title: "Logout Successful",
      icon: "success",
      confirmButtonText: "OK",
      customClass: { confirmButton: "swal-button" },
    }).then(() => {
      navigate("/login");
    });
  };

  const handleDropdownEnter = (menu) => {
    if (menu === "bcs") {
      clearTimeout(examTimeoutRef.current);
      setShowExamMenu(true);
      setShowHscMenu(false);
      setShowBankMenu(false);
    } else if (menu === "hsc") {
      clearTimeout(hscTimeoutRef.current);
      setShowHscMenu(true);
      setShowExamMenu(false);
      setShowBankMenu(false);
    } else if (menu === "bank") {
      clearTimeout(bankTimeoutRef.current);
      setShowBankMenu(true);
      setShowExamMenu(false);
      setShowHscMenu(false);
    }
  };

  const handleDropdownLeave = (menu) => {
    if (menu === "bcs") {
      examTimeoutRef.current = setTimeout(() => setShowExamMenu(false), 200);
    } else if (menu === "hsc") {
      hscTimeoutRef.current = setTimeout(() => setShowHscMenu(false), 200);
    } else if (menu === "bank") {
      bankTimeoutRef.current = setTimeout(() => setShowBankMenu(false), 200);
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(examTimeoutRef.current);
      clearTimeout(hscTimeoutRef.current);
      clearTimeout(bankTimeoutRef.current);
    };
  }, []);

  // Close dropdowns if clicking outside
  const handleClickOutside = (e) => {
    // For exam dropdowns
    if (
      bcsDropdownRef.current &&
      !bcsDropdownRef.current.contains(e.target) &&
      hscDropdownRef.current &&
      !hscDropdownRef.current.contains(e.target) &&
      bankDropdownRef.current &&
      !bankDropdownRef.current.contains(e.target)
    ) {
      setShowExamMenu(false);
      setShowHscMenu(false);
      setShowBankMenu(false);
    }
    // For user dropdown
    if (
      userDropdownRef.current &&
      !userDropdownRef.current.contains(e.target)
    ) {
      setUserDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dropdown item component
  const DropdownItem = ({ to, onClick, children, icon: IconComponent }) => (
    <Link
      to={to}
      onClick={() => {
        onClick?.();
        setShowExamMenu(false);
        setShowHscMenu(false);
        setShowBankMenu(false);
        setIsMobileMenuOpen(false);
        setUserDropdownOpen(false);
      }}
      className="group flex items-center gap-3 px-5 py-3.5 text-sm md:text-base font-medium text-muted-foreground hover:bg-muted hover:text-accent transition-all duration-300 rounded-xl mx-2 my-1 hover:shadow-sm hover:scale-[1.02]"
    >
      {IconComponent && (
        <IconComponent className="w-4 h-4 text-accent group-hover:scale-110 transition-transform duration-300" />
      )}
      <span>{children}</span>
    </Link>
  );

  // Mobile nav item component - using Link instead of NavLink to ensure proper navigation
  const MobileNavItem = ({ to, icon, children }) => (
    <button
      type="button"
      onClick={() => {
        navigate(to);
        setShowExamMenu(false);
        setShowHscMenu(false);
        setShowBankMenu(false);
        setIsMobileMenuOpen(false);
      }}
      className="flex items-center gap-3 w-full px-6 py-4 text-left text-base md:text-lg font-semibold rounded-2xl transition-all duration-300 text-muted-foreground hover:bg-muted hover:text-accent hover:shadow-sm"
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{children}</span>
    </button>
  );

  return (
    <>
      <div className="h-24" />
      <nav className="bg-card/95 backdrop-blur-2xl shadow-lg shadow-slate-200/50 border-b border-border fixed top-0 left-0 right-0 z-50">
        {/* Gradient overlay for extra depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 via-transparent to-slate-50/20 pointer-events-none" />

        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between h-24">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link
                to="/"
                className="group flex items-center gap-3 transition-all duration-300 hover:scale-105"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="relative w-12 h-12 lg:w-14 lg:h-14">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-accent rounded-2xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity duration-300" />
                  {/* Icon */}
                  <div className="relative w-full h-full bg-accent rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-all duration-300">
                    <span className="text-white text-2xl lg:text-3xl font-black tracking-tight">
                      E
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl sm:text-2xl xl:text-3xl 2xl:text-4xl font-black text-foreground tracking-tight leading-none">
                    ExamDesk
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Center */}
            <div className="hidden xl:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-2">
                {/* Live Exams */}
                <NavLink
                  to="/LiveExams"
                  className={({ isActive }) => {
                    const isLiveExamsActive =
                      isActive || location.pathname.startsWith("/LiveExams");
                    return `relative group rounded-2xl text-sm xl:text-base font-bold px-5 py-3 transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${
                      isLiveExamsActive
                        ? "bg-emerald-50 text-accent shadow-md shadow-accent/20"
                        : "text-foreground hover:bg-muted hover:text-foreground"
                    }`;
                  }}
                >
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75" />
                    <span className="relative rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                  <span className="font-extrabold tracking-tight">
                    Live Exams
                  </span>
                </NavLink>

                {/* BCS Exam Dropdown */}
                <div
                  className="relative group"
                  ref={bcsDropdownRef}
                  onMouseEnter={() => handleDropdownEnter("bcs")}
                  onMouseLeave={() => handleDropdownLeave("bcs")}
                >
                  <NavLink
                    to="/bcs/all-questions"
                    className={({ isActive }) => {
                      const isBcsActive =
                        isActive || location.pathname.startsWith("/bcs");
                      return `relative rounded-2xl text-sm xl:text-base font-bold px-5 py-3 transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${
                        isBcsActive
                          ? "bg-emerald-50 text-accent shadow-md shadow-accent/20"
                          : "text-foreground hover:bg-muted hover:text-foreground"
                      }`;
                    }}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span className="font-extrabold tracking-tight">
                      BCS Exam
                    </span>
                    <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
                  </NavLink>

                  <div
                    className={`absolute right-0 mt-3 w-64 rounded-2xl bg-card/95 backdrop-blur-2xl shadow-xl border border-slate-200 transform transition-all duration-300 origin-top ${
                      showExamMenu
                        ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                    }`}
                  >
                    <div className="py-2">
                      <DropdownItem to="bcs/all-questions" icon={Radio}>
                        All Questions Exam
                      </DropdownItem>
                      <DropdownItem to="bcs/subjectwise" icon={BookOpen}>
                        Subject Wise Exam
                      </DropdownItem>
                    </div>
                  </div>
                </div>

                {/* HSC Exam Dropdown */}
                <div
                  className="relative group"
                  ref={hscDropdownRef}
                  onMouseEnter={() => handleDropdownEnter("hsc")}
                  onMouseLeave={() => handleDropdownLeave("hsc")}
                >
                  <NavLink
                    to="/hsc/all-questions"
                    className={({ isActive }) => {
                      const isHscActive =
                        isActive || location.pathname.startsWith("/hsc");
                      return `relative rounded-2xl text-sm xl:text-base font-bold px-5 py-3 transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${
                        isHscActive
                          ? "bg-emerald-50 text-accent shadow-md shadow-accent/20"
                          : "text-foreground hover:bg-muted hover:text-foreground"
                      }`;
                    }}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span className="font-extrabold tracking-tight">
                      HSC Exam
                    </span>
                    <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
                  </NavLink>

                  <div
                    className={`absolute right-0 mt-3 w-64 rounded-2xl bg-white/95 backdrop-blur-2xl shadow-xl border border-slate-200 transform transition-all duration-300 origin-top ${
                      showHscMenu
                        ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                    }`}
                  >
                    <div className="py-2">
                      <DropdownItem to="hsc/all-questions" icon={Radio}>
                        All Questions Exam
                      </DropdownItem>
                      <DropdownItem to="hsc/subjectwise" icon={BookOpen}>
                        Subject Wise Exam
                      </DropdownItem>
                    </div>
                  </div>
                </div>

                {/* Bank Exam Dropdown */}
                <div
                  className="relative group"
                  ref={bankDropdownRef}
                  onMouseEnter={() => handleDropdownEnter("bank")}
                  onMouseLeave={() => handleDropdownLeave("bank")}
                >
                  <NavLink
                    to="/bank/all-questions"
                    className={({ isActive }) => {
                      const isBankActive =
                        isActive || location.pathname.startsWith("/bank");
                      return `relative rounded-2xl text-sm xl:text-base font-bold px-5 py-3 transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${
                        isBankActive
                          ? "bg-emerald-50 text-accent shadow-md shadow-accent/20"
                          : "text-foreground hover:bg-muted hover:text-foreground"
                      }`;
                    }}
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="font-extrabold tracking-tight">
                      Bank Exam
                    </span>
                    <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
                  </NavLink>

                  <div
                    className={`absolute right-0 mt-3 w-64 rounded-2xl bg-white/95 backdrop-blur-2xl shadow-xl border border-slate-200 transform transition-all duration-300 origin-top ${
                      showBankMenu
                        ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                    }`}
                  >
                    <div className="py-2">
                      <DropdownItem to="bank/all-questions" icon={Radio}>
                        All Questions Exam
                      </DropdownItem>
                      <DropdownItem to="bank/subjectwise" icon={BookOpen}>
                        Subject Wise Exam
                      </DropdownItem>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex xl:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative inline-flex items-center justify-center p-3 rounded-2xl text-foreground hover:text-accent bg-muted hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Right Side - User Actions */}
            <div className="hidden xl:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  {/* User Icon Dropdown */}
                  <div className="relative" ref={userDropdownRef}>
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="group relative flex items-center justify-center rounded-2xl bg-muted hover:bg-muted/80 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg hover:shadow-accent/40 overflow-hidden"
                      aria-haspopup="true"
                      aria-expanded={userDropdownOpen}
                    >
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-accent rounded-2xl blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                      {userProfile?.image ? (
                        <img
                          src={userProfile.image}
                          alt={userProfile.name || "Profile"}
                          className="w-10 h-10 rounded-2xl object-cover relative z-10"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center relative z-10">
                          <User className="w-6 h-6 text-accent" />
                        </div>
                      )}
                    </button>
                    {userDropdownOpen && (
                      <div
                        className="absolute right-0 mt-3 w-56 rounded-2xl bg-card/95 backdrop-blur-2xl shadow-xl border border-slate-200 origin-top z-50 animate-in fade-in slide-in-from-top-2 duration-300"
                        role="menu"
                        aria-orientation="vertical"
                      >
                        <div className="py-2">
                          <Link
                            to="/student/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3.5 text-base font-semibold text-muted-foreground hover:bg-muted hover:text-accent transition-all duration-300 mx-2 rounded-xl hover:shadow-sm hover:scale-[1.02]"
                            role="menuitem"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              />
                            </svg>
                            Dashboard
                          </Link>
                          <Link
                            to="/profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3.5 text-base font-semibold text-muted-foreground hover:bg-accent-50 hover:text-accent-700 transition-all duration-300 mx-2 rounded-xl hover:shadow-sm hover:scale-[1.02]"
                            role="menuitem"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Profile
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleLogOut}
                    className="group relative px-6 py-3 bg-destructive text-destructive-foreground rounded-2xl font-bold hover:bg-destructive/90 shadow-md hover:shadow-lg hover:shadow-destructive/30 hover:scale-105 transition-all duration-300 overflow-hidden"
                  >
                    <span className="relative z-10 font-extrabold tracking-tight">
                      Log Out
                    </span>
                    <span className="absolute inset-0 bg-destructive/90 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </button>
                </>
              ) : (
                <Link to="/login">
                  <button className="group relative px-7 py-3 bg-accent text-accent-foreground rounded-2xl font-bold hover:bg-accent/90 shadow-md hover:shadow-lg hover:shadow-accent/30 hover:scale-105 transition-all duration-300 overflow-hidden">
                    <span className="relative z-10 font-extrabold tracking-tight">
                      Login
                    </span>
                    <span className="absolute inset-0 bg-accent/90 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-500 ${
          isMobileMenuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-white/40 backdrop-blur-xl transition-all duration-500 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu Content */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-full sm:w-96 bg-white backdrop-blur-2xl shadow-2xl transform transition-all duration-500 ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-card/50">
            <h2 className="text-2xl font-black text-foreground">Menu</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-xl bg-muted text-foreground hover:bg-muted/80 transition-all duration-300 hover:scale-110 hover:rotate-90"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Menu Items - FLAT STRUCTURE (No Dropdowns) */}
          <div className="overflow-y-auto px-4 pt-4 pb-4 space-y-2" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            {/* Live Exams */}
            <MobileNavItem to="/LiveExams" icon="🔴">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75" />
                  <span className="relative rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                Live Exams
              </div>
            </MobileNavItem>

            {/* BCS - All Questions */}
            <MobileNavItem to="/bcs/all-questions" icon="📚">
              BCS All Questions
            </MobileNavItem>

            {/* BCS - Subject Wise */}
            <MobileNavItem to="/bcs/subjectwise" icon="�">
              BCS Subject Wise
            </MobileNavItem>

            {/* HSC - All Questions */}
            <MobileNavItem to="/hsc/all-questions" icon="🎓">
              HSC All Questions
            </MobileNavItem>

            {/* HSC - Subject Wise */}
            <MobileNavItem to="/hsc/subjectwise" icon="🎓">
              HSC Subject Wise
            </MobileNavItem>

            {/* Bank - All Questions */}
            <MobileNavItem to="/bank/all-questions" icon="🏦">
              Bank All Questions
            </MobileNavItem>

            {/* Bank - Subject Wise */}
            <MobileNavItem to="/bank/subjectwise" icon="🏦">
              Bank Subject Wise
            </MobileNavItem>

            {isAuthenticated && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent my-4" />
                <MobileNavItem to="/student/dashboard" icon="🏠">
                  Dashboard
                </MobileNavItem>
                <MobileNavItem to="/profile" icon="👤">
                  Profile
                </MobileNavItem>
              </>
            )}
          </div>

          {/* Mobile Auth Button - Sticky Bottom */}
          <div className="px-4 pb-4 border-t">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogOut}
                className="w-full px-6 py-4 text-base font-bold text-destructive-foreground bg-destructive rounded-2xl hover:bg-destructive/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                Log Out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  navigate("/login");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full px-6 py-4 text-base font-bold text-accent-foreground bg-accent rounded-2xl hover:bg-accent/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
