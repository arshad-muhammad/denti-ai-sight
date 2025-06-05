import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card p-8 rounded-lg shadow-xl flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Please Wait</h3>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}; 