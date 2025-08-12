import React from "react";
import useReactApexChart from "../../hook/useReactApexChart";
import ReactApexChart from "react-apexcharts";
import { useDashboardData } from "../DashboardDataProvider";
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'

const OverallReport = () => {
  const { dashboardData, loading, error } = useDashboardData();
  let { userOverviewDonutChartOptionsTwo, userOverviewDonutChartSeriesTwo } =
    useReactApexChart();

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

  // Get real data from dashboard
  const { expenseByCategory = [], expenseCategories = [], currentMonthExpense = 0 } = dashboardData;
  
  // Create real series data from expense categories
  const realSeries = expenseByCategory && expenseByCategory.length > 0 ? expenseByCategory : [0, 0, 0, 0];
  const realLabels = expenseCategories && expenseCategories.length > 0 ? expenseCategories : ["No Data"];
  
  // Update chart options with real labels and LKR currency
  const updatedChartOptions = {
    ...userOverviewDonutChartOptionsTwo,
    labels: realLabels,
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
        const total = realSeries.reduce((a, b) => a + b, 0);
        const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
        return percentage + "%";
      },
    },
  };

  return (
    <div className='col-xxl-4 col-md-6'>
      <div className='card h-100 p-0'>
        <div className='card-header border-bottom bg-base py-16 px-24'>
          <h6 className='text-lg fw-semibold mb-0'>Expense Breakdown</h6>
        </div>
        <div className='card-body p-24'>
          {realSeries.length > 0 && realSeries.some(val => val > 0) ? (
            <>
              <div className='mt-32'>
                <div
                  id='userOverviewDonutChart'
                  className='mx-auto apexcharts-tooltip-z-none'
                >
                  <ReactApexChart
                    options={updatedChartOptions}
                    series={realSeries}
                    type='donut'
                    height={270}
                  />
                </div>
              </div>
              <div className='d-flex flex-wrap gap-20 justify-content-center mt-48'>
                {realLabels.map((label, index) => (
                  <div key={index} className='d-flex align-items-center gap-8'>
                    <span 
                      className={`w-16-px h-16-px radius-2`}
                      style={{ backgroundColor: updatedChartOptions.colors[index % updatedChartOptions.colors.length] }}
                    />
                    <span className='text-secondary-light'>{label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="ri-pie-chart-2-line text-4xl text-secondary-light"></i>
              </div>
              <h6 className="text-lg text-secondary-light mb-2">No Expense Data</h6>
              <p className="text-sm text-secondary-light mb-3">
                Start adding expenses to see your spending breakdown by category.
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

export default OverallReport;
