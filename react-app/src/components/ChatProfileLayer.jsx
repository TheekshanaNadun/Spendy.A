import { Icon } from '@iconify/react/dist/iconify.js';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardData } from './DashboardDataProvider';

const ChatProfileLayer = () => {
    const { dashboardData, loading, error } = useDashboardData();
    const [message, setMessage] = useState('');
    const [chatMessages, setChatMessages] = useState([]);

    // Generate dynamic profile data based on dashboard data
    const generateProfileData = () => {
        if (!dashboardData) return null;

        const { 
            expenseByCategory = [], 
            expenseCategories = [], 
            monthlyExpense = [], 
            monthlyIncome = [],
            currentMonthExpense = 0,
            currentMonthIncome = 0
        } = dashboardData;

        const totalExpenses = monthlyExpense.reduce((a, b) => a + b, 0);
        const totalIncome = monthlyIncome.reduce((a, b) => a + b, 0);
        const netSavings = totalIncome - totalExpenses;
        const topCategory = expenseCategories[0] || 'No Data';
        const topAmount = expenseByCategory[0] || 0;

        return {
            name: "AI Financial Assistant",
            role: "Your Personal Finance Manager",
            avatar: "assets/images/chat/chat-main.png",
            location: "Sri Lanka",
            memberSince: "January 2025",
            language: "English, Sinhala",
            totalExpenses: totalExpenses,
            totalIncome: totalIncome,
            netSavings: netSavings,
            topCategory: topCategory,
            topAmount: topAmount,
            categoriesCount: expenseCategories.length,
            status: "Online"
        };
    };

    // Generate dynamic messages
    const generateMessages = () => {
        if (!dashboardData) return [];

        const { expenseByCategory = [], expenseCategories = [], monthlyExpense = [] } = dashboardData;
        const totalExpenses = monthlyExpense.reduce((a, b) => a + b, 0);
        const avgExpense = totalExpenses / Math.max(monthlyExpense.length, 1);

        return [
            {
                id: 1,
                sender: "assistant",
                content: `Hello! I'm your AI financial assistant. I'm here to help you manage your finances better.`,
                time: "10:00 AM",
                avatar: "assets/images/chat/chat-main.png"
            },
            {
                id: 2,
                sender: "assistant",
                content: `Your financial summary:\n• Total expenses this month: LKR ${totalExpenses.toLocaleString()}\n• Average daily spending: LKR ${(avgExpense / 30).toFixed(0)}\n• Top spending category: ${expenseCategories[0] || 'No Data'}`,
                time: "10:01 AM",
                avatar: "assets/images/chat/chat-main.png"
            },
            {
                id: 3,
                sender: "user",
                content: "How can I improve my financial health?",
                time: "10:02 AM"
            },
            {
                id: 4,
                sender: "assistant",
                content: `Here are some tips:\n• Track every expense\n• Set monthly budgets\n• Save 20% of income\n• Review spending weekly\n• Use cash for small purchases\n• Plan meals to reduce food costs`,
                time: "10:03 AM",
                avatar: "assets/images/chat/chat-main.png"
            }
        ];
    };

    useEffect(() => {
        setChatMessages(generateMessages());
    }, [dashboardData]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            const newMessage = {
                id: chatMessages.length + 1,
                sender: "user",
                content: message,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setChatMessages([...chatMessages, newMessage]);
            setMessage('');
        }
    };

    if (loading) return <div className="text-center py-4">Loading profile data...</div>;
    if (error) return <div className="text-danger">Error loading profile data: {error}</div>;
    if (!dashboardData) return <div className="text-secondary">No profile data available.</div>;

    const profileData = generateProfileData();

    return (
        <div className="chat-wrapper">
            <div className="chat-sidebar profile-setting card">
                <div className="text-end">
                    <Link to="/chat-message">
                        <Icon icon="akar-icons:cross" />
                    </Link>
                </div>
                <div className="chat-main-profile">
                    <div className="img">
                        <img src={profileData.avatar} alt="image_icon" />
                    </div>
                    <div className="text-center">
                        <h6 className="text-md mb-0">{profileData.name}</h6>
                        <p className="mb-0 text-sm">{profileData.role}</p>
                    </div>
                </div>
                <div className="mt-24">
                    <label className="form-label">About Me</label>
                    <textarea
                        name="about"
                        className="form-control"
                        placeholder="AI-powered financial assistant helping you achieve your financial goals through smart budgeting, expense tracking, and personalized insights."
                        defaultValue="AI-powered financial assistant helping you achieve your financial goals through smart budgeting, expense tracking, and personalized insights."
                        readOnly
                    />
                </div>
                <div className="mt-24">
                    <ul className="d-flex flex-column gap-1">
                        <li className="d-flex flex-wrap align-items-center justify-content-between">
                            <span className="d-inline-flex gap-2 align-items-center">
                                <Icon icon="mingcute:location-line" className="text-lg" />
                                Location
                            </span>
                            <span className="text-primary-light">{profileData.location}</span>
                        </li>
                        <li className="d-flex flex-wrap align-items-center justify-content-between">
                            <span className="d-inline-flex gap-2 align-items-center">
                                <Icon icon="fluent:person-24-regular" className="text-lg" />
                                Member since
                            </span>
                            <span className="text-primary-light">{profileData.memberSince}</span>
                        </li>
                        <li className="d-flex flex-wrap align-items-center justify-content-between">
                            <span className="d-inline-flex gap-2 align-items-center">
                                <Icon icon="cil:language" className="text-lg" />
                                Language
                            </span>
                            <span className="text-primary-light">{profileData.language}</span>
                        </li>
                        <li className="d-flex flex-wrap align-items-center justify-content-between">
                            <span className="d-inline-flex gap-2 align-items-center">
                                <Icon icon="ri:money-dollar-circle-line" className="text-lg" />
                                Total Expenses
                            </span>
                            <span className="text-primary-light">LKR {profileData.totalExpenses.toLocaleString()}</span>
                        </li>
                        <li className="d-flex flex-wrap align-items-center justify-content-between">
                            <span className="d-inline-flex gap-2 align-items-center">
                                <Icon icon="ri:bank-line" className="text-lg" />
                                Total Income
                            </span>
                            <span className="text-primary-light">LKR {profileData.totalIncome.toLocaleString()}</span>
                        </li>
                        <li className="d-flex flex-wrap align-items-center justify-content-between">
                            <span className="d-inline-flex gap-2 align-items-center">
                                <Icon icon="ri:pie-chart-line" className="text-lg" />
                                Categories
                            </span>
                            <span className="text-primary-light">{profileData.categoriesCount}</span>
                        </li>
                    </ul>
                </div>
                <div className="mt-24">
                    <h6 className="text-lg">Status</h6>
                    <div className="d-flex flex-column gap-1">
                        <div className="form-check d-flex align-items-center">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="status"
                                id="status1"
                                defaultChecked=""
                            />
                            <label className="form-check-label" htmlFor="status1">
                                {profileData.status}
                            </label>
                        </div>
                        <div className="form-check d-flex align-items-center">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="status"
                                id="status2"
                            />
                            <label className="form-check-label" htmlFor="status2">
                                Do Not Disturb
                            </label>
                        </div>
                        <div className="form-check d-flex align-items-center">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="status"
                                id="status3"
                            />
                            <label className="form-check-label" htmlFor="status3">
                                Away
                            </label>
                        </div>
                        <div className="form-check d-flex align-items-center">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="status"
                                id="status4"
                            />
                            <label className="form-check-label" htmlFor="status4">
                                Offline
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="chat-main card">
                <div className="chat-sidebar-single active">
                    <div className="img">
                        <img src={profileData.avatar} alt="image_icon" />
                    </div>
                    <div className="info">
                        <h6 className="text-md mb-0">{profileData.name}</h6>
                        <p className="mb-0">{profileData.status}</p>
                    </div>
                    <div className="action d-inline-flex align-items-center gap-3">
                        <button type="button" className="text-xl text-primary-light">
                            <Icon icon="mi:call" />
                        </button>
                        <button type="button" className="text-xl text-primary-light">
                            <Icon icon="fluent:video-32-regular" />
                        </button>
                        <div className="btn-group">
                            <button
                                type="button"
                                className="text-primary-light text-xl"
                                data-bs-toggle="dropdown"
                                data-bs-display="static"
                                aria-expanded="false"
                            >
                                <Icon icon="tabler:dots-vertical" />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-lg-end border">
                                <li>
                                    <button
                                        className="dropdown-item center-gap rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900"
                                        type="button"
                                    >
                                        <Icon icon="mdi:clear-circle-outline" />
                                        Clear Chat
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item center-gap rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900"
                                        type="button"
                                    >
                                        <Icon icon="ic:baseline-block" />
                                        Block
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div className="chat-message-list">
                    {chatMessages.map((msg) => (
                        <div key={msg.id} className={`chat-single-message ${msg.sender === 'user' ? 'right' : 'left'}`}>
                            {msg.sender !== 'user' && (
                                <img
                                    src={msg.avatar}
                                    alt="image_icon"
                                    className="avatar-lg object-fit-cover rounded-circle"
                                />
                            )}
                            <div className="chat-message-content">
                                <p className="mb-3" style={{ whiteSpace: 'pre-line' }}>
                                    {msg.content}
                                </p>
                                <p className="chat-time mb-0">
                                    <span>{msg.time}</span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                
                <form className="chat-message-box" onSubmit={handleSendMessage}>
                    <input 
                        type="text" 
                        name="chatMessage" 
                        placeholder="Type your message..." 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <div className="chat-message-box-action">
                        <button type="button" className="text-xl">
                            <Icon icon="ph:link" />
                        </button>
                        <button type="button" className="text-xl">
                            <Icon icon="solar:gallery-linear" />
                        </button>
                        <button
                            type="submit"
                            className="btn btn-sm btn-primary-600 radius-8 d-inline-flex align-items-center gap-1"
                        >
                            Send
                            <Icon icon="f7:paperplane" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatProfileLayer;