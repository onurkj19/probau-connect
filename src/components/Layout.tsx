import { Outlet } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Layout = () => (
  <div className="flex min-h-screen flex-col">
    <Header />
    <div className="flex-1">
      <Outlet />
    </div>
    <Footer />
  </div>
);

export default Layout;
