import React from 'react';
import { useParams } from 'react-router-dom';
import ChatList from './ChatList';
import ChatRoom from './ChatRoom';

const ChatLayout = () => {
    const { chatId } = useParams();

    return (
        <div className="flex h-screen w-screen bg-white overflow-hidden text-black font-sans">
            {/* Left Sidebar - Chat List */}
            {/* On mobile, hidden if chatId exists. On desktop, always visible */}
            <div className={`w-full md:w-[350px] lg:w-[400px] flex-shrink-0 border-r border-gray-100 ${chatId ? 'hidden md:flex' : 'flex'}`}>
                <ChatList />
            </div>

            {/* Right Area - Chat Room */}
            {/* On mobile, hidden if no chatId. On desktop, always visible */}
            <div className={`flex-1 flex-col h-full bg-gray-50 ${!chatId ? 'hidden md:flex' : 'flex'}`}>
                {chatId ? (
                    <ChatRoom />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-white h-full border-l border-gray-100">
                        <div className="w-24 h-24 mb-4 opacity-50 flex items-center justify-center bg-gray-100 p-6 rounded-full">
                            <span className="text-5xl text-gray-500 drop-shadow-sm">💬</span>
                        </div>
                        <h2 className="text-[22px] font-extrabold text-black tracking-tight">Your Messages</h2>
                        <p className="text-gray-500 mt-2 font-medium">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatLayout;
