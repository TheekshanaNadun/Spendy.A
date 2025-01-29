import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useEffect, useState, createContext, useContext } from "react";
import axios from "axios";

// Import all your pages
import CalendarMainPage from "./pages/CalendarMainPage";
import CodeGeneratorNewPage from "./pages/CodeGeneratorNewPage";
import ErrorPage from "./pages/ErrorPage";
import FaqPage from "./pages/FaqPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import FormLayoutPage from "./pages/FormLayoutPage";
import FormValidationPage from "./pages/FormValidationPage";
import FormPage from "./pages/FormPage";
import LineChartPage from "./pages/LineChartPage";
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
import TermsConditionPage from "./pages/TermsConditionPage";
import RouteScrollToTop from "./helper/RouteScrollToTop";
import HomePageEleven from "./pages/HomePageEleven";
import TestimonialsPage from "./pages/TestimonialsPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import MaintenancePage from "./pages/MaintenancePage";
import BlankPagePage from "./pages/BlankPagePage";

// Create Auth Context
export const AuthContext = createContext(null);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div>Loading...</div>; // You can replace this with a proper loading component
  }
  
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
        if (response.data.authenticated) {
          setUser(response.data.user);
        }
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

  const authContextValue = {
    isAuthenticated,
    setIsAuthenticated,
    loading,
    user,
    setUser
  };

  return (
    <AuthContext.Provider value={authContextValue}>
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
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <HomePageEleven />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar-main"
            element={
              <ProtectedRoute>
                <CalendarMainPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarMainPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/code-generator-new"
            element={
              <ProtectedRoute>
                <CodeGeneratorNewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faq"
            element={
              <ProtectedRoute>
                <FaqPage />
              </ProtectedRoute>
            }
          />
          {/* Add other protected routes similarly */}
          <Route
            path="/form-layout"
            element={
              <ProtectedRoute>
                <FormLayoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/form-validation"
            element={
              <ProtectedRoute>
                <FormValidationPage />
              </ProtectedRoute>
            }
          />        {/* Public Routes */}
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
           {/* Protected Routes */}
        {isAuthenticated ? (
          <>
            <Route path="/calendar-main" element={<CalendarMainPage />} />
            <Route path="/calendar" element={<CalendarMainPage />} />
            <Route path="/code-generator-new" element={<CodeGeneratorNewPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/form-layout" element={<FormLayoutPage />} />
            <Route path="/form-validation" element={<FormValidationPage />} />
            <Route path="/form" element={<FormPage />} />
            <Route path="/testimonials" element={<TestimonialsPage />} />
            <Route path="/coming-soon" element={<ComingSoonPage />} />
            <Route path="/access-denied" element={<AccessDeniedPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/blank-page" element={<BlankPagePage />} />
            <Route path="/line-chart" element={<LineChartPage />} />
            <Route path="/notification-alert" element={<NotificationAlertPage />} />
            <Route path="/notification" element={<NotificationPage />} />
            <Route path="/pagination" element={<PaginationPage />} />
            <Route path="/payment-gateway" element={<PaymentGatewayPage />} />
            <Route path="/pie-chart" element={<PieChartPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/star-rating" element={<StarRatingPage />} />
            <Route path="/switch" element={<SwitchPage />} />
            <Route path="/table-basic" element={<TableBasicPage />} />
            <Route path="/table-data" element={<TableDataPage />} />
            <Route path="/terms-condition" element={<TermsConditionPage />} />
          </>
        ) : (
          // Redirect to sign-in for protected routes when not authenticated
          <Route path="*" element={<Navigate to="/sign-in" />} />
        )}

        
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Catch-all for undefined routes */}
        <Route path="*" element={<ErrorPage />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
