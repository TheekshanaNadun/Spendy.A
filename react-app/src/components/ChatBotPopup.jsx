import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Bot, Send, Mic } from "lucide-react";
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

  const handleVoiceInput = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setError("Voice input not supported in this browser");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setError("Voice recognition failed. Please try typing instead.");
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
  };

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
      
      setMessages(prev => [...prev, { text: message, isBot: false }]);
      setInputText("");

      const response = await sendMessageToServer(message);
      setMessages(prev => [...prev, { 
        text: `Added: ${response.data.item} : LKR  ${response.data.price}`,
        isBot: true 
      }]);

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
                <div 
                  key={index} 
                  className={`${styles.message} ${msg.isBot ? styles.botMsg : styles.userMsg}`}
                >
                  {msg.text}
                  {msg.isBot && <div className={styles.botIndicator}><Bot size={12} /></div>}
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
                >
                  <Mic size={18} />
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
