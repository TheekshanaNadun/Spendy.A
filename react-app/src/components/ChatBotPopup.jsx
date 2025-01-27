import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Bot, Send, Mic } from "lucide-react";
import styles from './ChatBotPopup.module.css';

const ChatBotPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! How can I help you today?", isBot: true },
    { text: "What features are you looking for?", isBot: true }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Rate limiting
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const RATE_LIMIT_MS = 1000; // 1 second between messages

  const sanitizeInput = (input) => {
    return input.replace(/[<>]/g, '');
  };

  const sendMessageToServer = useCallback(async (message) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/process_message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          message: message,
          timestamp: new Date().toISOString(),
          clientId: sessionStorage.getItem('clientId')
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error:', error);
      throw new Error('Failed to get response from server');
    }
  }, []);

  const handleSendMessage = async () => {
    const now = Date.now();
    if (now - lastMessageTime < RATE_LIMIT_MS) {
      setError("Please wait a moment before sending another message");
      return;
    }

    const sanitizedInput = sanitizeInput(inputText.trim());
    if (!sanitizedInput) return;

    try {
      setIsLoading(true);
      setError(null);
      setLastMessageTime(now);

      setMessages(prev => [...prev, { text: sanitizedInput, isBot: false }]);
      setInputText("");

      const botResponse = await sendMessageToServer(sanitizedInput);
      setMessages(prev => [...prev, { text: botResponse, isBot: true }]);
    } catch (error) {
      setError("Failed to get response. Please try again later.");
      setMessages(prev => [...prev, { 
        text: "Sorry, I'm having trouble connecting to the server.", 
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
    recognition.maxAlternatives = 1;

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

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (!sessionStorage.getItem('clientId')) {
      sessionStorage.setItem('clientId', `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <AnimatePresence mode="wait">
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
                    Thinking...
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
                  aria-label="Voice input"
                  onClick={startVoiceRecognition}
                  disabled={isLoading || isListening}
                >
                  <Mic size={20} />
                </button>
                <button 
                  className={styles.sendButton} 
                  aria-label="Send message"
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputText.trim()}
                >
                  <Send size={20} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              onClick={() => setIsOpen(true)}
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
