import React from 'react'
import useReactApexChart from '../../hook/useReactApexChart'
import ReactApexChart from 'react-apexcharts'
import { useDashboardData } from '../DashboardDataProvider'

const DoubleLineChart = () => {
    const { dashboardData, loading, error } = useDashboardData();
    let { doubleLineChartSeries, doubleLineChartOptions } = useReactApexChart()

    if (loading) return <div className="text-center py-4">Loading...</div>;
    if (error) return <div className="text-danger">{error}</div>;
    if (!dashboardData) return <div className="text-secondary">No data available.</div>;

    // Get real data from dashboard
    const { months = [], monthlyIncome = [], monthlyExpense = [] } = dashboardData;
    
    // Create real series data - Income vs Expense comparison
    const realSeries = [
        {
            name: "Monthly Income",
            data: monthlyIncome || []
        },
        {
            name: "Monthly Expenses", 
            data: monthlyExpense || []
        }
    ];

    // Update chart options with real data and LKR currency
    const updatedChartOptions = {
        ...doubleLineChartOptions,
        xaxis: {
            ...doubleLineChartOptions.xaxis,
            categories: months || []
        },
        tooltip: {
            enabled: true,
            x: {
                format: "MMM yyyy",
            },
            y: {
                formatter: function (value) {
                    return "LKR " + value.toLocaleString();
                },
            },
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right',
            fontSize: '12px',
            labels: { useSeriesColors: false },
            itemMargin: { horizontal: 8, vertical: 2 },
        },
    };

    return (
        <div className="col-md-6">
            <div className="card h-100 p-0">
                <div className="card-header border-bottom bg-base py-16 px-24">
                    <h6 className="text-lg fw-semibold mb-0">Income vs Expense Trend</h6>
                </div>
                <div className="card-body p-24">
                    {realSeries[0].data.length > 0 && realSeries[1].data.length > 0 ? (
                        <ReactApexChart 
                            id="doubleLineChart" 
                            options={updatedChartOptions} 
                            series={realSeries} 
                            type="line"
                            height={264} 
                        />
                    ) : (
                        <div className="text-center py-4">
                            <div className="mb-3">
                                <i className="ri-line-chart-line text-3xl text-secondary-light"></i>
                            </div>
                            <h6 className="text-sm text-secondary-light mb-2">No Financial Data</h6>
                            <p className="text-xs text-secondary-light mb-3">
                                Start adding income and expenses to see your monthly trends.
                            </p>
                            <div className="d-flex justify-content-center gap-3">
                                <button className="btn btn-outline-success btn-sm">
                                    <i className="ri-add-line me-2"></i>Add Income
                                </button>
                                <button className="btn btn-outline-primary btn-sm">
                                    <i className="ri-add-line me-2"></i>Add Expense
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DoubleLineChart