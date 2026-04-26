import React from 'react';
import { useParams } from 'react-router-dom';
import ChatList from './ChatList';
import ChatRoom from './ChatRoom';

const ChatLayout = () => {
    const { chatId } = useParams();

    return (
        <div className="flex h-screen w-screen bg-[#0F0F14] overflow-hidden text-white font-sans">
            {/* Left Sidebar - Chat List */}
            {/* On mobile, hidden if chatId exists. On desktop, always visible */}
            <div className={`w-full md:w-[350px] lg:w-[400px] flex-shrink-0 border-r border-white/5 ${chatId ? 'hidden md:flex' : 'flex'}`}>
                <ChatList />
            </div>

            {/* Right Area - Chat Room */}
            {/* On mobile, hidden if no chatId. On desktop, always visible */}
            <div className={`flex-1 flex-col h-full bg-[#0F0F14] relative ${!chatId ? 'hidden md:flex' : 'flex'}`}>
                {chatId ? (
                    <ChatRoom />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center h-full border-l border-white/5 relative overflow-hidden">
                        {/* Immersive Background */}
                        <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                        <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] bg-[#7F5AF0]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
                        <div className="absolute bottom-[20%] left-[20%] w-[30%] h-[30%] bg-[#00E5FF]/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

                        <div className="z-10 flex flex-col items-center justify-center text-center px-8">
                            <div className="w-28 h-28 mb-6 relative">
                                <div className="absolute inset-0 bg-[#00E5FF]/30 blur-[40px] rounded-full"></div>
                                <div className="w-full h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl rotate-12">
                                    <span className="text-5xl drop-shadow-[0_0_15px_rgba(0,229,255,0.5)] -rotate-12">💬</span>
                                </div>
                            </div>
                            <h2 className="text-[28px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tight drop-shadow-md">Your Messages</h2>
                            <p className="text-white/50 mt-3 font-medium text-[16px] max-w-sm leading-relaxed">Select a conversation to drop into the Vibe and start chatting.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatLayout;
