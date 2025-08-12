import React from "react";
import { useDashboardData } from "../DashboardDataProvider";
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const COLORS = [
  "bg-cyan-600",
  "bg-orange",
  "bg-warning-600",
  "bg-success-600",
  "bg-primary-600",
  "bg-yellow-500",
  "bg-pink-500",
  "bg-purple-500",
  "bg-blue-500",
  "bg-green-500",
];

const MonthlyExpenseBreakdown = () => {
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

  const { expenseByCategory, expenseCategories, currentMonthExpense } = dashboardData;

  return (
    <div className='w-100 sidebar-card'>
      <div className='card radius-16 w-100'>
        <div className='card-header'>
          <div className='d-flex align-items-center flex-wrap gap-2 justify-content-between'>
            <h6 className='mb-2 fw-bold text-lg mb-0'>
              Monthly Expense Breakdown
            </h6>
          </div>
        </div>
        <div className='card-body'>
          {expenseByCategory && expenseByCategory.length > 0 ? (
            expenseCategories.map((cat, idx) => {
              const amount = expenseByCategory[idx] || 0;
              const percent = currentMonthExpense ? ((amount / currentMonthExpense) * 100).toFixed(1) : 0;
              const colorClass = COLORS[idx % COLORS.length];
              return (
                <div
                  key={cat}
                  className={`d-flex align-items-center justify-content-between p-12 ${idx % 2 === 0 ? "bg-neutral-100" : "bg-base"}`}
                  style={{ minWidth: 0 }}
                >
                  <div className='d-flex align-items-center gap-2 flex-grow-1' style={{ minWidth: 0 }}>
                    <span className={`w-12-px h-8-px ${colorClass} rounded-pill`} />
                    <span className='text-secondary-light text-truncate' style={{ maxWidth: 120, overflowWrap: 'break-word', wordBreak: 'break-all' }}>{cat}</span>
                  </div>
                  <div className='d-flex align-items-center gap-2' style={{ minWidth: 0 }}>
                    <span className='text-secondary-light'>LKR {amount.toLocaleString()}</span>
                    <span className='text-primary-light fw-semibold'>{percent}%</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4">
              <div className="mb-3">
                <i className="ri-pie-chart-line text-3xl text-secondary-light"></i>
              </div>
              <h6 className="text-sm text-secondary-light mb-2">No Expense Data</h6>
              <p className="text-xs text-secondary-light mb-3">
                Start adding expenses to see your monthly breakdown by category.
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
  );
};

export default MonthlyExpenseBreakdown;
