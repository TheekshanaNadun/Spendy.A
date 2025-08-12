import React from "react";
import ReactApexChart from "react-apexcharts";
import { useDashboardData } from "../DashboardDataProvider";

const ForecastChart = () => {
  const { forecastData, forecastLoading, forecastError } = useDashboardData();

  if (forecastLoading) return <div>Loading forecast...</div>;
  if (forecastError) return <div className="text-danger">{forecastError}</div>;
  if (!forecastData) return <div>No forecast data available.</div>;

  // Check if there's enough data to display meaningful forecast
  const hasData = forecastData.income && forecastData.income.length > 0 && forecastData.expense && forecastData.expense.length > 0;
  
  if (!hasData) {
    return (
      <div className="card radius-16">
        <div className="card-header">
          <h6 className="mb-2 fw-bold text-lg mb-0">Next 30 Days Forecast</h6>
        </div>
        <div className="card-body">
          <div className="text-center py-5">
            <div className="mb-3">
              <i className="ri-line-chart-line text-4xl text-secondary-light"></i>
            </div>
            <h6 className="text-lg text-secondary-light mb-2">No Forecast Data Available</h6>
            <p className="text-sm text-secondary-light mb-3">
              Start adding transactions to enable AI-powered financial forecasting.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <button className="btn btn-primary btn-sm">
                <i className="ri-add-line me-2"></i>Add Income
              </button>
              <button className="btn btn-outline-primary btn-sm">
                <i className="ri-add-line me-2"></i>Add Expense
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper to round to 2 decimals
  const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

  // Calculate next month and next week predictions (rounded to 2 decimals)
  const nextMonthIncome = round2((forecastData.income || []).reduce((a, b) => a + b, 0));
  const nextMonthExpense = round2((forecastData.expense || []).reduce((a, b) => a + b, 0));
  const nextWeekExpense = round2((forecastData.expense || []).slice(0, 7).reduce((a, b) => a + b, 0));

  const chartOptions = {
    chart: {
      type: "line",
      height: 350,
      toolbar: { show: false }
    },
    xaxis: {
      categories: forecastData.dates,
      title: { text: "Date" },
      labels: { rotate: -45 }
    },
    yaxis: {
      title: { text: "LKR" }
    },
    colors: ["#F26240", "#02BCAF"],
    legend: { position: "top" },
    tooltip: {
      y: {
        formatter: (val) => `LKR ${round2(val).toLocaleString()}`,
      },
    },
  };

  const chartSeries = [
    {
      name: "Expense Forecast",
      data: (forecastData.expense || []).map(round2)
    },
    {
      name: "Income Forecast",
      data: (forecastData.income || []).map(round2)
    }
  ];

  return (
    <div className="card radius-16">
      <div className="card-header">
        <h6 className="mb-2 fw-bold text-lg mb-0">Next 30 Days Forecast</h6>
      </div>
      <div className="card-body">
        <div className="row mb-4">
          <div className="col-md-6 mb-2">
            <div className="card bg-primary-100 p-3 text-center radius-12">
              <div className="fw-bold text-md mb-1">Next Month Prediction</div>
              <div className="d-flex justify-content-center align-items-center gap-4">
                <span className="fw-bold text-success">Income: LKR {nextMonthIncome.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                <span className="fw-bold text-danger">Expense: LKR {nextMonthExpense.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-2">
            <div className="card bg-warning-100 p-3 text-center radius-12">
              <div className="fw-bold text-md mb-1">Next Week Expense Prediction</div>
              <span className="fw-bold text-danger">LKR {nextWeekExpense.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>
        <ReactApexChart
          options={chartOptions}
          series={chartSeries}
          type="line"
          height={350}
        />
      </div>
    </div>
  );
};

export default ForecastChart; 