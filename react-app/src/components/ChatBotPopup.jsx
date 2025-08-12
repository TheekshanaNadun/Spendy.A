import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Bot, Send, Mic, Check, X as XIcon, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Calendar, MapPin } from "lucide-react";
import styles from './ChatBotPopup.module.css';

const ChatBotPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm Spendy.AI", isBot: true },
    { text: "Just tell me what you bought", isBot: true }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [geoLocation, setGeoLocation] = useState({ lat: null, lng: null });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Add refs for voice recognition
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const getLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => setGeoLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }),
        error => {
          console.error('Location error:', error);
          setError('Location access required for accurate tracking');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/session-check', {
        credentials: 'include'
      });
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    getLocation();
    checkAuth();
  }, [getLocation, checkAuth]);

  const sendMessageToServer = async (message) => {
    try {
      const response = await fetch('http://localhost:3001/process_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message,
          latitude: geoLocation.lat,
          longitude: geoLocation.lng
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const confirmTransaction = async () => {
    if (!pendingTransaction) return;

    try {
      setIsConfirming(true);
      const response = await fetch('http://localhost:3001/api/confirm-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          structured_data: pendingTransaction.structured_data
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save transaction');
      }

      const result = await response.json();
      
      // Add success message
      setMessages(prev => [...prev, { 
        text: `✅ Transaction saved successfully! ID: ${result.transaction_id}`,
        isBot: true 
      }]);

      // Clear pending transaction
      setPendingTransaction(null);

    } catch (error) {
      setError(error.message);
      setMessages(prev => [...prev, { 
        text: `❌ Failed to save: ${error.message}`,
        isBot: true 
      }]);
    } finally {
      setIsConfirming(false);
    }
  };

  const rejectTransaction = () => {
    // Clear the pending transaction
    setPendingTransaction(null);
    
    // Update the last message to remove structuredData (review card)
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.structuredData) {
          // Remove structuredData to hide the review card
          const { structuredData, ...messageWithoutData } = lastMessage;
          newMessages[newMessages.length - 1] = messageWithoutData;
        }
      }
      
      // Add cancellation message
      newMessages.push({ 
        text: "Transaction cancelled. Please try again with different details.",
        isBot: true 
      });
      
      return newMessages;
    });
  };

  const handleVoiceInput = () => {
    // Check if already listening
    if (isListeningRef.current) {
      stopVoiceRecognition();
      return;
    }

    // Check browser support
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setError("Voice input not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    try {
      // Create recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
    
      // Configure recognition
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      // Set up event handlers
      recognitionRef.current.onstart = () => {
        console.log('Voice recognition started');
    setIsListening(true);
        isListeningRef.current = true;
        setError(null);
      };

      recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
        console.log('Voice transcript:', transcript);
      setInputText(transcript);
        stopVoiceRecognition();
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        let errorMessage = "Voice recognition failed. Please try typing instead.";
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = "No speech detected. Please speak clearly.";
            break;
          case 'audio-capture':
            errorMessage = "Microphone access denied. Please allow microphone access.";
            break;
          case 'not-allowed':
            errorMessage = "Microphone access denied. Please allow microphone access in your browser settings.";
            break;
          case 'network':
            errorMessage = "Network error. Please check your internet connection.";
            break;
          default:
            errorMessage = `Voice recognition error: ${event.error}`;
        }
        
        setError(errorMessage);
        stopVoiceRecognition();
      };

      recognitionRef.current.onend = () => {
        console.log('Voice recognition ended');
      setIsListening(false);
        isListeningRef.current = false;
    };

      // Start recognition
      recognitionRef.current.start();
      
    } catch (error) {
      console.error('Error setting up voice recognition:', error);
      setError("Failed to start voice recognition. Please try typing instead.");
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping voice recognition:', error);
      }
    }
    setIsListening(false);
    isListeningRef.current = false;
  };

  // Clean up recognition on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error cleaning up voice recognition:', error);
        }
      }
    };
  }, []);

  const handleSend = async () => {
    if (!isAuthenticated) {
      setError("Please login to use this feature");
      return;
    }

    const message = inputText.trim();
    if (!message) return;

    try {
      setIsLoading(true);
      setError(null);
      setPendingTransaction(null);
      
      setMessages(prev => [...prev, { text: message, isBot: false }]);
      setInputText("");

      const response = await sendMessageToServer(message);
      
      if (response.status === "retry") {
        setMessages(prev => [...prev, {
          text: response.message || "Sorry, I didn’t understand. Please describe your transaction (e.g., 'I spent 5000 on groceries').",
          isBot: true
        }]);
      } else if (response.status === "success") {
        if (response.message_type === "question") {
          // Handle question response
          setMessages(prev => [...prev, { 
            text: response.ai_response,
            isBot: true,
            isQuestion: true,
            marketInsights: response.market_insights
          }]);
        } else {
          // Handle transaction response
          setPendingTransaction(response);
          setMessages(prev => [...prev, { 
            text: "I've processed your transaction. Please review and confirm:",
            isBot: true,
            structuredData: response.structured_data,
            insights: response.insights,
            suggestions: response.suggestions,
            budgetAlerts: response.budget_alerts,
            aiSuggestions: response.ai_suggestions,
            transactionInsights: response.transaction_insights
            // No marketInsights for transactions
          }]);
        }
      } else {
        setMessages(prev => [...prev, { 
          text: response.error || "Failed to process message",
          isBot: true 
        }]);
      }

    } catch (error) {
      setError(error.message);
      setMessages(prev => [...prev, { 
        text: error.message.includes("Authentication") 
          ? "Please login to continue" 
          : "Service unavailable. Try again later.", 
        isBot: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMarketInsights = (marketInsights) => {
    if (!marketInsights) return null;

    return (
      <div className={styles.marketInsights}>
        <div className={styles.insightsHeader}>
          <TrendingUp size={16} />
          <span>Market Insights & Tips</span>
        </div>
        
        <div className={styles.insightsContent}>
          <div className={styles.insightRow}>
            <span className={styles.insightLabel}>Last Month Total:</span>
            <span className={styles.insightValue}>LKR {marketInsights.last_month_total?.toLocaleString()}</span>
          </div>
          <div className={styles.insightRow}>
            <span className={styles.insightLabel}>Today's Expenses:</span>
            <span className={styles.insightValue}>LKR {marketInsights.today_expenses?.toLocaleString()}</span>
          </div>
          <div className={styles.insightRow}>
            <span className={styles.insightLabel}>Current Date:</span>
            <span className={styles.insightValue}>{marketInsights.current_date}</span>
          </div>
        </div>

        {marketInsights.suggestions && marketInsights.suggestions.length > 0 && (
          <div className={styles.suggestions}>
            <h4>💡 Sri Lankan Market Tips:</h4>
            <ul>
              {marketInsights.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderStructuredData = (message) => {
    if (!message.structuredData) return null;

    const data = message.structuredData;

    return (
      <div className={styles.structuredData}>
        <div className={styles.transactionCard}>
          <div className={styles.transactionHeader}>
            <DollarSign size={16} />
            <span className={styles.transactionType}>
              {data.type === 'Expense' ? 'Expense' : 'Income'}
            </span>
          </div>

          <div className={styles.transactionDetails}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Item:</span>
              <input 
                type="text" 
                defaultValue={data.item} 
                className={styles.editableField}
                onChange={(e) => {
                  if (pendingTransaction) {
                    setPendingTransaction({
                      ...pendingTransaction,
                      structured_data: {
                        ...pendingTransaction.structured_data,
                        item: e.target.value
                      }
                    });
                  }
                }}
              />
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Amount:</span>
              <input 
                type="number" 
                defaultValue={data.price} 
                className={styles.editableField}
                onChange={(e) => {
                  if (pendingTransaction) {
                    setPendingTransaction({
                      ...pendingTransaction,
                      structured_data: {
                        ...pendingTransaction.structured_data,
                        price: parseInt(e.target.value) || 0
                      }
                    });
                  }
                }}
              />
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Category:</span>
              <select 
                defaultValue={data.category} 
                className={styles.editableField}
                onChange={(e) => {
                  if (pendingTransaction) {
                    setPendingTransaction({
                      ...pendingTransaction,
                      structured_data: {
                        ...pendingTransaction.structured_data,
                        category: e.target.value
                      }
                    });
                  }
                }}
              >
                <option value="Food & Groceries">Food & Groceries</option>
                <option value="Public Transportation (Bus/Train)">Public Transportation</option>
                <option value="Three Wheeler Fees">Three Wheeler Fees</option>
                <option value="Electricity (CEB)">Electricity (CEB)</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Mobile Prepaid">Mobile Prepaid</option>
                <option value="Internet (ADSL/Fiber)">Internet</option>
                <option value="Hospital Charges">Hospital Charges</option>
                <option value="School Fees">School Fees</option>
                <option value="University Expenses">University Expenses</option>
                <option value="Educational Materials">Educational Materials</option>
                <option value="Clothing & Textiles">Clothing & Textiles</option>
                <option value="House Rent">House Rent</option>
                <option value="Home Maintenance">Home Maintenance</option>
                <option value="Family Events">Family Events</option>
                <option value="Petrol/Diesel">Petrol/Diesel</option>
                <option value="Vehicle Maintenance">Vehicle Maintenance</option>
                <option value="Vehicle Insurance">Vehicle Insurance</option>
                <option value="Bank Loans">Bank Loans</option>
                <option value="Credit Card Payments">Credit Card Payments</option>
                <option value="Income Tax">Income Tax</option>
                <option value="Salary">Salary</option>
                <option value="Foreign Remittances">Foreign Remittances</option>
                <option value="Rental Income">Rental Income</option>
                <option value="Agricultural Income">Agricultural Income</option>
                <option value="Business Profits">Business Profits</option>
                <option value="Investment Returns">Investment Returns</option>
                <option value="Government Allowances">Government Allowances</option>
                <option value="Freelance Income">Freelance Income</option>
              </select>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Date:</span>
              <input 
                type="date" 
                defaultValue={data.date} 
                className={styles.editableField}
                onChange={(e) => {
                  if (pendingTransaction) {
                    setPendingTransaction({
                      ...pendingTransaction,
                      structured_data: {
                        ...pendingTransaction.structured_data,
                        date: e.target.value
                      }
                    });
                  }
                }}
              />
            </div>
            {data.location && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Location:</span>
                <input 
                  type="text" 
                  defaultValue={data.location} 
                  className={styles.editableField}
                  onChange={(e) => {
                    if (pendingTransaction) {
                      setPendingTransaction({
                        ...pendingTransaction,
                        structured_data: {
                          ...pendingTransaction.structured_data,
                          location: e.target.value
                        }
                      });
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* AI Suggestions */}
          {message.aiSuggestions && message.aiSuggestions.length > 0 && (
            <div className={styles.suggestions}>
              <h4>💡 AI Suggestions:</h4>
              <ul>
                {message.aiSuggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Budget Alerts */}
          {message.budgetAlerts && message.budgetAlerts.length > 0 && (
            <div className={styles.budgetAlerts}>
              <h4>⚠️ Budget Alerts:</h4>
              {message.budgetAlerts.map((alert, index) => (
                <div key={index} className={styles.alertItem}>
                  <AlertTriangle size={14} />
                  <span>{alert.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button 
              className={`${styles.confirmButton} ${isConfirming ? styles.loading : ''}`}
              onClick={confirmTransaction}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <div className={styles.spinner} />
              ) : (
                <>
                  <Check size={16} />
                  Confirm & Save
                </>
              )}
            </button>
            <button 
              className={styles.rejectButton}
              onClick={rejectTransaction}
              disabled={isConfirming}
            >
              <XIcon size={16} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTransactionInsights = (transactionInsights, insights = null) => {
    if (!transactionInsights) return null;

    // Check if all fields are empty/null/empty array
    const allEmpty = (
      (!transactionInsights.expense_warning) &&
      (transactionInsights.last_month_expenses == null) &&
      (transactionInsights.this_month_expenses == null) &&
      (!transactionInsights.remaining_balance) &&
      (!transactionInsights.seasonal_offers || transactionInsights.seasonal_offers.length === 0) &&
      (!transactionInsights.daily_offers || transactionInsights.daily_offers.length === 0) &&
      (!transactionInsights.personalized_suggestions || transactionInsights.personalized_suggestions.length === 0) &&
      (!insights || !insights.spending_trend)
    );

    return (
      <div className={styles.transactionInsights + ' ' + styles.transactionInsightsWhite}>
        <div className={styles.insightsHeader}>
          <TrendingUp size={16} />
          <span>Transaction Insights & Offers</span>
        </div>

        {allEmpty && (
          <div className={styles.noInsightsMsg}>
            <span>No insights available for this transaction.</span>
          </div>
        )}

        {/* Expense Summary Section */}
        <div className={styles.expenseSummarySection}>
          <h4 className={styles.sectionHeader}>📊 Monthly Overview</h4>
          <div className={styles.expenseSummary}>
            <div className={styles.expenseRow}>
              <span>Last Month's Expenses:</span>
              <span className={styles.expenseValue}>LKR {transactionInsights.last_month_expenses != null ? transactionInsights.last_month_expenses.toLocaleString() : 'N/A'}</span>
            </div>
            <div className={styles.expenseRow}>
              <span>This Month's Expenses (incl. this):</span>
              <span className={styles.expenseValue}>LKR {transactionInsights.this_month_expenses != null ? transactionInsights.this_month_expenses.toLocaleString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Budget Status Section */}
        <div className={styles.budgetSection}>
          <h4 className={styles.sectionHeader}>💰 Budget Status</h4>
          {transactionInsights.remaining_balance ? (
            <div className={styles.balanceInfo}>
              <div className={styles.balanceRow}>
                <span>Category:</span>
                <span>{transactionInsights.remaining_balance.category ?? 'N/A'}</span>
              </div>
              <div className={styles.balanceRow}>
                <span>Spent This Month:</span>
                <span>LKR {transactionInsights.remaining_balance.current_spending != null ? transactionInsights.remaining_balance.current_spending.toLocaleString() : 'N/A'}</span>
              </div>
              <div className={styles.balanceRow}>
                <span>Monthly Limit:</span>
                <span>LKR {transactionInsights.remaining_balance.limit != null ? transactionInsights.remaining_balance.limit.toLocaleString() : 'N/A'}</span>
              </div>
              <div className={styles.balanceRow}>
                <span>Remaining:</span>
                <span className={transactionInsights.remaining_balance.remaining < 0 ? styles.negative : styles.positive}>
                  LKR {transactionInsights.remaining_balance.remaining != null ? transactionInsights.remaining_balance.remaining.toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className={styles.usageBar}>
                <div 
                  className={styles.usageFill} 
                  style={{ 
                    width: `${Math.min(transactionInsights.remaining_balance.usage_percentage || 0, 100)}%`,
                    backgroundColor: transactionInsights.remaining_balance.usage_percentage > 90 ? '#ef4444' : 
                                   transactionInsights.remaining_balance.usage_percentage > 70 ? '#f59e0b' : '#10b981'
                  }}
                />
              </div>
              <span className={styles.usageText}>
                {transactionInsights.remaining_balance.usage_percentage != null ? transactionInsights.remaining_balance.usage_percentage : '0'}% used
              </span>
              {/* Spending Trend Suggestion inside Budget Status */}
              {insights && insights.spending_trend && (
                <div className={styles.spendingTrendSuggestion}>
                  <span>{insights.spending_trend.message}</span>
                  <span className={styles.trendPercentage}>
                    {insights.spending_trend.percentage}% {insights.spending_trend.type === 'high' ? 'higher' : 'lower'} than usual
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.balanceInfo}>
              <span>No budget data for this category.</span>
              {/* Still show spending trend if present */}
              {insights && insights.spending_trend && (
                <div className={styles.spendingTrendSuggestion}>
                  <span>{insights.spending_trend.message}</span>
                  <span className={styles.trendPercentage}>
                    {insights.spending_trend.percentage}% {insights.spending_trend.type === 'high' ? 'higher' : 'lower'} than usual
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Expense Warning */}
        {transactionInsights.expense_warning && (
          <div className={styles.expenseWarning}>
            <span style={{ color: '#ffff', fontWeight: 400 , paddingBottom: '30px',paddingTop: '30px'}}>{transactionInsights.expense_warning}</span>
          </div>
        )}

        {/* Offers Section */}
        <div className={styles.offersSection}>
          <h4 className={styles.sectionHeader}>🎊 Offers & Promotions</h4>
          <div className={styles.offersContent}>
            {/* Seasonal Offers */}
            {transactionInsights.seasonal_offers && transactionInsights.seasonal_offers.length > 0 && (
              <div className={styles.offerGroup}>
                <h5 className={styles.subsectionHeader}>Seasonal Offers:</h5>
                <ul>
                  {transactionInsights.seasonal_offers.map((offer, index) => (
                    <li key={index}>{offer}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Daily Offers */}
            {transactionInsights.daily_offers && transactionInsights.daily_offers.length > 0 && (
              <div className={styles.offerGroup}>
                <h5 className={styles.subsectionHeader}>Today's Special Offers:</h5>
                <ul>
                  {transactionInsights.daily_offers.map((offer, index) => (
                    <li key={index}>{offer}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {(!transactionInsights.seasonal_offers || transactionInsights.seasonal_offers.length === 0) && 
             (!transactionInsights.daily_offers || transactionInsights.daily_offers.length === 0) && (
              <span>No offers available today.</span>
            )}
          </div>
        </div>

        {/* Personalized Suggestions */}
        <div className={styles.suggestionsSection}>
          <h4 className={styles.sectionHeader}>💡 Personalized Tips</h4>
          {transactionInsights.personalized_suggestions && transactionInsights.personalized_suggestions.length > 0 ? (
            <ul>
              {transactionInsights.personalized_suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          ) : (
            <span>No personalized tips for this transaction.</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <button 
        className={`${styles.toggleButton} ${isOpen ? styles.hidden : ''}`}
        onClick={toggleChat}
      >
        <MessageCircle size={28} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.popup}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className={styles.header}>
              <Bot size={24} />
              <h3>Spendy.AI</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.chatArea}>
              {messages.map((msg, index) => (
                <div key={index}>
                <div 
                  className={`${styles.message} ${msg.isBot ? styles.botMsg : styles.userMsg}`}
                >
                  {msg.text}
                  {msg.isBot && <div className={styles.botIndicator}><Bot size={12} /></div>}
                  </div>
                  {/* Show transaction card OR market insights, not both */}
                  {msg.structuredData && renderStructuredData(msg)}
                  {msg.isQuestion && msg.marketInsights && renderMarketInsights(msg.marketInsights)}
                  {msg.transactionInsights && renderTransactionInsights(msg.transactionInsights, msg.insights)}
                </div>
              ))}
              {isLoading && (
                <div className={styles.loading}>
                  <div className={styles.loadingDot} />
                  <div className={styles.loadingDot} />
                  <div className={styles.loadingDot} />
                </div>
              )}
              {error && <div className={styles.error}>{error}</div>}
            </div>

            <div className={styles.inputContainer}>
              <div className={styles.inputWrapper}>
                <button 
                  className={`${styles.voiceButton} ${isListening ? styles.listening : ''}`}
                  onClick={handleVoiceInput}
                  disabled={isLoading}
                  title={isListening ? "Click to stop recording" : "Click to start voice input"}
                >
                  {isListening ? (
                    <div className={styles.recordingIndicator}>
                      <div className={styles.recordingDot} />
                    </div>
                  ) : (
                  <Mic size={18} />
                  )}
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type or speak your transaction..."
                  className={styles.inputField}
                  disabled={isLoading}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                  className={styles.sendButton}
                  onClick={handleSend}
                  disabled={isLoading || !inputText.trim()}
                >
                  {isLoading ? (
                    <div className={styles.spinner} />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
              <div className={styles.locationStatus}>
                {geoLocation.lat ? "📍 Location enabled" : "⚠️ Location unavailable"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatBotPopup;
