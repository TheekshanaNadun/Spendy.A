import { Icon } from '@iconify/react/dist/iconify.js';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardData } from './DashboardDataProvider';

const ChatMessageLayer = () => {
    const { dashboardData, loading, error } = useDashboardData();
    const [selectedChat, setSelectedChat] = useState(0);
    const [message, setMessage] = useState('');
    const [chatMessages, setChatMessages] = useState([]);

    // Generate dynamic chat data based on dashboard data
    const generateChatData = () => {
        if (!dashboardData) return [];

        const { expenseByCategory = [], expenseCategories = [], monthlyExpense = [], monthlyIncome = [] } = dashboardData;
        
        const chats = [
            {
                id: 0,
                name: "Financial Advisor",
                status: "Online",
                avatar: "assets/images/chat/1.png",
                lastMessage: "Your spending analysis is ready!",
                time: "2 min ago",
                unread: 1,
                type: "advisor"
            },
            {
                id: 1,
                name: "Budget Alert System",
                status: "Active",
                avatar: "assets/images/chat/2.png",
                lastMessage: "Transport category is 80% of budget",
                time: "15 min ago",
                unread: 2,
                type: "alert"
            },
            {
                id: 2,
                name: "Expense Tracker",
                status: "Online",
                avatar: "assets/images/chat/3.png",
                lastMessage: "Added new expense: LKR 2,500",
                time: "1 hour ago",
                unread: 0,
                type: "tracker"
            }
        ];

        // Add category-specific chats if we have expense data
        if (expenseCategories && expenseCategories.length > 0) {
            expenseCategories.forEach((category, index) => {
                if (index < 5) { // Limit to 5 categories
                    const amount = expenseByCategory[index] || 0;
                    chats.push({
                        id: index + 3,
                        name: `${category} Monitor`,
                        status: "Active",
                        avatar: `assets/images/chat/${(index % 8) + 1}.png`,
                        lastMessage: `Current spending: LKR ${amount.toLocaleString()}`,
                        time: "2 hours ago",
                        unread: 0,
                        type: "category",
                        category: category,
                        amount: amount
                    });
                }
            });
        }

        return chats;
    };

    // Generate dynamic messages based on selected chat
    const generateMessages = (chatId) => {
        if (!dashboardData) return [];

        const { expenseByCategory = [], expenseCategories = [], monthlyExpense = [], monthlyIncome = [] } = dashboardData;
        const chats = generateChatData();
        const selectedChatData = chats[chatId];

        if (!selectedChatData) return [];

        const messages = [];

        if (selectedChatData.type === "advisor") {
            messages.push(
                {
                    id: 1,
                    sender: "advisor",
                    content: `Hello! I'm your AI financial advisor. I've analyzed your spending patterns for this month.`,
                    time: "10:00 AM",
                    avatar: "assets/images/chat/1.png"
                },
                {
                    id: 2,
                    sender: "advisor",
                    content: `Your total expenses this month are LKR ${monthlyExpense.reduce((a, b) => a + b, 0).toLocaleString()}.`,
                    time: "10:01 AM",
                    avatar: "assets/images/chat/1.png"
                },
                {
                    id: 3,
                    sender: "user",
                    content: "Can you show me my top spending categories?",
                    time: "10:02 AM"
                },
                {
                    id: 4,
                    sender: "advisor",
                    content: `Of course! Your top spending categories are:\n${expenseCategories.slice(0, 3).map((cat, idx) => `${idx + 1}. ${cat}: LKR ${(expenseByCategory[idx] || 0).toLocaleString()}`).join('\n')}`,
                    time: "10:03 AM",
                    avatar: "assets/images/chat/1.png"
                }
            );
        } else if (selectedChatData.type === "alert") {
            messages.push(
                {
                    id: 1,
                    sender: "system",
                    content: `⚠️ Budget Alert: Your ${selectedChatData.category || 'Transport'} spending is approaching the limit.`,
                    time: "9:45 AM",
                    avatar: "assets/images/chat/2.png"
                },
                {
                    id: 2,
                    sender: "system",
                    content: `Current spending: LKR ${selectedChatData.amount?.toLocaleString() || '0'}\nBudget limit: LKR 50,000\nRemaining: LKR ${Math.max(0, 50000 - (selectedChatData.amount || 0)).toLocaleString()}`,
                    time: "9:46 AM",
                    avatar: "assets/images/chat/2.png"
                }
            );
        } else if (selectedChatData.type === "tracker") {
            messages.push(
                {
                    id: 1,
                    sender: "system",
                    content: `✅ New expense recorded: LKR 2,500\nCategory: ${selectedChatData.category || 'Food & Groceries'}\nDate: ${new Date().toLocaleDateString()}`,
                    time: "9:30 AM",
                    avatar: "assets/images/chat/3.png"
                },
                {
                    id: 2,
                    sender: "user",
                    content: "Thanks! How am I doing with my budget this month?",
                    time: "9:31 AM"
                },
                {
                    id: 3,
                    sender: "system",
                    content: `Your budget status:\n✅ On track: ${expenseCategories.filter((_, idx) => (expenseByCategory[idx] || 0) < 50000).length} categories\n⚠️ Near limit: ${expenseCategories.filter((_, idx) => (expenseByCategory[idx] || 0) >= 50000 && (expenseByCategory[idx] || 0) < 60000).length} categories\n🚨 Over budget: ${expenseCategories.filter((_, idx) => (expenseByCategory[idx] || 0) >= 60000).length} categories`,
                    time: "9:32 AM",
                    avatar: "assets/images/chat/3.png"
                }
            );
        } else if (selectedChatData.type === "category") {
            const category = selectedChatData.category;
            const amount = selectedChatData.amount;
            const budgetLimit = 50000; // Default budget limit
            const remaining = Math.max(0, budgetLimit - amount);
            const percentage = ((amount / budgetLimit) * 100).toFixed(1);

            messages.push(
                {
                    id: 1,
                    sender: "system",
                    content: `📊 ${category} Spending Analysis`,
                    time: "9:00 AM",
                    avatar: `assets/images/chat/${(expenseCategories.indexOf(category) % 8) + 1}.png`
                },
                {
                    id: 2,
                    sender: "system",
                    content: `Current spending: LKR ${amount.toLocaleString()}\nBudget limit: LKR ${budgetLimit.toLocaleString()}\nRemaining: LKR ${remaining.toLocaleString()}\nUsage: ${percentage}%`,
                    time: "9:01 AM",
                    avatar: `assets/images/chat/${(expenseCategories.indexOf(category) % 8) + 1}.png`
                },
                {
                    id: 3,
                    sender: "user",
                    content: "How can I reduce spending in this category?",
                    time: "9:02 AM"
                },
                {
                    id: 4,
                    sender: "system",
                    content: `💡 Tips for ${category}:\n• Set daily/weekly spending limits\n• Look for discounts and promotions\n• Consider alternatives or bulk purchases\n• Track every transaction`,
                    time: "9:03 AM",
                    avatar: `assets/images/chat/${(expenseCategories.indexOf(category) % 8) + 1}.png`
                }
            );
        }

        return messages;
    };

    useEffect(() => {
        setChatMessages(generateMessages(selectedChat));
    }, [selectedChat, dashboardData]);

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

    if (loading) return <div className="text-center py-4">Loading chat data...</div>;
    if (error) return <div className="text-danger">Error loading chat data: {error}</div>;
    if (!dashboardData) return <div className="text-secondary">No chat data available.</div>;

    const chats = generateChatData();

    return (
        <div className="chat-wrapper">
            <div className="chat-sidebar card">
                <div className="chat-sidebar-single active top-profile">
                    <div className="img">
                        <img src="assets/images/chat/1.png" alt="image_icon" />
                    </div>
                    <div className="info">
                        <h6 className="text-md mb-0">AI Financial Assistant</h6>
                        <p className="mb-0">Online</p>
                    </div>
                    <div className="action">
                        <div className="btn-group">
                            <button
                                type="button"
                                className="text-secondary-light text-xl"
                                data-bs-toggle="dropdown"
                                data-bs-display="static"
                                aria-expanded="false"
                            >
                                <Icon icon="bi:three-dots" />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-lg-end border">
                                <li>
                                    <Link
                                        to="/chat-profile"
                                        className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2"
                                    >
                                        <Icon icon="fluent:person-32-regular" />
                                        Profile
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/chat-profile"
                                        className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2"
                                    >
                                        <Icon icon="carbon:settings" />
                                        Settings
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div className="chat-search">
                    <span className="icon">
                        <Icon icon="iconoir:search" />
                    </span>
                    <input type="text" name="#0" autoComplete="off" placeholder="Search chats..." />
                </div>
                
                <div className="chat-all-list">
                    {chats.map((chat) => (
                        <div 
                            key={chat.id} 
                            className={`chat-sidebar-single ${selectedChat === chat.id ? 'active' : ''}`}
                            onClick={() => setSelectedChat(chat.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="img">
                                <img src={chat.avatar} alt="image_icon" />
                            </div>
                            <div className="info">
                                <h6 className="text-sm mb-1">{chat.name}</h6>
                                <p className="mb-0 text-xs">{chat.lastMessage}</p>
                            </div>
                            <div className="action text-end">
                                <p className="mb-0 text-neutral-400 text-xs lh-1">{chat.time}</p>
                                {chat.unread > 0 && (
                                    <span className="w-16-px h-16-px text-xs rounded-circle bg-warning-main text-white d-inline-flex align-items-center justify-content-center">
                                        {chat.unread}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="chat-main card">
                <div className="chat-sidebar-single active">
                    <div className="img">
                        <img src={chats[selectedChat]?.avatar || "assets/images/chat/1.png"} alt="image_icon" />
                    </div>
                    <div className="info">
                        <h6 className="text-md mb-0">{chats[selectedChat]?.name || "Chat"}</h6>
                        <p className="mb-0">{chats[selectedChat]?.status || "Online"}</p>
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
                                        className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2"
                                        type="button"
                                    >
                                        <Icon icon="mdi:clear-circle-outline" />
                                        Clear Chat
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2"
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

export default ChatMessageLayer;