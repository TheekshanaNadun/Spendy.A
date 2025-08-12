import { Icon } from '@iconify/react/dist/iconify.js';
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const TransactionForm = () => {
    const [formData, setFormData] = useState({
        item: '',
        price: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        type: 'Expense',
        timestamp: '',
        location: '',
        latitude: null,
        longitude: null
    });

    const [categories, setCategories] = useState([]);
    const [geolocationError, setGeolocationError] = useState('');

    // Fetch categories from backend
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/categories', {
                    credentials: 'include'
                });
                const data = await response.json();
                setCategories(data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCategoryChange = (e) => {
        const [category, type] = e.target.value.split('|');
        setFormData(prev => ({
            ...prev,
            category,
            type
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (!formData.category || !formData.type) {
                throw new Error('Please select a valid category');
            }

            const priceValue = parseFloat(formData.price);
            if (isNaN(priceValue) || priceValue <= 0) {
                throw new Error('Please enter a valid positive number for price');
            }

            // Convert price to decimal format for backend processing
            const formattedPrice = priceValue.toFixed(2);

            // Geolocation handling with fallback
            let coords = { latitude: null, longitude: null };
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000
                    });
                });
                coords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                setGeolocationError('');
            } catch (error) {
                console.warn('Geolocation error:', error);
                setGeolocationError('Location services disabled - coordinates not recorded');
            }

            // Prepare payload with proper data types
            const payload = {
                item: formData.item,
                price: formData.price,  // Keep as string "999.00"
                date: formData.date,
                category: formData.category,
                type: formData.type,
                location: formData.location,
                timestamp: formData.timestamp || null,
                latitude: coords.latitude,
                longitude: coords.longitude
            };

            const response = await fetch('http://localhost:5000/api/transactions', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const responseData = await response.json();

            if (!response.ok) {
                // Handle category conflicts specifically
                if (response.status === 409) {
                    throw new Error(responseData.error || 'Category conflict detected');
                }
                throw new Error(responseData.error || 'Transaction failed');
            }

            MySwal.fire({
                title: 'Transaction Saved! 🎉',
                html: `
                    <div class="text-center">
                        <p class="mb-3">Your transaction has been successfully recorded!</p>
                        <div class="bg-light p-3 rounded">
                            <strong>Details:</strong><br>
                            <span class="text-success">${formData.item}</span> - LKR ${formData.price}<br>
                            <span class="text-muted">${formData.category} (${formData.type})</span>
                        </div>
                    </div>
                `,
                icon: 'success',
                confirmButtonColor: '#28a745',
                confirmButtonText: 'Great!',
                timer: 3000
            });

            // Reset form while maintaining category/type selection
            setFormData(prev => ({
                ...prev,
                item: '',
                price: '',
                location: '',
                latitude: null,
                longitude: null
            }));

        } catch (error) {
            MySwal.fire({
                title: <strong>Error!</strong>,
                html: <p>{error.message}</p>,
                icon: 'error',
                confirmButtonColor: '#dc3545'
            });
        }
    };

    return (
        <div className="col-lg-12">
            <div className="card">
                <div className="card-header">
                    <h5 className="card-title mb-0">Transaction Record</h5>
                </div>
                <div className="card-body">
                    <form className="row gy-3 needs-validation" noValidate onSubmit={handleSubmit}>
                        {/* Item Field */}
                        <div className="col-md-6">
                            <label className="form-label">Item</label>
                            <input
                                type="text"
                                className="form-control"
                                name="item"
                                value={formData.item}
                                onChange={handleChange}
                                placeholder="Enter item name"
                                required
                            />
                            <div className="invalid-feedback">Please enter an item</div>
                        </div>

                        {/* Price Field */}
                        <div className="col-md-3">
                            <label className="form-label">Price (Rs.)</label>
                            <input
                                type="number"
                                className="form-control"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="0.00"
                                step="0.01"
                                required
                            />
                            <div className="invalid-feedback">Please enter valid price</div>
                        </div>

                        {/* Date Field */}
                        <div className="col-md-3">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-control"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Category Field */}
                        <div className="col-md-6">
                            <label className="form-label">Category</label>
                            <select 
                                className="form-select" 
                                name="category"
                                value={`${formData.category}|${formData.type}`}
                                onChange={handleCategoryChange}
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.category_id} value={`${cat.name}|${cat.type}`}>
                                        {cat.name} ({cat.type})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Time Field */}
                        <div className="col-md-6">
                            <label className="form-label">Time</label>
                            <input
                                type="time"
                                className="form-control"
                                name="timestamp"
                                value={formData.timestamp}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Location Field */}
                        <div className="col-md-12">
                            <label className="form-label">Location</label>
                            <input
                                type="text"
                                className="form-control"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="Enter location"
                            />
                        </div>

                        {/* Geolocation Warning */}
                        {geolocationError && (
                            <div className="col-12 text-warning small mt-2">
                                <Icon icon="mdi:alert-circle-outline" className="me-2 align-middle" />
                                {geolocationError}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="col-12 mt-4">
                            <button 
                                className="btn btn-primary d-flex align-items-center justify-content-center gap-2" 
                                type="submit"
                                style={{ 
                                    width: '200px', 
                                    margin: '0 auto',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 8px rgba(13, 110, 253, 0.15)'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(13, 110, 253, 0.25)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(13, 110, 253, 0.15)';
                                }}
                            >
                                <Icon icon="material-symbols:send" className="fs-5" />
                                <span>Submit Transaction</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TransactionForm;
