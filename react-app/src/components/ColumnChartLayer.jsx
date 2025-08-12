import React from 'react'
import ReactApexChart from 'react-apexcharts'
import { useDashboardData } from './DashboardDataProvider'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'

const ColumnChartLayer = () => {
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

    const { months = [], monthlyIncome = [], monthlyExpense = [], netProfit = [] } = dashboardData;

    // Create dynamic series data
    const columnChartSeriesOne = [
        {
            name: "Monthly Income",
            data: monthlyIncome && monthlyIncome.length > 0 ? monthlyIncome : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            name: "Monthly Expenses",
            data: monthlyExpense && monthlyExpense.length > 0 ? monthlyExpense : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
    ];

    const columnChartSeriesTwo = [
        {
            name: "Net Profit",
            data: netProfit && netProfit.length > 0 ? netProfit : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
    ];

    const columnChartSeriesThree = [
        {
            name: "Income",
            data: monthlyIncome && monthlyIncome.length > 0 ? monthlyIncome : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            name: "Expenses",
            data: monthlyExpense && monthlyExpense.length > 0 ? monthlyExpense : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            name: "Net Savings",
            data: netProfit && netProfit.length > 0 ? netProfit : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
    ];

    const columnChartSeriesFour = [
        {
            name: "Monthly Spending",
            data: monthlyExpense && monthlyExpense.length > 0 ? monthlyExpense : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
    ];

    // Create dynamic chart options
    const columnChartOptionsOne = {
        colors: ["#487FFF", "#FF9F29"],
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right'
        },
        chart: {
            type: "bar",
            height: 264,
            toolbar: {
                show: false,
            },
        },
        grid: {
            show: true,
            borderColor: "#D1D5DB",
            strokeDashArray: 4,
            position: "back",
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: 10,
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            show: true,
            width: 2,
            colors: ["transparent"],
        },
        xaxis: {
            categories: months && months.length > 0 ? months : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        },
        yaxis: {
            labels: {
                formatter: function (value) {
                    return "LKR " + (value / 1000).toFixed(0) + "k";
                },
            },
        },
        tooltip: {
            y: {
                formatter: function (value) {
                    return "LKR " + value.toLocaleString();
                },
            },
        },
        fill: {
            opacity: 1,
            width: 18,
        },
    };

    const columnChartOptionsTwo = {
        colors: ["#45B369"],
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right'
        },
        chart: {
            type: "bar",
            height: 264,
            toolbar: {
                show: false,
            },
        },
        grid: {
            show: true,
            borderColor: "#D1D5DB",
            strokeDashArray: 4,
            position: "back",
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: 10,
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            show: true,
            width: 2,
            colors: ["transparent"],
        },
        xaxis: {
            categories: months && months.length > 0 ? months : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        },
        yaxis: {
            labels: {
                formatter: function (value) {
                    return "LKR " + (value / 1000).toFixed(0) + "k";
                },
            },
        },
        tooltip: {
            y: {
                formatter: function (value) {
                    return "LKR " + value.toLocaleString();
                },
            },
        },
        fill: {
            opacity: 1,
            width: 18,
        },
    };

    const columnChartOptionsThree = {
        colors: ["#487FFF", "#FF9F29", "#45B369"],
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right'
        },
        chart: {
            type: "bar",
            height: 264,
            toolbar: {
                show: false,
            },
        },
        grid: {
            show: true,
            borderColor: "#D1D5DB",
            strokeDashArray: 4,
            position: "back",
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: 10,
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            show: true,
            width: 2,
            colors: ["transparent"],
        },
        xaxis: {
            categories: months && months.length > 0 ? months : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        },
        yaxis: {
            labels: {
                formatter: function (value) {
                    return "LKR " + (value / 1000).toFixed(0) + "k";
                },
            },
        },
        tooltip: {
            y: {
                formatter: function (value) {
                    return "LKR " + value.toLocaleString();
                },
            },
        },
        fill: {
            opacity: 1,
            width: 18,
        },
    };

    const columnChartOptionsFour = {
        colors: ["#EF4A00"],
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right'
        },
        chart: {
            type: "bar",
            height: 264,
            toolbar: {
                show: false,
            },
        },
        grid: {
            show: true,
            borderColor: "#D1D5DB",
            strokeDashArray: 4,
            position: "back",
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: 10,
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            show: true,
            width: 2,
            colors: ["transparent"],
        },
        xaxis: {
            categories: months && months.length > 0 ? months : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        },
        yaxis: {
            labels: {
                formatter: function (value) {
                    return "LKR " + (value / 1000).toFixed(0) + "k";
                },
            },
        },
        tooltip: {
            y: {
                formatter: function (value) {
                    return "LKR " + value.toLocaleString();
                },
            },
        },
        fill: {
            opacity: 1,
            width: 18,
        },
    };

    // Check if we have valid data
    const hasData = months.length > 0 && (monthlyIncome.some(val => val > 0) || monthlyExpense.some(val => val > 0) || netProfit.some(val => val > 0));

    return (
        <div className="row gy-4">
            {hasData ? (
                <>
                    <div className="col-md-6">
                        <div className="card h-100 p-0">
                            <div className="card-header border-bottom bg-base py-16 px-24">
                                <h6 className="text-lg fw-semibold mb-0">Income vs Expenses</h6>
                            </div>
                            <div className="card-body p-24">
                                <ReactApexChart id="columnChart" options={columnChartOptionsOne} series={columnChartSeriesOne} type="bar" height={264} />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card h-100 p-0">
                            <div className="card-header border-bottom bg-base py-16 px-24">
                                <h6 className="text-lg fw-semibold mb-0">Net Profit Trend</h6>
                            </div>
                            <div className="card-body p-24">
                                <ReactApexChart id="columnGroupBarChart" options={columnChartOptionsTwo} series={columnChartSeriesTwo} type="bar" height={264} />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card h-100 p-0">
                            <div className="card-header border-bottom bg-base py-16 px-24">
                                <h6 className="text-lg fw-semibold mb-0">Financial Overview</h6>
                            </div>
                            <div className="card-body p-24">
                                <ReactApexChart id="groupColumnBarChart" options={columnChartOptionsThree} series={columnChartSeriesThree} type="bar" height={264} />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card h-100 p-0">
                            <div className="card-header border-bottom bg-base py-16 px-24">
                                <h6 className="text-lg fw-semibold mb-0">Monthly Spending</h6>
                            </div>
                            <div className="card-body p-24">
                                <ReactApexChart id="upDownBarchart" options={columnChartOptionsFour} series={columnChartSeriesFour} type="bar" height={264} />
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="col-12">
                    <div className="card">
                        <div className="card-body text-center py-5">
                            <div className="mb-3">
                                <i className="ri-bar-chart-line text-4xl text-secondary-light"></i>
                            </div>
                            <h6 className="text-lg text-secondary-light mb-2">No Financial Data</h6>
                            <p className="text-sm text-secondary-light mb-3">
                                Start adding income and expenses to see your financial trends in column charts.
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
                    </div>
                </div>
            )}
        </div>
    )
}

export default ColumnChartLayer