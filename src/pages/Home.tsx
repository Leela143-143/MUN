import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import { CommunityCard } from '../components/CommunityCard';
import { ScrollableCards } from '../components/ScrollableCards';
import { GraduationCap, Award } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  logoUrl: string;
  currentCount: number;
  maxCapacity: number;
}

export function Home() {
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    const communitiesRef = ref(db, 'communities');
    const unsubscribe = onValue(communitiesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const communitiesList = Object.entries(data).map(([id, community]) => ({
          id,
          ...(community as Omit<Community, 'id'>),
        }));
        setCommunities(communitiesList);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="flex justify-center mb-4">
          <GraduationCap className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to IIST Model United Nations
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Join the Indian Institute of Space Science and Technology's premier diplomatic simulation event.
          Engage in global discourse, develop leadership skills, and be part of a transformative experience.
        </p>
      </section>

      {/* About IIST Section */}
      <section className="mb-16">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            About IIST
          </h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-gray-600 mb-4">
                The Indian Institute of Space Science and Technology (IIST) is a premier space research and education institution,
                established by the Indian Space Research Organisation (ISRO) under the Department of Space, Government of India.
              </p>
              <p className="text-gray-600">
                Located in Thiruvananthapuram, Kerala, IIST is Asia's first Space University, nurturing exceptional talent
                for the future of space exploration and research.
              </p>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1517976547714-720226b864c1?auto=format&fit=crop&q=80&w=800"
                alt="IIST Campus"
                className="rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <Award className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900">Our Sponsors</h2>
          <p className="text-gray-600 mt-2">Proud partners supporting the future of diplomatic excellence</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* SpaceX */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=800"
              alt="SpaceX"
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">SpaceX</h3>
              <p className="text-gray-600">
                Revolutionizing space technology and supporting the next generation of space enthusiasts through educational initiatives and diplomatic discourse.
              </p>
            </div>
          </div>

          {/* Boeing */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&q=80&w=800"
              alt="Boeing"
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Boeing</h3>
              <p className="text-gray-600">
                Leading aerospace innovation while fostering international cooperation and supporting diplomatic education through Model United Nations programs.
              </p>
            </div>
          </div>

          {/* Lockheed Martin */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1557367184-663fba4b8b91?auto=format&fit=crop&q=80&w=800"
              alt="Lockheed Martin"
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Lockheed Martin</h3>
              <p className="text-gray-600">
                Advancing defense and space technology while promoting international dialogue and supporting future leaders through diplomatic simulations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Communities Section */}
      <section>
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Available Communities
        </h2>
        <ScrollableCards>
          {communities.map((community) => (
            <CommunityCard key={community.id} {...community} />
          ))}
        </ScrollableCards>
      </section>
    </div>
  );
}