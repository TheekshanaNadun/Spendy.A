import { Icon } from '@iconify/react/dist/iconify.js';
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const TransactionForm = () => {
    const [formData, setFormData] = useState({
        item: '',
        price: '',
        date: '',
        category: '',
        type: '',
        timestamp: '',
        location: '',
        latitude: null,
        longitude: null
    });

    const [geolocationError, setGeolocationError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Convert price to integer (whole number)
            const priceValue = Math.round(parseFloat(formData.price));
            
            if (isNaN(priceValue) || priceValue <= 0) {
                throw new Error('Please enter a valid positive number for price');
            }

            // Get geolocation
            let coords = { latitude: null, longitude: null };
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        resolve, 
                        reject, 
                        { enableHighAccuracy: true, timeout: 5000 }
                    );
                });
                coords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                setGeolocationError('');
            } catch (error) {
                setGeolocationError('Location services disabled - using default coordinates');
            }

            const transactionData = {
                ...formData,
                price: priceValue,  // Send as whole number
                ...coords
            };

            const response = await fetch('http://localhost:5000/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData),
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Transaction failed');
            }

            MySwal.fire({
                title: <strong>Success!</strong>,
                html: <p>Transaction recorded</p>,
                icon: 'success',
                confirmButtonColor: '#28a745',
                timer: 2000
            });

            setFormData({
                item: '',
                price: '',
                date: '',
                category: '',
                type: '',
                timestamp: '',
                location: '',
                latitude: null,
                longitude: null
            });

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
                        <div className="col-md-4">
                            <label className="form-label">Category</label>
                            <select 
                                className="form-select" 
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Category</option>
                                <option value="Food">Food</option>
                                <option value="Bills">Bills</option>
                                <option value="Income">Income</option>
                                <option value="Transportation">Transportation</option>
                            </select>
                        </div>

                        {/* Type Field */}
                        <div className="col-md-4">
                            <label className="form-label">Type</label>
                            <select 
                                className="form-select" 
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Type</option>
                                <option value="Income">Income</option>
                                <option value="Expense">Expense</option>
                            </select>
                        </div>

                        {/* Time Field */}
                        <div className="col-md-4">
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

                        {/* Submit Button with Proper Icon Alignment */}
                        <div className="col-12 mt-4">
                            <button 
                                className="btn btn-primary-600 d-flex align-items-center justify-content-center gap-2" 
                                type="submit"
                                style={{ width: '200px', margin: '0 auto' }}
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
