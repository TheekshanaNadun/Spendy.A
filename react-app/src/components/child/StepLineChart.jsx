import React from 'react'
import ReactApexChart from 'react-apexcharts'
import { useDashboardData } from '../DashboardDataProvider'

const StepLineChart = () => {
    const { dashboardData, loading, error } = useDashboardData();
    if (loading) return <div className="text-center py-4">Loading...</div>;
    if (error) return <div className="text-danger">{error}</div>;
    if (!dashboardData) return <div className="text-secondary">No data available.</div>;

    const { months, netProfit, monthlyIncome, monthlyExpense } = dashboardData;
    const chartOptions = {
        chart: { type: 'line', height: 270 },
        xaxis: { categories: months },
        legend: { show: true, position: 'bottom' },
    };
    const chartSeries = [
        { name: 'Net Profit', data: netProfit },
        { name: 'Income', data: monthlyIncome },
        { name: 'Expense', data: monthlyExpense }
    ];
    return (
        <div className="col-md-6">
            <div className="card h-100 p-0">
                <div className="card-header border-bottom bg-base py-16 px-24">
                    <h6 className="text-lg fw-semibold mb-0">Stepline Charts</h6>
                </div>
                <div className="card-body p-24">
                    <ReactApexChart id="stepLineChart" options={chartOptions} series={chartSeries} type="line"
                        height={270} />
                </div>
            </div>
        </div>
    )
}

export default StepLineChart