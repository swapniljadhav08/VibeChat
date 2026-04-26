import React, { useRef, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, Check, X, MessageSquare, UserPlus, ShieldAlert, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = ({ onClose }) => {
    const { notifications, markAsRead } = useNotifications();
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const getIcon = (type) => {
        switch (type) {
            case 'new_message': return <MessageSquare size={16} className="text-primary-400" />;
            case 'friend_request_sent': 
            case 'friend_request_accepted': return <UserPlus size={16} className="text-secondary-400" />;
            case 'security_alert': return <ShieldAlert size={16} className="text-red-400" />;
            case 'map_interaction': return <MapPin size={16} className="text-green-400" />;
            default: return <Bell size={16} className="text-surface-400" />;
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            markAsRead(notification._id);
        }
        
        // Navigation logic based on type
        switch (notification.type) {
            case 'new_message':
                if (notification.data?.chatId) navigate(`/chat/${notification.data.chatId}`);
                break;
            case 'friend_request_sent':
            case 'friend_request_accepted':
                navigate('/friends');
                break;
            case 'map_interaction':
                navigate('/map');
                break;
            default:
                break;
        }
        onClose();
    };

    return (
        <div ref={dropdownRef} className="absolute top-16 right-4 w-80 bg-surface-900/95 backdrop-blur-xl border border-surface-700/50 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col pointer-events-auto">
            <div className="p-4 border-b border-surface-800 flex justify-between items-center">
                <h3 className="font-semibold text-white">Notifications</h3>
                <div className="flex gap-2">
                    {notifications.some(n => !n.isRead) && (
                        <button 
                            onClick={() => markAsRead('all')}
                            className="text-xs text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1"
                        >
                            <Check size={14} /> Mark all read
                        </button>
                    )}
                    <button onClick={onClose} className="text-surface-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="p-6 text-center text-surface-400">
                        <Bell size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No new notifications</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {notifications.map(notif => (
                            <div 
                                key={notif._id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-4 border-b border-surface-800/50 hover:bg-surface-800/50 cursor-pointer transition-colors flex gap-3 ${!notif.isRead ? 'bg-surface-800/30' : ''}`}
                            >
                                <div className="mt-1 flex-shrink-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!notif.isRead ? 'bg-surface-700' : 'bg-surface-800'}`}>
                                        {getIcon(notif.type)}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${!notif.isRead ? 'font-semibold text-white' : 'text-surface-200'}`}>
                                        {notif.title}
                                    </p>
                                    <p className="text-xs text-surface-400 mt-1 truncate">
                                        {notif.message}
                                    </p>
                                    <p className="text-[10px] text-surface-500 mt-1">
                                        {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                                {!notif.isRead && (
                                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0"></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationDropdown;
