import React from 'react'
import ReactApexChart from 'react-apexcharts'
import { useDashboardData } from '../DashboardDataProvider'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'

const GradientLineChart = () => {
    const { dashboardData, loading, error } = useDashboardData();

    const showChatGuide = () => {
        Swal.fire({
            title: '💡 Use Chat for Easy Transaction Tracking!',
            html: `
                <div class="text-left">
                    <p class="mb-3">Instead of filling out forms, you can simply chat with our AI assistant:</p>
                    <div class="bg-light p-3 rounded mb-3">
                        <strong>For Expenses:</strong><br>
                        • "I spent 5000 on groceries today"<br>
                        • "Paid 2000 for transport yesterday"<br>
                        <strong>For Income:</strong><br>
                        • "I earned 100000 from salary"<br>
                        • "Received 50000 from investment"
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

    const { months = [], cumulativeSavings = [] } = dashboardData;

    // Create dynamic series data
    const chartSeries = [
        {
            name: "Cumulative Savings",
            data: cumulativeSavings && cumulativeSavings.length > 0 ? cumulativeSavings : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
    ];

    const chartOptions = {
        chart: {
            height: 264,
            type: "line",
            toolbar: {
                show: false,
            },
            zoom: {
                enabled: false,
            },
            dropShadow: {
                enabled: false,
                top: 6,
                left: 0,
                blur: 4,
                color: "#000",
                opacity: 0.1,
            },
        },
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                inverseColors: false,
                opacityFrom: 0,
                opacityTo: 0,
                stops: [0, 90, 100],
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            curve: "smooth",
            colors: ["#487FFF"],
            width: 3,
        },
        markers: {
            size: 0,
            strokeWidth: 3,
            hover: {
                size: 8,
            },
        },
        tooltip: {
            enabled: true,
            x: {
                show: true,
            },
            y: {
                formatter: function (value) {
                    return "LKR " + value.toLocaleString();
                },
            },
        },
        grid: {
            row: {
                colors: ["transparent", "transparent"],
                opacity: 0.5,
            },
            borderColor: "#D1D5DB",
            strokeDashArray: 3,
        },
        yaxis: {
            labels: {
                formatter: function (value) {
                    return "LKR " + (value / 1000).toFixed(0) + "k";
                },
                style: {
                    fontSize: "14px",
                },
            },
        },
        xaxis: {
            categories: months && months.length > 0 ? months : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        },
    };

    // Check if we have valid data
    const hasData = months.length > 0 && cumulativeSavings.some(val => val > 0);

    return (
        <div className="col-md-6">
            <div className="card h-100 p-0">
                <div className="card-header border-bottom bg-base py-16 px-24">
                    <h6 className="text-lg fw-semibold mb-0">Cumulative Savings Trend</h6>
                </div>
                <div className="card-body p-24">
                    {hasData ? (
                        <ReactApexChart 
                            id="gradientLineChart" 
                            className="apexcharts-tooltip-style-1" 
                            options={chartOptions} 
                            series={chartSeries} 
                            type="area"
                            height={264} 
                        />
                    ) : (
                        <div className="text-center py-4">
                            <div className="mb-3">
                                <i className="ri-line-chart-line text-3xl text-secondary-light"></i>
                            </div>
                            <h6 className="text-sm text-secondary-light mb-2">No Savings Data</h6>
                            <p className="text-xs text-secondary-light mb-3">
                                Start adding income and expenses to see your cumulative savings trend.
                            </p>
                            <div className="d-flex justify-content-center gap-3">
                                <Link to="/form-validation" className="btn btn-outline-success btn-sm">
                                    <i className="ri-add-line me-2"></i>Add Income
                                </Link>
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

export default GradientLineChart