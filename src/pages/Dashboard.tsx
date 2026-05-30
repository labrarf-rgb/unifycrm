import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Clock, Heart, BarChart3, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Constituent } from '../types';
import { constituentService, settingsService, donationService, volunteerService, getConstituentTags } from '../services/db';

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Constituent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [tagMap, setTagMap] = useState<Record<string, string[]>>({});
  const [stats, setStats] = useState({
    totalDonated: 0,
    activeVolunteers: 0,
    serviceHours: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const loadSettings = async () => {
      const curr = await settingsService.getCurrency();
      setCurrency(curr);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      const [donated, volunteers, hours] = await Promise.all([
        donationService.getGrandTotal(),
        volunteerService.getActiveCount(),
        volunteerService.getTotalHours()
      ]);
      setStats({
        totalDonated: donated,
        activeVolunteers: volunteers,
        serviceHours: hours
      });
    };
    
    loadStats();
    const intervalId = setInterval(loadStats, 10000); // Update every 10s for "real-time" feel
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleSearch = async () => {
      if (searchTerm.length < 2) {
        setResults([]);
        setTagMap({});
        return;
      }
      setIsSearching(true);
      try {
        const data = await constituentService.search(searchTerm);
        setResults(data);

        const newTagMap: Record<string, string[]> = {};
        for (const person of data) {
          const tags = await getConstituentTags(person.id, person.createdAt);
          if (person.isBoardMember) tags.push('Board Member');
          tags.push(person.status === 'active' ? 'Active' : 'Inactive');
          newTagMap[person.id] = tags;
        }
        setTagMap(newTagMap);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(handleSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-12">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-[#5A5A40]/10 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[10px] md:text-[11px] font-bold text-[#5A5A40]/60 uppercase tracking-widest">Total Donated</h3>
            <Heart className="w-5 h-5 text-[#5A5A40]/40 flex-shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold brand-font text-[#2d2d2a] mt-1 md:mt-2 italic break-words">
            {settingsService.formatCompactCurrency(stats.totalDonated, currency)}
          </p>
          <p className="text-[9px] md:text-[10px] text-[#5A5A40] font-bold uppercase mt-1 tracking-tighter">Impact growing</p>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-[#5A5A40]/10 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[10px] md:text-[11px] font-bold text-[#5A5A40]/60 uppercase tracking-widest">Active Volunteers</h3>
            <Clock className="w-5 h-5 text-[#5A5A40]/40 flex-shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold brand-font text-[#2d2d2a] mt-1 md:mt-2 italic break-words">
            {settingsService.formatCompactNumber(stats.activeVolunteers)}
          </p>
          <p className="text-[9px] md:text-[10px] text-[#5A5A40] font-bold uppercase mt-1 tracking-tighter">On-site today</p>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-[#5A5A40]/10 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[10px] md:text-[11px] font-bold text-[#5A5A40]/60 uppercase tracking-widest">Service Hours</h3>
            <BarChart3 className="w-5 h-5 text-[#5A5A40]/40 flex-shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold brand-font text-[#2d2d2a] mt-1 md:mt-2 italic break-words">
            {settingsService.formatCompactNumber(stats.serviceHours)}
          </p>
          <p className="text-[9px] md:text-[10px] text-[#5A5A40] font-bold uppercase mt-1 tracking-tighter">Fiscal year</p>
        </div>
      </div>

      {/* Main Search Hub */}
      <div className="space-y-6">
        <div className="relative group max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#5A5A40]/40" />
          </div>
          <input
            type="text"
            className="block w-full pl-14 pr-6 py-5 bg-white border border-[#5A5A40]/20 rounded-full shadow-lg shadow-[#5A5A40]/5 focus:ring-4 focus:ring-[#5A5A40]/5 focus:border-[#5A5A40]/40 outline-none transition-all text-lg placeholder:italic placeholder:font-serif"
            placeholder="Search constituents by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {searchTerm.length >= 2 && (
          <div className="bg-white border border-[#5A5A40]/10 rounded-[2rem] shadow-2xl overflow-hidden divide-y divide-gray-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {results.length > 0 ? (
              results.map((person) => (
                <div
                  key={person.id}
                  className="data-row hover:bg-[#f5f5f0]/50"
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
                    <button className="p-2 hover:bg-[#f5f5f0] rounded-full transition-colors">
                      <Mail className="w-4 h-4 text-[#5A5A40]/40" />
                    </button>
                  </div>
                </div>
              ))
            ) : !isSearching ? (
              <div key={searchTerm} className="p-12 space-y-8 bg-[#fafafa]">
                <div className="text-center space-y-2">
                  <p className="text-[#5A5A40]/60 italic font-serif text-lg">No matching records found.</p>
                  <div className="h-px w-12 bg-[#5A5A40]/10 mx-auto"></div>
                </div>
                
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get('name') as string;
                    const email = formData.get('email') as string;
                    if (name && email) {
                      const newC = await constituentService.create({
                        name,
                        email,
                        status: 'active',
                        tags: ['New'],
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                      });
                      navigate(`/constituent/${newC.id}`);
                    }
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto p-8 bg-white rounded-[2.5rem] border border-[#5A5A40]/10 shadow-sm"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Full Name</label>
                    <input name="name" type="text" defaultValue={searchTerm.includes('@') ? '' : searchTerm} required className="w-full px-5 py-3 rounded-2xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-[#5A5A40]/60 tracking-widest ml-1">Email Address</label>
                    <input name="email" type="email" defaultValue={searchTerm.includes('@') ? searchTerm : ''} required className="w-full px-5 py-3 rounded-2xl bg-[#f5f5f0] border-transparent focus:bg-white focus:ring-2 focus:ring-[#5A5A40]/20 outline-none transition-all" />
                  </div>
                  <button type="submit" className="md:col-span-2 py-4 bg-[#5A5A40] text-white rounded-full font-bold hover:bg-[#4a4a35] transition-all shadow-xl shadow-[#5A5A40]/10 flex items-center justify-center mt-4">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Complete Registration
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-12 text-center text-[#5A5A40]/40 italic font-serif">Searching records...</div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
        {/* Quick actions can be added here in the future */}
      </div>
    </div>
  );
}
