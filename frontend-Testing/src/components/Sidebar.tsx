import React from "react";
import { useAppContext } from "../context/provider";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    savedSessions,
    session: activeSessionId,
    switchSession,
    createNewSession,
    deleteCurrentSession,
    user,
    logout,
  } = useAppContext();

  const handleSelectSession = (id: string) => {
    switchSession(id);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const handleDeleteSession = async (
    e: React.MouseEvent,
    sessionId: string
  ) => {
    e.stopPropagation();
    await deleteCurrentSession(sessionId);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={onClose} />
      )}

      <aside className={`app-sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-icon">✧</span>
            <span className="brand-text">Nexus Workspace</span>
          </div>
          <button
            className="sidebar-new-btn"
            onClick={() => {
              createNewSession();
              if (window.innerWidth < 768) onClose();
            }}
            title="Start New Chat"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="sidebar-sessions-list">
          <div className="sessions-section-label">Recent Conversations</div>

          {savedSessions.length === 0 ? (
            <div className="no-sessions-hint">
              <span>No past sessions saved</span>
            </div>
          ) : (
            savedSessions.map((s) => {
              const isActive = s.id === activeSessionId;
              const displayTitle =
                s.title === "New Chat"
                  ? `Session ${s.id.slice(0, 8)}...`
                  : s.title;

              return (
                <div
                  key={s.id}
                  className={`session-item ${isActive ? "active" : ""}`}
                  onClick={() => handleSelectSession(s.id)}
                >
                  <div className="session-item-icon">💬</div>
                  <div className="session-item-info">
                    <div className="session-item-title" title={s.id}>
                      {displayTitle}
                    </div>
                    <div className="session-item-date">
                      {new Date(s.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <button
                    className="session-delete-btn"
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    title="Delete Conversation"
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="user-mini-card">
            <div className="user-mini-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="user-mini-info">
              <span className="user-mini-name">
                {user?.name || "Connected User"}
              </span>
              <span className="user-mini-email">
                {user?.email || "api-client"}
              </span>
            </div>
          </div>
          <button
            className="logout-mini-btn"
            onClick={logout}
            title="Log Out & Switch User"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
