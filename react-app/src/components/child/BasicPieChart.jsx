import React from 'react'
import ReactApexChart from 'react-apexcharts'
import { useDashboardData } from '../DashboardDataProvider'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'

const BasicPieChart = () => {
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
    const chartSeries = expenseByCategory && expenseByCategory.length > 0 ? expenseByCategory : [];
    const chartLabels = expenseCategories && expenseCategories.length > 0 ? expenseCategories : [];

    const chartOptions = {
        chart: {
            height: 264,
            type: "pie",
        },
        stroke: {
            show: false,
        },
        labels: chartLabels,
        colors: ["#487FFF", "#FF9F29", "#45B369", "#EF4A00", "#16a34a", "#dc2626", "#7c3aed", "#0891b2"],
        plotOptions: {
            pie: {
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
                const total = chartSeries.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                return percentage + "%";
            },
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
                    <h6 className="text-lg fw-semibold mb-0">Expense by Category</h6>
                </div>
                <div className="card-body p-24 text-center">
                    {chartSeries.length > 0 && chartSeries.some(val => val > 0) ? (
                        <>
                            <ReactApexChart 
                                id="pieChart" 
                                className="d-flex justify-content-center" 
                                options={chartOptions} 
                                series={chartSeries} 
                                type="pie"
                                height={264} 
                                width={380} 
                            />
                            <div className="mt-3">
                                <div className="d-flex flex-wrap gap-20 justify-content-center">
                                    {chartLabels.map((label, index) => (
                                        <div key={index} className='d-flex align-items-center gap-8'>
                                            <span 
                                                className='w-16-px h-16-px radius-2'
                                                style={{ backgroundColor: chartOptions.colors[index % chartOptions.colors.length] }}
                                            />
                                            <span className='text-secondary-light text-sm'>{label}</span>
                                        </div>
                                    ))}
                                </div>
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

export default BasicPieChart