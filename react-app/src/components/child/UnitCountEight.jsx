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

    // Use the correct fields from dashboard data
    const { 
        currentMonthIncome = 0, 
        currentMonthExpense = 0, 
        netProfitCurrent = 0, 
        totalSavings = 0 
    } = dashboardData;

    // Debug logging to see what data we're getting
    console.log('Dashboard Data received:', dashboardData);
    console.log('Current Month Income:', currentMonthIncome);
    console.log('Current Month Expense:', currentMonthExpense);
    console.log('Net Profit Current:', netProfitCurrent);
    console.log('Total Savings:', totalSavings);

    // Ensure we have valid numbers
    const safeIncome = typeof currentMonthIncome === 'number' ? currentMonthIncome : 0;
    const safeExpense = typeof currentMonthExpense === 'number' ? currentMonthExpense : 0;
    const safeNetProfit = typeof netProfitCurrent === 'number' ? netProfitCurrent : 0;
    const safeTotalSavings = typeof totalSavings === 'number' ? totalSavings : 0;

    // Check if we have any financial data
    const hasData = safeIncome > 0 || safeExpense > 0 || Math.abs(safeNetProfit) > 0 || Math.abs(safeTotalSavings) > 0;

    return (
        <div className="row gy-4">
            {hasData ? (
                <>
                    <div className="col-xxl-3 col-md-6">
                        <div className="card h-100">
                            <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p className="text-muted mb-1 small">Monthly Income</p>
                                        <h6 className="text-success mb-0 fw-normal">LKR {safeIncome.toLocaleString()}</h6>
                                    </div>
                                    <div className="text-success">
                                        <i className="ri-bank-line text-lg"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xxl-3 col-md-6">
                        <div className="card h-100">
                            <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p className="text-muted mb-1 small">Monthly Expenses</p>
                                        <h6 className="text-danger mb-0 fw-normal">LKR {safeExpense.toLocaleString()}</h6>
                                    </div>
                                    <div className="text-danger">
                                        <i className="ri-money-dollar-circle-line text-lg"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xxl-3 col-md-6">
                        <div className="card h-100">
                            <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p className="text-muted mb-1 small">Net Profit</p>
                                        <h6 className={`mb-0 fw-normal ${safeNetProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                                            LKR {safeNetProfit.toLocaleString()}
                                        </h6>
                                    </div>
                                    <div className={safeNetProfit >= 0 ? 'text-success' : 'text-danger'}>
                                        <i className={`ri-arrow-${safeNetProfit >= 0 ? 'up' : 'down'}-line text-lg`}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xxl-3 col-md-6">
                        <div className="card h-100">
                            <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p className="text-muted mb-1 small">Total Savings</p>
                                        <h6 className={`mb-0 fw-normal ${safeTotalSavings >= 0 ? 'text-primary' : 'text-danger'}`}>
                                            LKR {safeTotalSavings.toLocaleString()}
                                        </h6>
                                    </div>
                                    <div className={safeTotalSavings >= 0 ? 'text-primary' : 'text-danger'}>
                                        <i className="ri-piggy-bank-line text-lg"></i>
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
                                <i className="ri-dashboard-line text-3xl text-muted"></i>
                            </div>
                            <h6 className="text-muted mb-2 small">No Financial Data</h6>
                            <p className="text-muted mb-3 small">
                                Start adding income and expenses to see your financial overview.
                            </p>
                            <div className="d-flex justify-content-center gap-3">
                                <Link 
                                    to="/form-validation" 
                                    className="btn btn-outline-success btn-sm"
                                    style={{
                                        borderRadius: '6px',
                                        padding: '8px 16px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease',
                                        borderWidth: '1.5px'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(25, 135, 84, 0.2)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <i className="ri-add-line me-2"></i>Add Income
                                </Link>
                                <Link 
                                    to="/form-validation" 
                                    className="btn btn-outline-primary btn-sm"
                                    style={{
                                        borderRadius: '6px',
                                        padding: '8px 16px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease',
                                        borderWidth: '1.5px'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(13, 110, 253, 0.2)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <i className="ri-add-line me-2"></i>Add Expense
                                </Link>
                                <button 
                                    className="btn btn-outline-info btn-sm" 
                                    onClick={showChatGuide}
                                    style={{
                                        borderRadius: '6px',
                                        padding: '8px 16px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease',
                                        borderWidth: '1.5px'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(13, 202, 240, 0.2)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
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
