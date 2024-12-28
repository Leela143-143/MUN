import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Globe2, LogIn, LogOut, UserCircle } from 'lucide-react';

export function Navbar() {
  const { user, signOut, userRole } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const showAuthButtons = !location.pathname.includes('/signup') && 
                         !location.pathname.includes('/login') &&
                         !location.pathname.includes('/communities');

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Globe2 className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-xl text-gray-900">IIST MUN</span>
            </Link>
          </div>

          {showAuthButtons && (
            <div className="flex items-center space-x-4">
              {user?.emailVerified && userRole ? (
                <>
                  {userRole === 'user' && (
                    <Link
                      to="/profile"
                      className="flex items-center space-x-1 text-gray-700 hover:text-blue-600"
                    >
                      <UserCircle className="h-5 w-5" />
                      <span>Profile</span>
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 text-gray-700 hover:text-blue-600"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center space-x-1 text-gray-700 hover:text-blue-600"
                  >
                    <LogIn className="h-5 w-5" />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/communities"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}