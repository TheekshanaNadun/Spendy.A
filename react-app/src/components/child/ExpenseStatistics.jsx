import React from "react";
import ReactApexChart from "react-apexcharts";
import { useDashboardData } from "../DashboardDataProvider";

const ExpenseStatistics = () => {
  const { dashboardData, loading, error } = useDashboardData();

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (error) return <div className="text-danger">{error}</div>;
  if (!dashboardData) return <div className="text-secondary">No data available.</div>;

  const { expenseByCategory, expenseCategories } = dashboardData;

  const chartOptions = {
    chart: {
      type: 'pie',
      height: 340,
      width: 340,
    },
    labels: expenseCategories,
    colors: ["#02BCAF", "#F0437D", "#1C52F6", "#43DCFF", "#FF9F29", "#F26240"],
    legend: {
      show: true,
      position: 'bottom',
      fontSize: '12px',
      labels: { useSeriesColors: false },
      itemMargin: { horizontal: 8, vertical: 2 },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 220,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  return (
    <div className='w-100 sidebar-card'>
      <div className='card radius-16 h-100 w-100'>
        <div className='card-header'>
          <div className='d-flex align-items-center flex-wrap gap-2 justify-content-between'>
            <h6 className='mb-2 fw-bold text-lg mb-0'>Expense Statistics</h6>
            {/* The time period dropdown can be implemented later if needed */}
          </div>
        </div>
        <div className='card-body d-flex flex-column align-items-center justify-content-center' style={{ minWidth: 0 }}>
          {expenseByCategory && expenseByCategory.length > 0 ? (
            <div id='expenseStatistics' className='apexcharts-tooltip-z-none' style={{ width: '100%', minWidth: 0 }}>
              <ReactApexChart
                options={chartOptions}
                series={expenseByCategory}
                type='pie'
                height={340}
                width={340}
              />
            </div>
          ) : (
            <div className="text-center text-secondary-light">
              No expense data to display.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseStatistics;

