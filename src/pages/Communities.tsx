import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import { Users } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  logoUrl: string;
  currentCount: number;
  maxCapacity: number;
  countries: Record<string, string>;
}

export function Communities() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const communitiesRef = ref(db, 'communities');
    const unsubscribe = onValue(communitiesRef, (snapshot) => {
      if (snapshot.exists()) {
        const communitiesData = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          name: data.name,
          logoUrl: data.logoUrl,
          currentCount: data.currentCount || 0,
          maxCapacity: data.maxCapacity,
          countries: data.countries || {}
        }));
        setCommunities(communitiesData);
      }
    });

    return () => unsubscribe();
  }, []);

  const getAvailableCountriesCount = (countries: Record<string, string>) => {
    return Object.values(countries).filter(value => value === "").length;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Choose Your Community</h1>
        <p className="mt-2 text-gray-600">Select a community to join and start your MUN journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communities.map((community) => (
          <div key={community.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <img
              src={community.logoUrl}
              alt={`${community.name} logo`}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{community.name}</h3>
              <div className="flex items-center text-gray-600 mb-4">
                <Users className="h-5 w-5 mr-2" />
                <span>{community.currentCount}/{community.maxCapacity} Members</span>
              </div>
              <p className="text-gray-600 mb-4">
                Available Countries: {getAvailableCountriesCount(community.countries)}
              </p>
              <button
                onClick={() => navigate(`/signup?community=${community.id}`)}
                disabled={community.currentCount >= community.maxCapacity}
                className={`w-full py-2 px-4 rounded-md font-medium ${
                  community.currentCount >= community.maxCapacity
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {community.currentCount >= community.maxCapacity ? 'Full' : 'Join Community'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}