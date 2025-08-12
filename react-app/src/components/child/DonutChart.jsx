import React from 'react'
import ReactApexChart from 'react-apexcharts'
import { useDashboardData } from '../DashboardDataProvider'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'

const DonutChart = () => {
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

    const { expenseByCategory = [], expenseCategories = [], currentMonthExpense = 0 } = dashboardData;

    // Create dynamic series data from expense categories
    const chartSeries = expenseByCategory && expenseByCategory.length > 0 ? expenseByCategory : [0, 0, 0, 0];
    const chartLabels = expenseCategories && expenseCategories.length > 0 ? expenseCategories : ["No Data"];
    
    // Calculate total for center display
    const totalValue = chartSeries.reduce((a, b) => a + b, 0);

    const chartOptions = {
        chart: {
            height: 264,
            type: "donut",
        },
        stroke: {
            show: false,
        },
        labels: chartLabels,
        colors: ["#487FFF", "#FF9F29", "#45B369", "#EF4A00", "#16a34a", "#dc2626", "#7c3aed", "#0891b2"],
        plotOptions: {
            donut: {
                dataLabels: {
                    dropShadow: {
                        enabled: true,
                    },
                },
            },
        },
        legend: {
            position: "bottom",
            horizontalAlign: "center",
        },
        responsive: [
            {
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200,
                    },
                    legend: {
                        show: false,
                        position: "bottom",
                        horizontalAlign: "center",
                        offsetX: -10,
                        offsetY: 0,
                    },
                },
            },
        ],
    };

    return (
        <div className="col-md-6">
            <div className="card h-100 p-0">
                <div className="card-header border-bottom bg-base py-16 px-24">
                    <h6 className="text-lg fw-semibold mb-0">Expense Distribution</h6>
                </div>
                <div className="card-body p-24 text-center d-flex flex-wrap align-items-start gap-5 justify-content-center">
                    {chartSeries.length > 0 && chartSeries.some(val => val > 0) ? (
                        <>
                            <div className="position-relative">
                                <ReactApexChart 
                                    id="basicDonutChart" 
                                    className="w-auto d-inline-block" 
                                    options={chartOptions} 
                                    series={chartSeries} 
                                    type="donut"
                                    height={264} 
                                />
                                <div className="position-absolute start-50 top-50 translate-middle">
                                    <span className="text-lg text-secondary-light fw-medium">
                                        Total Expenses
                                    </span>
                                    <h4 className="mb-0">LKR {totalValue.toLocaleString()}</h4>
                                </div>
                            </div>
                            <div className="max-w-290-px w-100">
                                <div className="d-flex align-items-center justify-content-between gap-12 border pb-12 mb-12 border-end-0 border-top-0 border-start-0">
                                    <span className="text-primary-light fw-medium text-sm">Category</span>
                                    <span className="text-primary-light fw-medium text-sm">Amount</span>
                                    <span className="text-primary-light fw-medium text-sm">%</span>
                                </div>
                                {chartLabels.map((label, index) => {
                                    const value = chartSeries[index] || 0;
                                    const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : 0;
                                    const color = chartOptions.colors[index % chartOptions.colors.length];
                                    
                                    return (
                                        <div key={index} className="d-flex align-items-center justify-content-between gap-12 mb-12">
                                            <span className="text-primary-light fw-medium text-sm d-flex align-items-center gap-12">
                                                <span 
                                                    className="w-12-px h-12-px rounded-circle" 
                                                    style={{ backgroundColor: color }}
                                                />
                                                {label}
                                            </span>
                                            <span className="text-primary-light fw-medium text-sm">LKR {value.toLocaleString()}</span>
                                            <span className="text-primary-light fw-medium text-sm">
                                                {percentage}%
                                            </span>
                                        </div>
                                    );
                                })}
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
    )
}

export default DonutChart