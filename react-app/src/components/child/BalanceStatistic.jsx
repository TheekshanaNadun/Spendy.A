import React from "react";
import ReactApexChart from "react-apexcharts";
import { useDashboardData } from "../DashboardDataProvider";

// Helper function to format currency
const formatCurrency = (value) => {
  const safeValue = isNaN(value) || value === undefined || value === null ? 0 : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR', // Sri Lankan Rupees, change if needed
    minimumFractionDigits: 2,
  }).format(safeValue);
};

const safeNumber = (val) => (typeof val === "number" && !isNaN(val) ? val : 0);

const BalanceStatistic = () => {
  const { dashboardData, loading, error } = useDashboardData();

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (error) return <div className="text-danger">{error}</div>;
  if (!dashboardData) return <div className="text-secondary">No data available.</div>;

  const { months, monthlyIncome, monthlyExpense } = dashboardData;

  const lastIncome = safeNumber(monthlyIncome?.[monthlyIncome.length - 1]);
  const lastExpense = safeNumber(monthlyExpense?.[monthlyExpense.length - 1]);
  const thisMonthBalance = Math.round((lastIncome - lastExpense) * 100) / 100;

  const chartSeries = [
    { name: "Income", data: monthlyIncome || [] },
    { name: "Expense", data: monthlyExpense || [] },
  ];

  const chartOptions = {
    chart: {
      type: 'bar',
      height: 250,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded',
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: months,
    },
    yaxis: {
      title: { text: 'LKR' },
      labels: {
        formatter: (val) => (isNaN(val) ? '0' : val.toLocaleString()),
      },
    },
    fill: { opacity: 1 },
    tooltip: {
      y: {
        formatter: (val) => `LKR ${(isNaN(val) ? 0 : val).toLocaleString()}`,
      },
    },
    colors: ["#487FFF", "#FF9F29"],
    grid: {
      borderColor: '#f1f1f1',
    }
  };

  return (
    <div className='col-12'>
      <div className='card h-100'>
        <div className='card-body'>
          <div className='d-flex align-items-center flex-wrap gap-2 justify-content-between'>
            <h6 className='mb-2 fw-bold text-lg mb-0'>Balance Statistic</h6>
          </div>
          <ul className='d-flex flex-wrap align-items-center justify-content-center mt-3 gap-3'>
            <li className='d-flex align-items-center gap-2'>
              <span className='w-12-px h-12-px rounded-circle bg-primary-600' />
              <span className='text-secondary-light text-sm fw-semibold'>
                This Month's Income:
                <span className='text-primary-light fw-bold ms-1'>
                  {formatCurrency(lastIncome)}
                </span>
              </span>
            </li>
            <li className='d-flex align-items-center gap-2'>
              <span className='w-12-px h-12-px rounded-circle bg-yellow' />
              <span className='text-secondary-light text-sm fw-semibold'>
                This Month's Expense:
                <span className='text-primary-light fw-bold ms-1'>
                  {formatCurrency(lastExpense)}
                </span>
              </span>
            </li>
            <li className='d-flex align-items-center gap-2'>
              <span className='w-12-px h-12-px rounded-circle bg-purple-600' />
              <span className='text-secondary-light text-sm fw-semibold'>
                This Month Balance:
                <span className='text-primary-light fw-bold ms-1'>
                  {formatCurrency(thisMonthBalance)}
                </span>
              </span>
            </li>
          </ul>
          <div className='mt-40'>
            <div id='balanceStatistics'>
              <ReactApexChart
                options={chartOptions}
                series={chartSeries}
                type='bar'
                height={250}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceStatistic;
