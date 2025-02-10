import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

const TablesBorderColors = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch transactions with session handling
    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/transactions/income', {
                    credentials: 'include' // Essential for session cookies
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                setTransactions(data);
                setError(null);
            } catch (error) {
                console.error('Error fetching transactions:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, []);

    // Category icons with more comprehensive list
    const getCategoryIcon = (category) => {
        const icons = {
            'Food': 'mdi:food',
            'Transport': 'mdi:car',
            'Bills': 'mdi:file-document',
            'Shopping': 'mdi:shopping',
            'Healthcare': 'mdi:hospital',
            'Education': 'mdi:school',
            'Entertainment': 'mdi:party-popper',
            'Utilities': 'mdi:lightbulb',
            'Travel': 'mdi:airplane',
            'Groceries': 'mdi:cart',
            'Income': 'mdi:cash-multiple'
        };
        return icons[category] || 'mdi:wallet';
    };

    // Maintain 5-row structure
    const displayData = transactions.length >= 5 ? 
        transactions.slice(0, 5) : 
        [...transactions, ...Array(5 - transactions.length).fill({})];

    return (
        <div className="col-lg-6">
            <div className="card">
                <div className="card-header">
                    <h5 className="card-title mb-0">Income History</h5>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="alert alert-danger">
                            Error loading transactions: {error}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table border-primary-table mb-0">
                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th>Category</th>
                                        <th style={{ width: '100px' }}>Date</th>
                                        <th style={{ width: '100px' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayData.map((transaction, index) => (
                                        <tr key={transaction.transaction_id || index}>
                                            <td>{transaction.item || '----------'}</td>
                                           
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <Icon 
                                                        icon={getCategoryIcon(transaction.category)} 
                                                        className="me-2" 
                                                        width={20}
                                                    />
                                                    {transaction.category || 'N/A'}
                                                </div>
                                            </td>
                                            <td>
                                                {transaction.date ? 
                                                    new Date(transaction.date).toLocaleDateString('en-GB') : 
                                                    '--/--/----'}
                                            </td>
                                           
                                           
                                            <td className={`fw-bold text-end ${
                                                transaction.type === 'Income' ? 'text-success' : 'text-danger' 
                                            }`}>
                                                {transaction.price ? 
                                                    new Intl.NumberFormat('en-LK', {
                                                        style: 'currency',
                                                        currency: 'LKR',
                                                        minimumFractionDigits: 0
                                                    }).format(transaction.price) : 
                                                    '-----'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TablesBorderColors;
