import React from "react";
import ReactApexChart from "react-apexcharts";
import { useDashboardData } from "../DashboardDataProvider";
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const ExpenseStatistics = () => {
  const { dashboardData, loading, error } = useDashboardData();

  const showChatGuide = () => {
    Swal.fire({
      title: '💡 Use Chat for Easy Expense Tracking!',
      html: `
        <div class="text-left">
          <p class="mb-3">Instead of filling out forms, you can simply chat with our AI assistant:</p>
          <div class="bg-light p-3 rounded mb-3">
            <strong>Examples:</strong><br>
            • "I spent 5000 on groceries today"<br>
            • "Paid 2000 for transport yesterday"<br>
            • "Bought lunch for 1500"
          </div>
          <p class="text-muted small">Click the chat popup in the bottom right corner to get started!</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Got it!',
      confirmButtonColor: '#3085d6',
      showCloseButton: true
    });
  };

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
    tooltip: {
      enabled: true,
      y: {
        formatter: function (value) {
          return "LKR " + value.toLocaleString();
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val, opts) {
        const total = expenseByCategory.reduce((a, b) => a + b, 0);
        const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
        return percentage + "%";
      },
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
            <div className="text-center py-4">
              <div className="mb-3">
                <i className="ri-pie-chart-2-line text-3xl text-secondary-light"></i>
              </div>
              <h6 className="text-sm text-secondary-light mb-2">No Expense Statistics</h6>
              <p className="text-xs text-secondary-light mb-3">
                Add some expenses to see your spending patterns visualized.
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Link to="/form-validation" className="btn btn-outline-primary btn-sm">
                  <i className="ri-add-line me-2"></i>Add Expense
                </Link>
                <button className="btn btn-outline-info btn-sm" onClick={showChatGuide}>
                  <i className="ri-chat-1-line me-2"></i>Use Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseStatistics;

