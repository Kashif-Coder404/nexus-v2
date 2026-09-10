import React from "react";

export default function Chats({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div onClick={onClick} className={`${className}`}>
      {children}
    </div>
  );
}
