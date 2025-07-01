import React from "react";
import { useDashboardData } from "../DashboardDataProvider";

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
                    <span className='text-secondary-light'>${amount.toLocaleString()}</span>
                    <span className='text-primary-light fw-semibold'>{percent}%</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-secondary-light">No expense data to display.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyExpenseBreakdown;
