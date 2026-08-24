import React from "react";

interface UserBoxProps {
  message: any;
}

const UserBox: React.FC<UserBoxProps> = ({ message }) => {
  const displayText =
    typeof message === "string"
      ? message
      : message?.content || message?.msg || String(message || "");

  return (
    <div className="chat-item user-item">
      <div className="avatar-wrapper">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      </div>
      <div className="message-content">
        <div className="message-text">{displayText}</div>
      </div>
    </div>
  );
};

export default UserBox;
