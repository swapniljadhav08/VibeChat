import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Camera, Zap, MoreHorizontal, Settings } from 'lucide-react';

const Header = ({ userData }) => {
    const navigate = useNavigate();
    return (
        <div className="absolute top-0 left-0 right-0 p-4 pt-6 flex justify-between items-start z-10 w-full pointer-events-none">
            {/* Left Side: Profile, Search, Add Friend */}
            <div className="flex space-x-2 pointer-events-auto">
                <div
                    onClick={() => navigate('/profile')}
                    className="w-10 h-10 bg-surface-900/60 backdrop-blur-xl rounded-xl flex items-center justify-center overflow-hidden border border-surface-700/50 cursor-pointer hover:bg-surface-800/80 transition-all shadow-soft"
                >
                    {userData?.photoURL ? (
                        <img src={userData.photoURL} alt="profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-white text-sm font-medium">{userData?.displayName?.charAt(0) || 'U'}</span>
                    )}
                </div>
                <div className="w-10 h-10 bg-surface-900/60 backdrop-blur-xl rounded-xl flex items-center justify-center text-surface-400 cursor-pointer hover:text-white hover:bg-surface-800/80 transition-all border border-surface-700/50 shadow-soft">
                    <Search size={18} strokeWidth={2} />
                </div>
                <div onClick={() => navigate('/friends')} className="w-10 h-10 bg-primary-600/90 backdrop-blur-xl rounded-xl flex items-center justify-center text-white cursor-pointer hover:bg-primary-500 transition-all border border-primary-500/50 shadow-glow">
                    <UserPlus size={18} strokeWidth={2} />
                </div>
            </div>

            {/* Right Side: Header Tools */}
            <div className="flex flex-col space-y-2 pointer-events-auto">
                <div className="flex flex-col bg-surface-900/60 backdrop-blur-xl rounded-xl border border-surface-700/50 shadow-soft overflow-hidden text-surface-400">
                    <button className="p-2.5 hover:text-white hover:bg-surface-800/80 transition-all cursor-pointer">
                        <Camera size={20} strokeWidth={2} />
                    </button>
                    <div className="h-px bg-surface-700/50 mx-2"></div>
                    <button className="p-2.5 hover:text-white hover:bg-surface-800/80 transition-all cursor-pointer">
                        <Zap size={20} strokeWidth={2} />
                    </button>
                    <div className="h-px bg-surface-700/50 mx-2"></div>
                    <button className="p-2.5 hover:text-white hover:bg-surface-800/80 transition-all cursor-pointer">
                        <Settings size={20} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Header;
