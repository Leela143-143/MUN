import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

interface CommunityCardProps {
  id: string;
  name: string;
  logoUrl: string;
  currentCount: number;
  maxCapacity: number;
}

export function CommunityCard({ id, name, logoUrl, currentCount, maxCapacity }: CommunityCardProps) {
  const navigate = useNavigate();
  const isFull = currentCount >= maxCapacity;

  return (
    <div className="flex-shrink-0 w-80 bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900">{name}</h3>
        
        <div className="mt-4 flex items-center text-gray-600">
          <Users className="h-5 w-5 mr-2" />
          <span>{currentCount}/{maxCapacity} Members</span>
        </div>

        <button
          onClick={() => navigate(`/signup?community=${id}`)}
          disabled={isFull}
          className={`mt-6 w-full py-3 px-4 rounded-md ${
            isFull
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isFull ? 'Full' : 'Join Community'}
        </button>
      </div>
    </div>
  );
}