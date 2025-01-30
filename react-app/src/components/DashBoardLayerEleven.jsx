import React, { useEffect } from "react";
import UnitCountEight from "./child/UnitCountEight";
import BalanceStatistic from "./child/BalanceStatistic";
import EarningCategories from "./child/EarningCategories";
import ExpenseStatistics from "./child/ExpenseStatistics";
import PaymentHistory from "./child/PaymentHistory";
import MonthlyExpenseBreakdown from "./child/MonthlyExpenseBreakdown";
import QuickTransfer from "./child/QuickTransfer";
import Investment from "./child/Investment";
import PaymentHistoryOne from "./child/PaymentHistoryOne";
import Swal from "sweetalert2";

const DashBoardLayerEleven = () => {
  useEffect(() => {
    const showWelcome = new URLSearchParams(window.location.search).get('showWelcome');
    if (showWelcome) {
      Swal.fire({
        icon: "success",
        title: "Welcome to Spendy.AI",
        text: "You have successfully logged in",
        confirmButtonText: "Start Tracking"
      });
      // Clean up URL parameter
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  return (
    <div className="dashboard-container">
      {/* Main Stats Section */}
      <UnitCountEight />

      <div className='mt-24'>
        <div className='row gy-4'>
          {/* Main Content Area */}
          <div className='col-xl-8'>
            <div className='row gy-4'>
              {/* Financial Overview */}
              <BalanceStatistic />
              
              {/* Income Categories */}
              <EarningCategories />
              
              {/* AI-Driven Expense Analysis */}
              <ExpenseStatistics />
              
              {/* Recent Transactions */}
              <PaymentHistory />
              
              {/* AI-Generated Monthly Analysis */}
              <MonthlyExpenseBreakdown />
            </div>
          </div>

          {/* Sidebar */}
          <div className='col-xl-4'>
            <div className="sticky-sidebar">
              {/* Quick Actions */}
              <QuickTransfer />
              
              {/* Financial Planning */}
              <Investment />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Transaction History */}
      <PaymentHistoryOne />
    </div>
  );
};

export default DashBoardLayerEleven;
