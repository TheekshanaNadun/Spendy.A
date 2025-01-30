import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Bot, Send, Mic } from "lucide-react";
import styles from './ChatBotPopup.module.css';

const ChatBotPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showFloatingMessage, setShowFloatingMessage] = useState(true);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm Spendy.AI", isBot: true },
    { text: "Just tell me what you bought, I will add the record by myself", isBot: true }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [geoLocation, setGeoLocation] = useState({ lat: null, lng: null });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuthStatus();
    getGeoLocation();
    
    const timer = setTimeout(() => setShowFloatingMessage(false), 5000);
    return () => {
      clearTimeout(timer);
      setMounted(false);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/session-check', {
        credentials: 'include'
      });
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
      console.log('Auth status:', data);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    }
  };

  const getGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setGeoLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        error => {
          console.error('Geolocation error:', error);
          setError('Location access recommended for accurate tracking');
        }
      );
    }
  };

  const sendMessageToServer = useCallback(async (message) => {
    try {
      if (!isAuthenticated) {
        throw new Error('Please login to continue');
      }

      const response = await fetch('http://127.0.0.1:3001/process_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: message,
          latitude: geoLocation.lat,
          longitude: geoLocation.lng
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process message');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }, [geoLocation, isAuthenticated]);

  const handleSendMessage = async () => {
    const sanitizedInput = inputText.trim().replace(/[<>]/g, '');
    if (!sanitizedInput) return;

    try {
      setIsLoading(true);
      setError(null);

      setMessages(prev => [...prev, { text: sanitizedInput, isBot: false }]);
      setInputText("");

      const responseData = await sendMessageToServer(sanitizedInput);
      
      if (responseData.status === 'success') {
        setMessages(prev => [...prev, { 
          text: `Added: ${responseData.data.item} (LKR${responseData.data.price})`, 
          isBot: true 
        }]);
      } else {
        throw new Error(responseData.error || 'Unknown server error');
      }
    } catch (error) {
      setError(error.message);
      setMessages(prev => [...prev, { 
        text: "Sorry, I'm having trouble processing your request.", 
        isBot: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceRecognition = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setError("Voice recognition is not supported in your browser");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.start();
    setIsListening(true);
    setError(null);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError("Voice recognition failed. Please try again.");
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!mounted) return null;

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <AnimatePresence mode="wait">
          {showFloatingMessage && !isOpen && (
            <motion.div
              className={styles.floatingMessage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              Just tell me what you bought, I will add the record by myself
            </motion.div>
          )}
          
          {isOpen ? (
            <motion.div
              className={styles.popup}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              key="popup"
            >
              <div className={styles.header}>
                <div className={styles.headerLeft}>
                  <Bot className={styles.botIcon} size={24} />
                  <h3 className={styles.title}>Spendy.AI Chat</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className={styles.closeButton}
                  aria-label="Close chat"
                >
                  <X size={24} />
                </button>
              </div>

              <div className={styles.chatBody}>
                {messages.map((message, index) => (
                  <div 
                    key={`msg_${index}_${message.isBot}`}
                    className={`${styles.message} ${message.isBot ? styles.botMessage : styles.userMessage}`}
                  >
                    <p className={styles.text}>{message.text}</p>
                  </div>
                ))}
                {isLoading && (
                  <div className={styles.loading}>
                    <div className={styles.loadingDot}></div>
                    <div className={styles.loadingDot}></div>
                    <div className={styles.loadingDot}></div>
                  </div>
                )}
                {error && (
                  <div className={styles.error}>
                    {error}
                  </div>
                )}
              </div>

              <div className={styles.inputContainer}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  className={styles.input}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  maxLength={500}
                />
                <button 
                  className={`${styles.voiceButton} ${isListening ? styles.listening : ''}`}
                  onClick={startVoiceRecognition}
                  disabled={isLoading || isListening}
                  aria-label={isListening ? "Listening..." : "Voice input"}
                >
                  <Mic size={20} />
                </button>
                <button 
                  className={styles.sendButton} 
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputText.trim()}
                  aria-label="Send message"
                >
                  <Send size={20} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              onClick={() => {
                setIsOpen(true);
                setShowFloatingMessage(false);
              }}
              className={styles.toggleButton}
              aria-label="Open chat"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              key="toggle"
            >
              <MessageCircle size={28} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatBotPopup;
