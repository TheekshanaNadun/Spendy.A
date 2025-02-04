import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

const TransactionTable = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/transactions?page=${page}`, {
                    credentials: 'include'
                });
                
                if (!response.ok) throw new Error('Failed to fetch transactions');
                
                const data = await response.json();
                setTransactions(data);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, [page]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
    };

    return (
        <div className="col-lg-12">
            <div className="card shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
                <div className="card-header d-flex justify-content-between align-items-center py-3 border-bottom">
                    <h5 className="card-title mb-0 text-secondary-light">Transaction History</h5>
                    <div className="d-flex align-items-center gap-2">
                        <button 
                            className="btn btn-sm btn-light px-3 py-1 rounded-pill border"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <Icon icon="mdi:chevron-left" width="20" />
                        </button>
                        <span className="text-muted small">Page {page}</span>
                        <button 
                            className="btn btn-sm btn-light px-3 py-1 rounded-pill border"
                            onClick={() => setPage(p => p + 1)}
                        >
                            <Icon icon="mdi:chevron-right" width="20" />
                        </button>
                    </div>
                </div>

                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table bordered-table mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th scope="col" className="text-secondary-light">ID</th>
                                    <th scope="col" className="text-secondary-light">Item</th>
                                    <th scope="col" className="text-secondary-light">Category</th>
                                    <th scope="col" className="text-secondary-light">Type</th>
                                    <th scope="col" className="text-secondary-light">Date</th>
                                    <th scope="col" className="text-secondary-light">Time</th>
                                    <th scope="col" className="text-secondary-light text-end">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction) => (
                                    <tr key={transaction.transaction_id}>
                                        <td className="font-monospace text-secondary-light">
                                            #{transaction.transaction_id.toString().slice(0, 6)}
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <Icon
                                                    icon={getCategoryIcon(transaction.category)}
                                                    className="flex-shrink-0 me-12 text-primary"
                                                    width="24"
                                                />
                                                <span className="text-secondary-light fw-semibold">
                                                    {transaction.item}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge bg-dark text-light rounded-pill px-24 py-4">
                                                {transaction.category}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${transaction.type === 'Income' 
                                                ? 'bg-success-focus text-success-main' 
                                                : 'bg-danger-focus text-danger-main'} rounded-pill px-24 py-4`}>
                                                {transaction.type}
                                            </span>
                                        </td>
                                        <td className="text-secondary-light">
                                            {new Date(transaction.date).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: 'short'
                                            })}
                                        </td>
                                        <td className="text-secondary-light">
                                            {formatTime(transaction.timestamp)}
                                        </td>
                                        <td className="text-end">
                                            <span className={
                                                `font-monospace ${
                                                    transaction.type === 'Income' 
                                                    ? 'text-success-main' 
                                                    : 'text-danger-main'
                                                }`
                                            }>
                                                {formatCurrency(transaction.price)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const getCategoryIcon = (category) => {
    const icons = {
        'Food': 'mdi:food-drumstick',
        'Transport': 'mdi:car-electric',
        'Bills': 'mdi:receipt',
        'Shopping': 'mdi:tag',
        'Healthcare': 'mdi:heart-pulse',
        'Education': 'mdi:book-open',
        'Income': 'mdi:currency-usd-circle'
    };
    return icons[category] || 'mdi:wallet';
};

export default TransactionTable;
