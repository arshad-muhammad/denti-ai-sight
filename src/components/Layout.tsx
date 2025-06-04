import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Footer } from "./layout/Footer";
import { useTheme } from "@/lib/ThemeProvider";

interface LayoutProps {
  children?: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col bg-background ${theme === 'dark' ? 'dark' : ''}`}>
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  );
}; 