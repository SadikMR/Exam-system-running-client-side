import React, { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";

const AdminHomePage = () => {
  const sections = ["BCS", "HSC", "Bank"];
  const [hoveredSection, setHoveredSection] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);
  const timeoutRef = useRef(null);

  const liveExamOptions = [
    { name: "Full Model Test", path: "full-model" },
    { name: "Subjectwise", path: "subjectwise" },
    { name: "Random", path: "random" },
  ];

  const handleMouseEnter = (section) => {
    setHoveredSection(section);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowDropdown(section);
    }, 200); // 200ms delay before showing dropdown
  };

  const handleMouseLeave = () => {
    setHoveredSection(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setShowDropdown(null);
    }, 300); // 300ms delay before hiding dropdown
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background mt-10 px-4">
      <div className="bg-card shadow-2xl rounded-2xl p-14 w-full max-w-6xl min-h-[100vh] flex flex-col justify-center">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-foreground">
            Admin Dashboard
          </h1>
        </div>

        {/* Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mx-auto">
          {sections.map((section) => (
            <div key={section} className="bg-muted rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-center text-foreground">
                {section}
              </h2>
              <div className="flex flex-col gap-4">
                <NavLink
                  to={`/admin/${section}`}
                  className="w-full text-lg font-medium text-accent-foreground bg-accent hover:bg-accent/90 py-3 px-4 rounded-lg text-center transition duration-300"
                >
                  Add {section} Question
                </NavLink>
                <NavLink
                  to={`/admin/${section}/others`}
                  className="w-full text-lg font-medium text-accent-foreground bg-accent/70 hover:bg-accent/80 py-3 px-4 rounded-lg text-center transition duration-300"
                >
                  Other
                </NavLink>

                {/* Live Exam Button with Dropdown */}
                <div className="relative">
                  <button
                    className="w-full text-lg font-medium text-accent-foreground bg-primary hover:bg-primary/90 py-3 px-4 rounded-lg text-center transition duration-300"
                    onMouseEnter={() => handleMouseEnter(section)}
                    onMouseLeave={handleMouseLeave}
                  >
                    Live Exam
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown === section && (
                    <div
                      className="absolute top-full left-0 w-full bg-card border border-border rounded-lg shadow-lg z-10 mt-2 py-2"
                      onMouseEnter={() => handleMouseEnter(section)}
                      onMouseLeave={handleMouseLeave}
                      style={{ minWidth: "200px" }}
                    >
                      {liveExamOptions.map((option, index) => (
                        <NavLink
                          key={option.path}
                          to={`/admin/${section}/live-exam/${option.path}`}
                          className="block w-full text-left px-4 py-3 text-muted-foreground hover:bg-accent/10 hover:text-accent transition duration-200 font-medium"
                          style={{
                            borderTop:
                              index === 0 ? "none" : "1px solid #f3f4f6",
                            marginTop: index === 0 ? "0" : "2px",
                          }}
                        >
                          {option.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-700">
          <p className="font-medium text-lg">
            Ensure all questions are properly reviewed before submission.
          </p>
          <p className="mt-3 text-base">
            For support, contact the system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminHomePage;
