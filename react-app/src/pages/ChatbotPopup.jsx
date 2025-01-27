import React from "react";
import ChatbotPopup from "../components/ChatbotPopup"; // Adjust the path if needed

const Layout = ({ children }) => {
  return (
    <div className="relative">
      {/* Header, Sidebar, or other layout components */}
      {children}
      <ChatbotPopup />
    </div>
  );
};

export default ChatbotPopup;
