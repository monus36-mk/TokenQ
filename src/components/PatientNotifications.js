import React from 'react';

export default function PatientNotifications({
  notifications,
  onClose,
  onNotificationClick,
  onClearAll,
  onDismissNotification,
  onMarkAsRead,
  currentUser,
  onRequireAuth
}) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notif-modal-overlay" onClick={onClose}>
      <div className="notif-modal-sheet" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="notif-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🔔</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
              Notifications & Reminders
            </div>
            {unreadCount > 0 && (
              <span className="notif-badge-pill">{unreadCount} New</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {notifications.length > 0 && (
              <button 
                onClick={onMarkAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--green-dark)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Mark all read
              </button>
            )}
            <button 
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                color: 'var(--text3)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* List of Notifications */}
        <div className="notif-modal-body">
          {notifications.length === 0 ? (
            <div className="notif-empty-state">
              <span style={{ fontSize: '42px', marginBottom: '10px' }}>🔔</span>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                {currentUser ? 'All Caught Up!' : 'Sign In to View Notifications'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '6px', maxWidth: '300px', margin: '6px auto 0', lineHeight: '1.4' }}>
                {currentUser 
                  ? "You don't have any pending checkup reminders, digital prescriptions, or live token alerts right now." 
                  : "Sign in with your phone number to receive doctor checkup reminders, digital prescriptions (Rx), and live queue updates."
                }
              </div>
              {!currentUser && onRequireAuth && (
                <button
                  onClick={() => {
                    if (onClose) onClose();
                    onRequireAuth();
                  }}
                  style={{
                    marginTop: '16px',
                    padding: '9px 20px',
                    background: 'var(--green)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Sign In to TokenQ →
                </button>
              )}
            </div>
          ) : (
            notifications.map((n) => {
              const tagClass = n.type === 'rx' ? 'tag-rx' : n.type === 'reminder' ? 'tag-reminder' : n.type === 'turn' ? 'tag-turn' : 'tag-info';
              const tagLabel = n.badgeLabel || (n.type === 'rx' ? 'Prescription' : n.type === 'reminder' ? 'Reminder' : n.type === 'turn' ? 'Queue Alert' : 'Notice');
              const icon = n.icon || (n.type === 'reminder' ? '⏰' : n.type === 'rx' ? '💊' : n.type === 'turn' ? '🟢' : '🔔');

              return (
                <div 
                  key={n.id}
                  className={`notif-item-card ${!n.read ? 'unread' : ''} type-${n.type || 'info'}`}
                  onClick={() => {
                    if (onNotificationClick) onNotificationClick(n);
                  }}
                >
                  <div className="notif-item-icon">
                    {icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="notif-item-header">
                      <span className={`notif-type-tag ${tagClass}`}>{tagLabel}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="notif-item-time">{n.time}</span>
                        {onDismissNotification && (
                          <button
                            className="notif-dismiss-btn"
                            title="Dismiss notification"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDismissNotification(n.id);
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-desc">{n.message}</div>

                    {(n.actionText || n.actionLabel) && (
                      <button 
                        className="notif-action-pill"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNotificationClick) onNotificationClick(n);
                        }}
                      >
                        {n.actionText || n.actionLabel} →
                      </button>
                    )}
                  </div>
                  {!n.read && <div className="notif-unread-dot"></div>}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="notif-modal-footer">
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
              {notifications.length} notification{notifications.length > 1 ? 's' : ''} total
            </span>
            <button 
              onClick={onClearAll}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--red)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🗑️ Clear all notifications
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
