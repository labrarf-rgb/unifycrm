import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Users, Search } from 'lucide-react';
import { constituentService, getConstituentTags } from '../services/db';
import { Constituent } from '../types';

export default function Constituents() {
  const [constituents, setConstituents] = useState<Constituent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [tagMap, setTagMap] = useState<Record<string, string[]>>({});
  const [activeFilter, setActiveFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    const loadConstituents = async () => {
      try {
        // Fetch all constituents by using an empty search string
        const data = await constituentService.search('');
        setConstituents(data);

        const newTagMap: Record<string, string[]> = {};
        for (const person of data) {
          const tags = await getConstituentTags(person.id, person.createdAt);
          if (person.isBoardMember) tags.push('Board Member');
          tags.push(person.status === 'active' ? 'Active' : 'Inactive');
          newTagMap[person.id] = tags;
        }
        setTagMap(newTagMap);
      } catch (error) {
        console.error('Failed to load constituents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConstituents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5A5A40]"></div>
      </div>
    );
  }

  const availableTags = Array.from(new Set(Object.values(tagMap).flat()));
  const filterOptions = ['All', 'Donor', 'Volunteer', 'New', 'Board Member', 'Active', 'Inactive'].filter(
    (tag) => tag === 'All' || availableTags.includes(tag)
  );

  const filteredConstituents = constituents.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'All' || (tagMap[c.id] || []).includes(activeFilter);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold brand-font italic text-[#2d2d2a]">Constituent Directory</h1>
          <p className="text-[#5A5A40]/60 text-xs md:text-sm">Manage and view all members of your organization.</p>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-[#5A5A40]/40" />
        </div>
        <input
          type="text"
          className="block w-full py-4 pl-14 pr-6 bg-white border border-[#5A5A40]/20 rounded-full focus:ring-4 focus:ring-[#5A5A40]/5 focus:border-[#5A5A40]/40 outline-none transition-all text-base placeholder:italic placeholder:font-serif shadow-sm"
          placeholder="Search constituents by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2 px-1">
        {filterOptions.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveFilter(tag)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              activeFilter === tag
                ? 'bg-[#5A5A40] text-white shadow-md'
                : 'bg-white border border-[#5A5A40]/20 text-[#5A5A40]/60 hover:border-[#5A5A40]/40 hover:text-[#5A5A40]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#5A5A40]/10 rounded-[2rem] shadow-sm overflow-hidden divide-y divide-gray-50">
        {filteredConstituents.length > 0 ? (
          filteredConstituents.map((person) => (
            <div
              key={person.id}
              className="data-row hover:bg-[#f5f5f0]/50 cursor-pointer"
              onClick={() => navigate(`/constituent/${person.id}`)}
            >
              <div className="flex flex-col">
                <span className="font-bold text-[#2d2d2a] brand-font text-lg italic">{person.name}</span>
                <span className="text-[10px] text-[#5A5A40]/60 font-bold uppercase tracking-widest">{person.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                {(tagMap[person.id] || []).map(tag => (
                  <span key={tag} className="px-3 py-1 bg-[#e8e8df] text-[#5A5A40] text-[9px] font-bold uppercase tracking-widest rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="text-right flex items-center justify-end space-x-4">
                <span className={`w-2 h-2 rounded-full ${person.status === 'active' ? 'bg-[#5A5A40]' : 'bg-gray-200'}`} />
                <button 
                  className="p-2 hover:bg-[#f5f5f0] rounded-full transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `mailto:${person.email}`;
                  }}
                >
                  <Mail className="w-4 h-4 text-[#5A5A40]/40" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-[#5A5A40]/60 italic font-serif text-lg">
            No constituents found.
          </div>
        )}
      </div>
    </div>
  );
}