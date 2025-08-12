import React, { useEffect } from "react";
import UnitCountEight from "./child/UnitCountEight";
import BalanceStatistic from "./child/BalanceStatistic";
import EarningCategories from "./child/EarningCategories";
import ExpenseStatistics from "./child/ExpenseStatistics";
import MonthlyExpenseBreakdown from "./child/MonthlyExpenseBreakdown";
import CategoryBudgetTracker from "./child/CategoryBudgetTracker";
import Swal from "sweetalert2";
import { DashboardDataProvider } from "./DashboardDataProvider";
import ForecastChart from "./child/ForecastChart";

const DashBoardLayerEleven = () => {
  // Add CSS for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
      }
      .welcome-popup .swal2-html-container {
        animation: pulse 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const showWelcome = new URLSearchParams(window.location.search).get('showWelcome');
    if (showWelcome) {
      // Small delay to ensure dashboard is fully loaded
      setTimeout(() => {
        Swal.fire({
        icon: "success",
        title: "Welcome to Spendy.AI! 🎉",
        html: `
          <div style="text-align: left; padding: 20px 0;">
            <p style="margin-bottom: 16px; font-size: 16px; color: #4a5568;">
              You have successfully logged in to your financial management dashboard!
            </p>
            <div style="background: #f7fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #4318FF; margin: 20px 0;">
              <h4 style="margin: 0 0 12px 0; color: #1a2b4e; font-size: 18px;">
                🚀 Getting Started with Automated Expense Tracking
              </h4>
              <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                <strong>Please click the chat popup in the right bottom corner</strong> to get started with our AI-powered expense tracking system.
              </p>
              <div style="margin: 12px 0; padding: 12px; background: #e6fffa; border-radius: 6px; border: 1px solid #81e6d9;">
                <p style="margin: 0; color: #234e52; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 16px;">📍</span>
                  <strong>Look for the chat bubble icon in the bottom-right corner of your screen</strong>
                </p>
              </div>
              <p style="margin: 8px 0 0 0; color: #718096; font-size: 13px;">
                Our AI assistant will help you set up automated expense categorization, budget planning, and financial insights.
              </p>
            </div>
            <p style="margin: 0; font-size: 14px; color: #718096;">
              💡 <strong>Tip:</strong> The chat popup is your gateway to automated financial management!
            </p>
          </div>
        `,
        confirmButtonText: "Got it! Let's Start",
        confirmButtonColor: "#4318FF",
        width: "600px",
        customClass: {
          popup: 'animated fadeInDown welcome-popup',
          title: 'swal2-title-custom'
        },
        backdrop: `
          rgba(67, 24, 255, 0.1)
        `,
        didOpen: () => {
          // Add some CSS animations for the highlighted section
          const popup = Swal.getPopup();
          const highlightBox = popup.querySelector('.swal2-html-container');
          if (highlightBox) {
            highlightBox.style.animation = 'pulse 2s ease-in-out infinite';
          }
        }
              });
        // Clean up URL parameter
        window.history.replaceState({}, '', '/dashboard');
      }, 500); // 500ms delay
    }
  }, []);

  return (
    <DashboardDataProvider>
      <div className="dashboard-container">
        {/* Main Stats Section */}
        <UnitCountEight />

        <div className='mt-24'>
          <div className='row gy-4'>
            {/* Main Content Area */}
            <div className='col-xl-8'>
              <div className='row gy-4'>
                {/* Forecast and Prediction Cards */}
                <ForecastChart />
                {/* Financial Overview */}
                <BalanceStatistic />
              </div>
            </div>
            {/* Sidebar with small cards */}
            <div className='col-xl-4'>
              <div className="sticky-sidebar d-flex flex-column gap-4">
                <MonthlyExpenseBreakdown />
                <EarningCategories />
                <ExpenseStatistics />
              </div>
            </div>
          </div>
          
          {/* Category Budget Tracker - Full Width */}
          <div className='mt-24'>
            <CategoryBudgetTracker />
          </div>
        </div>
      </div>
    </DashboardDataProvider>
  );
};

export default DashBoardLayerEleven;
