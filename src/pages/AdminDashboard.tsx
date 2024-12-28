import React, { useEffect, useState } from 'react';
import { ref, set, onValue, remove, update } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';
import { db, auth } from '../lib/firebase';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Shield, Users, Calendar, Plus, Trash2, Image } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

interface Community {
  id: string;
  name: string;
  maxCapacity: number;
  currentCount: number;
  logoUrl: string;
  countries: Record<string, string>;
}

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
}

interface NewCommunity {
  name: string;
  maxCapacity: string;
  logoUrl: string;
  countries: string[];
}

interface NewAdmin {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', description: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showAddCommunity, setShowAddCommunity] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newCommunity, setNewCommunity] = useState<NewCommunity>({
    name: '',
    maxCapacity: '5',
    logoUrl: '',
    countries: []
  });
  const [newAdmin, setNewAdmin] = useState<NewAdmin>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const storage = getStorage();

  useEffect(() => {
    if (user) {
      const adminRef = ref(db, `people/${user.uid}`);
      onValue(adminRef, (snapshot) => {
        if (!snapshot.exists() || snapshot.val().role !== 'admin') {
          toast.error('Unauthorized access');
          window.location.href = '/';
        }
      });

      const communitiesRef = ref(db, 'communities');
      const unsubscribeCommunities = onValue(communitiesRef, (snapshot) => {
        if (snapshot.exists()) {
          const communitiesData = Object.entries(snapshot.val()).map(([id, data]) => ({
            id,
            ...(data as Omit<Community, 'id'>),
          }));
          setCommunities(communitiesData);
        }
      });

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
        unsubscribeCommunities();
        unsubscribeEvents();
      };
    }
  }, [user]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const eventRef = ref(db, `events/${Date.now()}`);
      await set(eventRef, newEvent);
      setNewEvent({ title: '', date: '', description: '' });
      toast.success('Event added successfully');
    } catch (error) {
      toast.error('Failed to add event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await remove(ref(db, `events/${eventId}`));
      toast.success('Event deleted successfully');
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const fileRef = storageRef(storage, `logos/${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        console.log('File uploaded successfully. URL:', url);
        setNewCommunity({ ...newCommunity, logoUrl: url });
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error('Failed to upload logo. Please try again.');
      }
    }
  };

  const handleAddCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const maxCapacity = parseInt(newCommunity.maxCapacity);
      if (isNaN(maxCapacity) || maxCapacity < 1) {
        throw new Error('Invalid maximum capacity');
      }

      if (!newCommunity.logoUrl) {
        throw new Error('Please upload a logo');
      }

      const communityId = Date.now().toString();
      const countries: Record<string, string> = {};
      newCommunity.countries.forEach(country => {
        countries[country] = '';
      });

      await set(ref(db, `communities/${communityId}`), {
        name: newCommunity.name,
        maxCapacity,
        currentCount: 0,
        logoUrl: newCommunity.logoUrl,
        countries
      });

      setNewCommunity({ name: '', maxCapacity: '5', logoUrl: '', countries: [] });
      setShowAddCommunity(false);
      toast.success('Community added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add community');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (newAdmin.password !== newAdmin.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newAdmin.email,
        newAdmin.password
      );

      await set(ref(db, `people/${userCredential.user.uid}`), {
        name: newAdmin.name,
        email: newAdmin.email,
        role: 'admin',
        hash: userCredential.user.uid,
        emailVerified: true,
        createdAt: Date.now()
      });

      setNewAdmin({ name: '', email: '', password: '', confirmPassword: '' });
      setShowAddAdmin(false);
      toast.success('Admin added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add admin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCountryChange = (index: number, value: string) => {
    const updatedCountries = [...newCommunity.countries];
    updatedCountries[index] = value;
    setNewCommunity({ ...newCommunity, countries: updatedCountries });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <div className="flex space-x-4">
          <Button onClick={() => setShowAddCommunity(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Community
          </Button>
          <Button onClick={() => setShowAddAdmin(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Admin
          </Button>
        </div>
      </div>

      {/* Add Community Modal */}
      {showAddCommunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white pb-4 mb-4 border-b">
              <h2 className="text-xl font-bold">Add New Community</h2>
            </div>
            <form onSubmit={handleAddCommunity}>
              <Input
                label="Community Name"
                value={newCommunity.name}
                onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                required
              />
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    label="Maximum Capacity"
                    type="number"
                    min="1"
                    value={newCommunity.maxCapacity}
                    onChange={(e) => setNewCommunity({ ...newCommunity, maxCapacity: e.target.value })}
                    required
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                </div>
              </div>
              
              {newCommunity.logoUrl && (
                <div className="mt-2 mb-4">
                  <img
                    src={newCommunity.logoUrl}
                    alt="Community Logo Preview"
                    className="w-full h-40 object-cover rounded-lg"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL';
                    }}
                  />
                </div>
              )}
              
              {Array.from({ length: parseInt(newCommunity.maxCapacity) || 0 }).map((_, index) => (
                <Input
                  key={index}
                  label={`Country ${index + 1}`}
                  value={newCommunity.countries[index] || ''}
                  onChange={(e) => handleCountryChange(index, e.target.value)}
                  required
                />
              ))}

              <div className="sticky bottom-0 bg-white pt-4 mt-6 border-t">
                <div className="flex space-x-4">
                  <Button type="submit" isLoading={isLoading}>
                    Add Community
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowAddCommunity(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white pb-4 mb-4 border-b">
              <h2 className="text-xl font-bold">Add New Admin</h2>
            </div>
            <form onSubmit={handleAddAdmin}>
              <Input
                label="Full Name"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                required
              />
              <Input
                label="Password"
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                value={newAdmin.confirmPassword}
                onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })}
                required
              />

              <div className="sticky bottom-0 bg-white pt-4 mt-6 border-t">
                <div className="flex space-x-4">
                  <Button type="submit" isLoading={isLoading}>
                    Add Admin
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowAddAdmin(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Communities Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Communities</h2>
          </div>

          <div className="space-y-4">
            {communities.map((community) => (
              <div key={community.id} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex items-center space-x-4">
                  <img
                    src={community.logoUrl}
                    alt={`${community.name} logo`}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{community.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Members: {community.currentCount}/{community.maxCapacity}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Countries:</p>
                  <div className="mt-1 space-y-1">
                    {Object.entries(community.countries).map(([country, userId]) => (
                      <p key={country} className="text-sm text-gray-600">
                        {country}: {userId ? '🔒 Taken' : '✅ Available'}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Event Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Events</h2>
          </div>

          <form onSubmit={handleAddEvent} className="mb-6">
            <Input
              label="Event Title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              required
            />
            <Input
              label="Date"
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              required
            />
            <Input
              label="Description"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              required
            />
            <Button type="submit" isLoading={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </form>

          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="flex justify-between items-start border-b border-gray-200 pb-4 last:border-0">
                <div>
                  <h3 className="font-medium text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{event.date}</p>
                  <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                </div>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}