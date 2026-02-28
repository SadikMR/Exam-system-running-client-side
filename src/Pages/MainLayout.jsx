import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar/Navbar";
import Footer from "./Footer/Footer";

const MainLayout = () => {
  const location = useLocation();

  const shouldHide = location.pathname.startsWith("/admin");

  return (
    <div>
      {!shouldHide && <Navbar />}
      <div className="min-h-screen">
        <Outlet />
      </div>
      {!shouldHide && <Footer />}
    </div>
  );
};

export default MainLayout;
