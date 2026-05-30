import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserCheck, UserX, Clock, ArrowLeft, Heart } from 'lucide-react';
import { constituentService, volunteerService } from '../services/db';
import { Constituent, VolunteerLog } from '../types';
import AdminLockModal from '../components/AdminLockModal';

export default function Kiosk() {
  const [searchTerm, setSearchTerm] = useState('');
  const [foundPerson, setFoundPerson] = useState<Constituent | null>(null);
  const [activeSession, setActiveSession] = useState<VolunteerLog | null>(null);
  const [step, setStep] = useState<'search' | 'confirm'>('search');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [showExitLock, setShowExitLock] = useState(false);
  const navigate = useNavigate();

  const handleLookup = async () => {
    if (!searchTerm) return;
    try {
      const results = await constituentService.search(searchTerm);
      if (results.length > 0) {
        const person = results[0]; // Take first match for simple kiosk
        setFoundPerson(person);
        const session = await volunteerService.getActiveSession(person.id);
        setActiveSession(session);
        setStep('confirm');
      } else {
        setMessage({ text: "Person not found. Please register at the front desk.", type: 'error' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetKiosk = () => {
    setStep('search');
    setSearchTerm('');
    setFoundPerson(null);
    setActiveSession(null);
    setMessage(null);
  };

  const handleAction = async () => {
    if (!foundPerson) return;
    try {
      if (activeSession) {
        await volunteerService.checkOut(activeSession.id);
        setMessage({ text: `Successfully checked out, ${foundPerson.name}! See you next time.`, type: 'success' });
      } else {
        await volunteerService.checkIn(foundPerson.id);
        setMessage({ text: `Welcome, ${foundPerson.name}! You are now checked in.`, type: 'success' });
      }
      // Reset after 5 seconds automatically, or immediately via button
      setTimeout(() => {
        // Only reset if we are still showing a message (user hasn't clicked Done)
        setMessage(prev => {
          if (prev?.type === 'success') {
            resetKiosk();
          }
          return prev;
        });
      }, 5000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#2d2d2a] flex flex-col items-center justify-center p-6">
      <button 
        onClick={() => setShowExitLock(true)}
        className="absolute top-8 left-8 flex items-center text-[#5A5A40]/60 hover:text-[#5A5A40] transition-colors font-bold text-[10px] uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Exit Kiosk
      </button>

      <AdminLockModal 
        isOpen={showExitLock}
        onClose={() => setShowExitLock(false)}
        onSuccess={() => {
          setShowExitLock(false);
          navigate('/');
        }}
        title="Escort Exit"
        description="Admin authorization is required to deactivate kiosk mode and return to dashboard."
      />

      <div className="max-w-2xl w-full space-y-6 md:space-y-12 text-center">
        <div className="space-y-4">
          <Heart className="w-12 h-12 md:w-16 md:h-16 text-[#5A5A40] mx-auto opacity-20" />
          <h1 className="text-3xl md:text-5xl font-bold brand-font italic tracking-tight text-[#5A5A40]">CommonGround</h1>
          <p className="text-[#5A5A40]/60 uppercase tracking-widest font-bold text-[9px] md:text-xs">Self-Service Attendance Kiosk</p>
        </div>

        {step === 'search' ? (
          <div className="space-y-6 md:space-y-8 max-w-lg mx-auto">
            <div className="relative">
              <input
                type="text"
                className="w-full bg-white border border-[#5A5A40]/20 rounded-full px-6 md:px-10 py-5 md:py-8 text-xl md:text-2xl focus:ring-4 focus:ring-[#5A5A40]/5 focus:border-[#5A5A40] outline-none transition-all placeholder:text-gray-300 text-center font-serif italic"
                placeholder="Type your name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              />
            </div>
            <button
              onClick={handleLookup}
              className="kiosk-btn bg-[#5A5A40] text-white hover:bg-[#4a4a35] shadow-2xl shadow-[#5A5A40]/20 w-full py-4 md:py-6"
            >
              Find My Profile
            </button>
          </div>
        ) : (
          <div className="bg-white border border-[#5A5A40]/10 p-8 md:p-16 rounded-3xl md:rounded-[4rem] space-y-8 md:space-y-12 animate-in zoom-in duration-500 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#5A5A40]" />
            {message ? (
              <div className="space-y-6 md:space-y-8">
                <div className={`text-2xl md:text-4xl font-bold brand-font italic ${message.type === 'success' ? 'text-[#5A5A40]' : 'text-red-800'}`}>
                  {message.text}
                </div>
                {message.type === 'success' && (
                  <button 
                    onClick={resetKiosk}
                    className="px-8 md:px-12 py-4 md:py-5 bg-[#5A5A40]/10 text-[#5A5A40] rounded-full font-bold text-xs md:text-sm uppercase tracking-widest hover:bg-[#5A5A40]/20 transition-all"
                  >
                    Done / Next Person
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-[#5A5A40]/40 uppercase tracking-[0.3em] text-[8px] md:text-[10px] font-bold">Welcome Back</p>
                  <h2 className="text-3xl md:text-5xl font-bold brand-font italic text-[#2d2d2a]">{foundPerson?.name}</h2>
                </div>

                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleAction}
                    className={`kiosk-btn flex flex-col sm:flex-row items-center justify-center p-8 md:p-14 w-full text-xl md:text-2xl gap-4 ${
                      activeSession ? 'bg-red-800/10 text-red-800 border-2 border-red-800/20' : 'bg-[#5A5A40] text-white'
                    }`}
                  >
                    {activeSession ? (
                      <>
                        <UserX className="w-6 h-6 md:w-8 md:h-8 opacity-50" />
                        Check Out Now
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-6 h-6 md:w-8 md:h-8 opacity-50" />
                        Check In Now
                      </>
                    )}
                  </button>
                </div>

                <button 
                  onClick={() => setStep('search')}
                  className="text-[#5A5A40]/40 hover:text-[#5A5A40] underline underline-offset-8 decoration-[#5A5A40]/10 text-xs font-bold uppercase tracking-widest"
                >
                  That's not my account
                </button>
              </>
            )}
          </div>
        )}

        {message?.type === 'error' && !message.text.includes("Successfully") && (
          <div className="p-6 bg-red-50 border border-red-100 rounded-3xl text-red-800 brand-font italic text-lg shadow-sm">
            {message.text}
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-8 border-t border-[#5A5A40]/5 text-center hidden md:block">
        <p className="text-[10px] text-[#5A5A40]/40 uppercase tracking-[0.5em] font-bold italic">UnifyCRM Enterprise Kiosk System Experience</p>
      </div>
    </div>
  );
}
