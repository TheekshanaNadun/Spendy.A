import React from "react";
import ReactApexChart from "react-apexcharts";
import { useDashboardData } from "../DashboardDataProvider";

const ForecastChart = () => {
  const { forecastData, forecastLoading, forecastError } = useDashboardData();

  if (forecastLoading) return <div>Loading forecast...</div>;
  if (forecastError) return <div className="text-danger">{forecastError}</div>;
  if (!forecastData) return <div>No forecast data available.</div>;

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