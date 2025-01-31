import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useEffect, useState, createContext, useContext } from "react";
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

export const AuthContext = createContext(null);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/sign-in" />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.defaults.withCredentials = true;
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/session-check");
        setIsAuthenticated(response.data.authenticated);
        response.data.authenticated && setUser(response.data.user);
      } catch (error) {
        console.error("Session check failed:", error.response?.data);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
    const interval = setInterval(checkAuthStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, loading, user, setUser }}>
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
          <Route path="/dashboard" element={<ProtectedRoute><HomePageEleven /></ProtectedRoute>} />
          <Route path="/calendar-main" element={<ProtectedRoute><CalendarMainPage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarMainPage /></ProtectedRoute>} />
          <Route path="/code-generator-new" element={<ProtectedRoute><CodeGeneratorNewPage /></ProtectedRoute>} />
          <Route path="/faq" element={<ProtectedRoute><FaqPage /></ProtectedRoute>} />
          <Route path="/view-profile" element={<ProtectedRoute><ViewProfilePage /></ProtectedRoute>} />
          <Route path="/form-layout" element={<ProtectedRoute><FormLayoutPage /></ProtectedRoute>} />
          <Route path="/form-validation" element={<ProtectedRoute><FormValidationPage /></ProtectedRoute>} />
          <Route path="/form" element={<ProtectedRoute><FormPage /></ProtectedRoute>} />
          <Route path="/testimonials" element={<ProtectedRoute><TestimonialsPage /></ProtectedRoute>} />
          <Route path="/coming-soon" element={<ProtectedRoute><ComingSoonPage /></ProtectedRoute>} />
          <Route path="/access-denied" element={<ProtectedRoute><AccessDeniedPage /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>} />
          <Route path="/blank-page" element={<ProtectedRoute><BlankPagePage /></ProtectedRoute>} />
          <Route path="/line-chart" element={<ProtectedRoute><LineChartPage /></ProtectedRoute>} />
          <Route path="/notification-alert" element={<ProtectedRoute><NotificationAlertPage /></ProtectedRoute>} />
          <Route path="/notification" element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
          <Route path="/pagination" element={<ProtectedRoute><PaginationPage /></ProtectedRoute>} />
          <Route path="/payment-gateway" element={<ProtectedRoute><PaymentGatewayPage /></ProtectedRoute>} />
          <Route path="/pie-chart" element={<ProtectedRoute><PieChartPage /></ProtectedRoute>} />
          <Route path="/column-chart" element={<ProtectedRoute><ColumnChartPage /></ProtectedRoute>} />
          <Route path="/pricing" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />
          <Route path="/star-rating" element={<ProtectedRoute><StarRatingPage /></ProtectedRoute>} />
          <Route path="/switch" element={<ProtectedRoute><SwitchPage /></ProtectedRoute>} />
          <Route path="/table-basic" element={<ProtectedRoute><TableBasicPage /></ProtectedRoute>} />
          <Route path="/table-data" element={<ProtectedRoute><TableDataPage /></ProtectedRoute>} />

          {/* Error Handling */}
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
