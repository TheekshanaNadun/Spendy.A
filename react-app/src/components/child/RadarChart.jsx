import React from 'react'
import ReactApexChart from 'react-apexcharts'
import { useDashboardData } from '../DashboardDataProvider'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'

const RadarChart = () => {
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

    const { months = [], netProfit = [], monthlyIncome = [], monthlyExpense = [] } = dashboardData;
    
    // Check if we have valid data
    const hasData = months.length > 0 && (netProfit.some(val => val > 0) || monthlyIncome.some(val => val > 0) || monthlyExpense.some(val => val > 0));
    
    const chartOptions = {
        chart: { 
            type: 'radar', 
            height: 264,
            toolbar: {
                show: false
            }
        },
        xaxis: { 
            categories: months,
            labels: {
                style: {
                    fontSize: '12px'
                }
            }
        },
        yaxis: {
            labels: {
                formatter: function (value) {
                    return "LKR " + (value / 1000).toFixed(0) + "k";
                }
            }
        },
        legend: { 
            show: true, 
            position: 'bottom',
            fontSize: '12px'
        },
        tooltip: {
            enabled: true,
            y: {
                formatter: function (value) {
                    return "LKR " + value.toLocaleString();
                }
            }
        },
        colors: ["#487FFF", "#45B369", "#FF9F29"],
        stroke: {
            width: 2
        },
        fill: {
            opacity: 0.3
        }
    };
    
    const chartSeries = [
        { 
            name: 'Net Profit', 
            data: netProfit && netProfit.length > 0 ? netProfit : [0, 0, 0, 0, 0, 0]
        },
        { 
            name: 'Income', 
            data: monthlyIncome && monthlyIncome.length > 0 ? monthlyIncome : [0, 0, 0, 0, 0, 0]
        },
        { 
            name: 'Expense', 
            data: monthlyExpense && monthlyExpense.length > 0 ? monthlyExpense : [0, 0, 0, 0, 0, 0]
        }
    ];

    return (
        <div className="col-md-6">
            <div className="card h-100 p-0">
                <div className="card-header border-bottom bg-base py-16 px-24">
                    <h6 className="text-lg fw-semibold mb-0">Financial Performance Overview</h6>
                </div>
                <div className="card-body p-24 text-center">
                    {hasData ? (
                        <ReactApexChart 
                            id="radarChart"
                            className="square-marker check-marker series-gap-24 d-flex justify-content-center" 
                            options={chartOptions} 
                            series={chartSeries} 
                            type="radar"
                            height={264} 
                        />
                    ) : (
                        <div className="text-center py-5">
                            <div className="mb-3">
                                <i className="ri-radar-line text-4xl text-secondary-light"></i>
                            </div>
                            <h6 className="text-lg text-secondary-light mb-2">No Financial Data</h6>
                            <p className="text-sm text-secondary-light mb-3">
                                Start adding income and expenses to see your financial performance trends.
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

export default RadarChart