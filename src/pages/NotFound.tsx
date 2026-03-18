import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Xətası: İstifadəçi mövcud olmayan səhifəyə daxil olmağa çalışdı:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background animate-fade-in-up">
      <div className="text-center space-y-4">
        <h1 className="text-7xl font-bold text-primary animate-pulse-glow">404</h1>
        <p className="text-xl text-muted-foreground">Səhifə tapılmadı</p>
        <a href="/" className="inline-block mt-2 text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
          Ana səhifəyə qayıt
        </a>
      </div>
    </div>
  );
};

export default NotFound;
