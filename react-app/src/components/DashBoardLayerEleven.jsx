import React, { useEffect } from "react";
import UnitCountEight from "./child/UnitCountEight";
import BalanceStatistic from "./child/BalanceStatistic";
import EarningCategories from "./child/EarningCategories";
import ExpenseStatistics from "./child/ExpenseStatistics";
import MonthlyExpenseBreakdown from "./child/MonthlyExpenseBreakdown";
import Swal from "sweetalert2";
import { DashboardDataProvider } from "./DashboardDataProvider";
import ForecastChart from "./child/ForecastChart";

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
        </div>
      </div>
    </DashboardDataProvider>
  );
};

export default DashBoardLayerEleven;
