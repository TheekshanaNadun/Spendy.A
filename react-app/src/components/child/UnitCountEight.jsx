import React from 'react'
import { useDashboardData } from '../DashboardDataProvider'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'

const UnitCountEight = () => {
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

    const { currentMonthIncome = 0, currentMonthExpense = 0, netProfit = 0, totalSavings = 0 } = dashboardData;

    // Check if we have any financial data
    const hasData = currentMonthIncome > 0 || currentMonthExpense > 0 || netProfit > 0 || totalSavings > 0;

    return (
        <div className="row gy-4">
            {hasData ? (
                <>
                    <div className="col-xxl-3 col-md-6">
                        <div className="card h-100 p-0">
                            <div className="card-body p-24">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h6 className="text-lg fw-semibold mb-2">Monthly Income</h6>
                                        <h4 className="text-success mb-0">LKR {currentMonthIncome.toLocaleString()}</h4>
                                    </div>
                                    <div className="bg-success-100 p-3 rounded">
                                        <i className="ri-bank-line text-success text-2xl"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xxl-3 col-md-6">
                        <div className="card h-100 p-0">
                            <div className="card-body p-24">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h6 className="text-lg fw-semibold mb-2">Monthly Expenses</h6>
                                        <h4 className="text-danger mb-0">LKR {currentMonthExpense.toLocaleString()}</h4>
                                    </div>
                                    <div className="bg-danger-100 p-3 rounded">
                                        <i className="ri-money-dollar-circle-line text-danger text-2xl"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xxl-3 col-md-6">
                        <div className="card h-100 p-0">
                            <div className="card-body p-24">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h6 className="text-lg fw-semibold mb-2">Net Profit</h6>
                                        <h4 className={`mb-0 ${netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                                            LKR {netProfit.toLocaleString()}
                                        </h4>
                                    </div>
                                    <div className={`p-3 rounded ${netProfit >= 0 ? 'bg-success-100' : 'bg-danger-100'}`}>
                                        <i className={`ri-arrow-${netProfit >= 0 ? 'up' : 'down'}-line text-2xl ${netProfit >= 0 ? 'text-success' : 'text-danger'}`}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xxl-3 col-md-6">
                        <div className="card h-100 p-0">
                            <div className="card-body p-24">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h6 className="text-lg fw-semibold mb-2">Total Savings</h6>
                                        <h4 className="text-primary mb-0">LKR {totalSavings.toLocaleString()}</h4>
                                    </div>
                                    <div className="bg-primary-100 p-3 rounded">
                                        <i className="ri-piggy-bank-line text-primary text-2xl"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="col-12">
                    <div className="card">
                        <div className="card-body text-center py-5">
                            <div className="mb-3">
                                <i className="ri-dashboard-line text-4xl text-secondary-light"></i>
                            </div>
                            <h6 className="text-lg text-secondary-light mb-2">No Financial Data</h6>
                            <p className="text-sm text-secondary-light mb-3">
                                Start adding income and expenses to see your financial overview.
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

export default UnitCountEight
