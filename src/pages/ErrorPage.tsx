import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface ErrorPageProps {
  statusCode?: number;
  title?: string;
  message?: string;
}

export default function ErrorPage({
  statusCode: propStatusCode,
  title: propTitle,
  message: propMessage
}: ErrorPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [statusCode, setStatusCode] = useState(propStatusCode || 500);
  const [title, setTitle] = useState(propTitle || "Something went wrong");
  const [message, setMessage] = useState(
    propMessage || "We're sorry, but we encountered an unexpected error. Please try again later."
  );

  useEffect(() => {
    // Extract error information from URL if available
    const params = new URLSearchParams(location.search);
    const codeParam = params.get("code");
    const messageParam = params.get("message");
    
    if (codeParam && !isNaN(Number(codeParam))) {
      setStatusCode(Number(codeParam));
    }
    
    if (messageParam) {
      setMessage(decodeURIComponent(messageParam));
      
      // Set appropriate title based on status code
      if (codeParam === "404") {
        setTitle("Page Not Found");
      } else if (codeParam === "403") {
        setTitle("Access Denied");
      } else if (codeParam === "500") {
        setTitle("Server Error");
      }
    }
  }, [location.search]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50/80 to-white p-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-blue-600 mb-4">{statusCode}</h1>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-lg text-gray-600 mb-8">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </Button>
          <Button 
            onClick={() => navigate("/")} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
} 