import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { useEffect } from "react";
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

function App() {
  useEffect(() => {
    // Enable credentials for cross-origin cookies
    axios.defaults.withCredentials = true;

    // Periodically check the session status every 5 minutes
    const interval = setInterval(() => {
      axios
        .get("http://localhost:5000/api/session-check") // Flask endpoint for session validation
        .then((response) => {
          console.log("Session status:", response.data.session);
        })
        .catch((error) => {
          console.error("Session expired or unauthorized:", error.response?.data);
          window.location.href = "/sign-in"; // Redirect to sign-in page if session is invalid
        });
    }, 300000); // Check every 5 minutes

    return () => clearInterval(interval); // Clean up interval on component unmount
  }, []);

  return (
    <BrowserRouter>
      <RouteScrollToTop />
      <Routes>
        {/* Redirect root to homepage */}
        <Route path="/" element={<Navigate to="/homepage" />} />

        {/* Homepage iframe */}
        <Route
          path="/homepage"
          element={
            <iframe
              src="/homepage/index.html"
              title="Spendy.AI Homepage"
              style={{ width: "100%", height: "100vh", border: "none" }}
            />
          }
        />

        {/* Dashboard */}
        <Route path="/dashboard" element={<HomePageEleven />} />

        {/* Other routes */}
        <Route exact path="/calendar-main" element={<CalendarMainPage />} />
        <Route exact path="/calendar" element={<CalendarMainPage />} />
        <Route exact path="/code-generator-new" element={<CodeGeneratorNewPage />} />
        <Route exact path="/faq" element={<FaqPage />} />
        <Route exact path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route exact path="/form-layout" element={<FormLayoutPage />} />
        <Route exact path="/form-validation" element={<FormValidationPage />} />
        <Route exact path="/form" element={<FormPage />} />
        <Route exact path="/testimonials" element={<TestimonialsPage />} />
        <Route exact path="/coming-soon" element={<ComingSoonPage />} />
        <Route exact path="/access-denied" element={<AccessDeniedPage />} />
        <Route exact path="/maintenance" element={<MaintenancePage />} />
        <Route exact path="/blank-page" element={<BlankPagePage />} />
        <Route exact path="/line-chart" element={<LineChartPage />} />
        <Route exact path="/notification-alert" element={<NotificationAlertPage />} />
        <Route exact path="/notification" element={<NotificationPage />} />
        <Route exact path="/pagination" element={<PaginationPage />} />
        <Route exact path="/payment-gateway" element={<PaymentGatewayPage />} />
        <Route exact path="/pie-chart" element={<PieChartPage />} />
        <Route exact path="/pricing" element={<PricingPage />} />
        <Route exact path="/sign-in" element={<SignInPage />} />
        <Route exact path="/sign-up" element={<SignUpPage />} />
        <Route exact path="/star-rating" element={<StarRatingPage />} />
        <Route exact path="/switch" element={<SwitchPage />} />
        <Route exact path="/table-basic" element={<TableBasicPage />} />
        <Route exact path="/table-data" element={<TableDataPage />} />
        <Route exact path="/terms-condition" element={<TermsConditionPage />} />

        {/* Catch-all for undefined routes */}
        <Route exact path="*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
