import React, { useEffect, useState } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { UserCircle, Calendar, Users } from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  community?: {
    id: string;
    country: string;
  };
  createdAt: number;
}

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
}

export function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [communityName, setCommunityName] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Fetch user profile
      const profileRef = ref(db, `people/${user.uid}`);
      const unsubscribeProfile = onValue(profileRef, async (snapshot) => {
        if (snapshot.exists()) {
          const profileData = snapshot.val() as UserProfile;
          setProfile(profileData);
          
          // If user has a community, fetch community name
          if (profileData.community) {
            const communityRef = ref(db, `communities/${profileData.community.id}`);
            const communitySnapshot = await get(communityRef);
            if (communitySnapshot.exists()) {
              setCommunityName(communitySnapshot.val().name);
            }
          }
          setLoading(false);
        }
      });

      // Fetch events
      const eventsRef = ref(db, 'events');
      const unsubscribeEvents = onValue(eventsRef, (snapshot) => {
        if (snapshot.exists()) {
          const eventsData = Object.entries(snapshot.val()).map(([id, data]) => ({
            id,
            ...(data as Omit<Event, 'id'>),
          }));
          setEvents(eventsData);
        }
      });

      return () => {
        unsubscribeProfile();
        unsubscribeEvents();
      };
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-4 mb-6">
              <UserCircle className="h-16 w-16 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-gray-600">{profile.email}</p>
                {!profile.emailVerified && (
                  <p className="text-yellow-600 text-sm mt-1">Please verify your email</p>
                )}
              </div>
            </div>

            {profile.community && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Community Membership</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{communityName}</span>
                  </div>
                  <p className="text-gray-600">Representing: {profile.community.country}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            </div>
            
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <h3 className="font-medium text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{event.date}</p>
                  <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-gray-600 text-sm">No upcoming events</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}