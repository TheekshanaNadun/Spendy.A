import React, { useState, useEffect } from 'react';
import $ from 'jquery';
import 'datatables.net-dt/js/dataTables.dataTables.js';
import { Icon } from '@iconify/react';

const TransactionTable = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const itemsPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);


    useEffect(() => {
      const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/transactions?page=${currentPage}&per_page=${itemsPerPage}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format from server');
            }

            if ($.fn.DataTable.isDataTable('#transactionTable')) {
                $('#transactionTable').DataTable().destroy();
            }

            const formattedTransactions = data.map(t => ({
                ...t,
                date: new Date(t.date).toISOString().split('T')[0],
                price: Number(t.price)
            }));

            setTransactions(formattedTransactions);
            setTotalItems(data.length);
            setError(null);
            
            $('#transactionTable').DataTable({
                paging: false,
                searching: true,
                info: false
            });

        } catch (error) {
            console.error('Error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };
    fetchTransactions();
}, [currentPage]);

const totalPages = Math.ceil(totalItems / itemsPerPage);

const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
    }
};

    const getCategoryIcon = (category) => {
        const icons = {
            // Expense Categories
            'Food & Groceries': 'mdi:cart',
            'Public Transportation (Bus/Train)': 'mdi:bus',
            'Three Wheeler Fees': 'mdi:car',
            'Electricity (CEB)': 'mdi:flash',
            'Water Supply': 'mdi:water',
            'Entertainment': 'mdi:party-popper',
            'Mobile Prepaid': 'mdi:cellphone',
            'Internet (ADSL/Fiber)': 'mdi:ethernet',
            'Hospital Charges': 'mdi:hospital',
            'School Fees': 'mdi:school',
            'University Expenses': 'mdi:university',
            'Educational Materials': 'mdi:book-open',
            'Clothing & Textiles': 'mdi:tshirt-crew',
            'House Rent': 'mdi:home',
            'Home Maintenance': 'mdi:tools',
            'Family Events': 'mdi:account-group',
            'Petrol/Diesel': 'mdi:gas-station',
            'Vehicle Maintenance': 'mdi:wrench',
            'Vehicle Insurance': 'mdi:car-brake-alert',
            'Bank Loans': 'mdi:bank',
            'Credit Card Payments': 'mdi:credit-card',
            'Income Tax': 'mdi:currency-usd',
    
            // Income Categories
            'Salary': 'mdi:wallet',
            'Foreign Remittances': 'mdi:airplane',
            'Rental Income': 'mdi:home-city',
            'Agricultural Income': 'mdi:corn',
            'Business Profits': 'mdi:briefcase',
            'Investment Returns': 'mdi:chart-line',
            'Government Allowances': 'mdi:hand-coin',
            'Freelance Income': 'mdi:laptop'
        };
        return icons[category] || 'mdi:wallet';
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
                Error loading transactions: {error}
            </div>
        );
    }

    return (
      
      <div style={{ padding: '20px' }}>
      <div style={{ 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid var(--border-color, #E5E7EB)'
      }}>
          <div style={{
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-color, #E5E7EB)'
          }}>
              <h5 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                  Transaction History
              </h5>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span>
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                  </span>
                  <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color, #E5E7EB)',
                          backgroundColor: currentPage !== 1 ? 'white' : '#f3f4f6',
                          cursor: currentPage !== 1 ? 'pointer' : 'not-allowed'
                      }}
                  >
                      Previous
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color, #E5E7EB)',
                          backgroundColor: currentPage !== totalPages ? 'white' : '#f3f4f6',
                          cursor: currentPage !== totalPages ? 'pointer' : 'not-allowed'
                      }}
                  >
                      Next
                  </button>
              </div>
          </div>
        <div style={{ padding: '20px' }}>
            <div style={{ 
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid var(--border-color, #E5E7EB)'
            }}>
                <div style={{
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border-color, #E5E7EB)'
                }}>
                    <h5 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                        Transaction History
                    </h5>
                </div>

                <div style={{ padding: '1rem' }}>
                    <table id="transactionTable" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                        {/* Table header remains the same */}
                        <tbody>
                            {transactions.map((transaction) => (
                                <tr key={transaction.transaction_id}>
                                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Icon icon={getCategoryIcon(transaction.category)} width="20" />
                                            <span>{transaction.item}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)' }}>
                                        {transaction.type || 'N/A'}
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '999px',
                                            fontSize: '0.875rem',
                                            backgroundColor: 'rgba(var(--badge-bg), 0.1)',
                                            color: 'var(--text-color)'
                                        }}>
                                            {transaction.category || 'Other'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)' }}>
                                        {transaction.location || 'N/A'}
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)' }}>
                                        {new Date(transaction.date).toLocaleDateString('en-GB')}
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)' }}>
                                        {transaction.timestamp}
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #E5E7EB)', textAlign: 'right' }}>
                                        <span style={{ color: transaction.type === 'Income' ? 'var(--success)' : 'var(--danger)' }}>
                                            {new Intl.NumberFormat('en-LK', {
                                                style: 'currency',
                                                currency: 'LKR'
                                            }).format(transaction.price)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>  </div>
        </div>
    

    );
};

export default TransactionTable;
