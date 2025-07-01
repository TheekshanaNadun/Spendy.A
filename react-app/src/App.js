import { BrowserRouter, Route, Routes, Navigate,useNavigate } from "react-router-dom";
import { useEffect, useState, createContext, useContext ,} from "react";
import axios from "axios";

// Page imports
import AccessDeniedPage from "./pages/AccessDeniedPage";
import BlankPagePage from "./pages/BlankPagePage";
import CalendarMainPage from "./pages/CalendarMainPage";
import CodeGeneratorNewPage from "./pages/CodeGeneratorNewPage";
import ColumnChartPage from "./pages/ColumnChartPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import ErrorPage from "./pages/ErrorPage";
import FaqPage from "./pages/FaqPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import FormLayoutPage from "./pages/FormLayoutPage";
import FormValidationPage from "./pages/FormValidationPage";
import FormPage from "./pages/FormPage";
import HomePageEleven from "./pages/HomePageEleven";
import LineChartPage from "./pages/LineChartPage";
import MaintenancePage from "./pages/MaintenancePage";
import NotificationAlertPage from "./pages/NotificationAlertPage";
import NotificationPage from "./pages/NotificationPage";
import PaginationPage from "./pages/PaginationPage";
import PaymentGatewayPage from "./pages/PaymentGatewayPage";
import PieChartPage from "./pages/PieChartPage";
import PricingPage from "./pages/PricingPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import StarRatingPage from "./pages/StarRatingPage";
import SwitchPage from "./pages/SwitchPage";
import TableBasicPage from "./pages/TableBasicPage";
import TableDataPage from "./pages/TableDataPage";
import TestimonialsPage from "./pages/TestimonialsPage";
import TermsConditionPage from "./pages/TermsConditionPage";
import ViewProfilePage from "./pages/ViewProfilePage";
import RouteScrollToTop from "./helper/RouteScrollToTop";
import { DashboardDataProvider } from "./components/DashboardDataProvider";

export const AuthContext = createContext(null);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/sign-in");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) return <div className="full-page-loader">Loading...</div>;
  
  return isAuthenticated ? children : null;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/session-check");
      setIsAuthenticated(response.data.authenticated);
      if (response.data.authenticated) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    axios.defaults.withCredentials = true;
    
    const initializeAuth = async () => {
      await checkAuthStatus();
      const interval = setInterval(checkAuthStatus, 300000); // 5 minute checks
      return () => clearInterval(interval);
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      setIsAuthenticated, 
      loading, 
      user, 
      setUser,
      checkAuthStatus
    }}>
      <BrowserRouter>
        <RouteScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/homepage" />} />
          <Route
            path="/homepage"
            element={
              <iframe
                src={`/homepage/index.html${isAuthenticated ? '?authenticated=true' : ''}`}
                title="Spendy.AI Homepage"
                style={{ width: "100%", height: "100vh", border: "none" }}
              />
            }
          />
          <Route
            path="/homepage/about"
            element={
              <iframe
                src={`/homepage/about.html${isAuthenticated ? '?authenticated=true' : ''}`}
                title="Spendy.AI About"
                style={{ width: "100%", height: "100vh", border: "none" }}
              />
            }
          />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/terms-condition" element={<TermsConditionPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardDataProvider><HomePageEleven /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/calendar-main" element={<ProtectedRoute><DashboardDataProvider><CalendarMainPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><DashboardDataProvider><CalendarMainPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/code-generator-new" element={<ProtectedRoute><DashboardDataProvider><CodeGeneratorNewPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/faq" element={<ProtectedRoute><DashboardDataProvider><FaqPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/view-profile" element={<ProtectedRoute><DashboardDataProvider><ViewProfilePage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/form-layout" element={<ProtectedRoute><DashboardDataProvider><FormLayoutPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/form-validation" element={<ProtectedRoute><DashboardDataProvider><FormValidationPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/form" element={<ProtectedRoute><DashboardDataProvider><FormPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/testimonials" element={<ProtectedRoute><DashboardDataProvider><TestimonialsPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/coming-soon" element={<ProtectedRoute><DashboardDataProvider><ComingSoonPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/access-denied" element={<ProtectedRoute><DashboardDataProvider><AccessDeniedPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute><DashboardDataProvider><MaintenancePage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/blank-page" element={<ProtectedRoute><DashboardDataProvider><BlankPagePage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/line-chart" element={<ProtectedRoute><DashboardDataProvider><LineChartPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/notification-alert" element={<ProtectedRoute><DashboardDataProvider><NotificationAlertPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/notification" element={<ProtectedRoute><DashboardDataProvider><NotificationPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/pagination" element={<ProtectedRoute><DashboardDataProvider><PaginationPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/payment-gateway" element={<ProtectedRoute><DashboardDataProvider><PaymentGatewayPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/pie-chart" element={<ProtectedRoute><DashboardDataProvider><PieChartPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/column-chart" element={<ProtectedRoute><DashboardDataProvider><ColumnChartPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/pricing" element={<ProtectedRoute><DashboardDataProvider><PricingPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/star-rating" element={<ProtectedRoute><DashboardDataProvider><StarRatingPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/switch" element={<ProtectedRoute><DashboardDataProvider><SwitchPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/table-basic" element={<ProtectedRoute><DashboardDataProvider><TableBasicPage /></DashboardDataProvider></ProtectedRoute>} />
          <Route path="/table-data" element={<ProtectedRoute><DashboardDataProvider><TableDataPage /></DashboardDataProvider></ProtectedRoute>} />

          {/* Error Handling */}
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
