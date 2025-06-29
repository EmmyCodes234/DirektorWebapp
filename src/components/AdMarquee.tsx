import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Ad {
  id: string;
  text: string;
  url?: string;
  priority?: number;
  countries?: string[];
}

const AdMarquee: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Detect user's country (simplified version)
    // In a production app, you might use a geolocation service or IP lookup
    const detectUserCountry = async () => {
      try {
        // Check if country is stored in user profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('country')
            .eq('id', user.id)
            .single();
            
          if (profile?.country) {
            setUserCountry(profile.country);
            return;
          }
        }
        
        // Fallback to browser language for demo purposes
        // This is not accurate for country detection but serves as a placeholder
        const browserLang = navigator.language || 'en-US';
        const countryCode = browserLang.split('-')[1];
        if (countryCode && countryCode.length === 2) {
          setUserCountry(countryCode);
        }
      } catch (err) {
        console.error('Error detecting country:', err);
      }
    };

    detectUserCountry();
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('active', true)
        .gte('start_date', new Date().toISOString().split('T')[0])
        .lte('end_date', new Date().toISOString().split('T')[0])
        .order('priority', { ascending: true, nullsLast: true });
        
      if (error) throw error;
      
      setAds(data || []);
    } catch (err) {
      console.error('Error fetching ads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter ads based on country targeting
  const filteredAds = ads.filter(ad => {
    // If ad has no country targeting, show to everyone
    if (!ad.countries || ad.countries.length === 0) {
      return true;
    }
    
    // If we couldn't detect user's country, show global ads only
    if (!userCountry) {
      return false;
    }
    
    // Show if user's country is in the ad's target countries
    return ad.countries.includes(userCountry);
  });

  // Default message when no ads are available
  const defaultMessage = "Welcome to Direktor! Sign in to continue your session or Sign up for a free account to start managing tournaments.";

  // Handle sign in/up clicks from default message
  const handleSignIn = () => {
    navigate('/auth/signin');
  };

  const handleSignUp = () => {
    navigate('/auth/signup');
  };

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  return (
    <div className="bg-gradient-to-r from-blue-900/80 to-purple-900/80 text-white py-2 overflow-hidden border-b border-blue-500/30">
      <div className="marquee-container relative">
        {filteredAds.length > 0 ? (
          <div className="marquee flex whitespace-nowrap animate-marquee">
            {filteredAds.map((ad, index) => (
              <React.Fragment key={ad.id}>
                {ad.url ? (
                  <a 
                    href={ad.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mx-4 hover:text-blue-300 transition-colors duration-200"
                  >
                    {ad.text}
                  </a>
                ) : (
                  <span className="mx-4">{ad.text}</span>
                )}
                {index < filteredAds.length - 1 && (
                  <span className="mx-4 text-blue-400">•</span>
                )}
              </React.Fragment>
            ))}
            
            {/* Repeat for continuous effect */}
            {filteredAds.map((ad, index) => (
              <React.Fragment key={`repeat-${ad.id}`}>
                {ad.url ? (
                  <a 
                    href={ad.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mx-4 hover:text-blue-300 transition-colors duration-200"
                  >
                    {ad.text}
                  </a>
                ) : (
                  <span className="mx-4">{ad.text}</span>
                )}
                {index < filteredAds.length - 1 && (
                  <span className="mx-4 text-blue-400">•</span>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="marquee flex whitespace-nowrap animate-marquee">
            <span className="mx-4">
              {defaultMessage.split('Sign in').map((part, i, arr) => {
                if (i === 0) {
                  return (
                    <React.Fragment key={i}>
                      {part}
                      <button 
                        onClick={handleSignIn}
                        className="text-blue-300 hover:text-blue-200 hover:underline mx-1 font-medium"
                      >
                        Sign in
                      </button>
                    </React.Fragment>
                  );
                } else if (i === arr.length - 1) {
                  return (
                    <React.Fragment key={i}>
                      {part.split('Sign up').map((subpart, j, subarr) => {
                        if (j === 0) {
                          return (
                            <React.Fragment key={j}>
                              {subpart}
                              <button 
                                onClick={handleSignUp}
                                className="text-green-300 hover:text-green-200 hover:underline mx-1 font-medium"
                              >
                                Sign up
                              </button>
                            </React.Fragment>
                          );
                        }
                        return subpart;
                      })}
                    </React.Fragment>
                  );
                }
                return part;
              })}
            </span>
            
            {/* Repeat for continuous effect */}
            <span className="mx-4">
              {defaultMessage.split('Sign in').map((part, i, arr) => {
                if (i === 0) {
                  return (
                    <React.Fragment key={`repeat-${i}`}>
                      {part}
                      <button 
                        onClick={handleSignIn}
                        className="text-blue-300 hover:text-blue-200 hover:underline mx-1 font-medium"
                      >
                        Sign in
                      </button>
                    </React.Fragment>
                  );
                } else if (i === arr.length - 1) {
                  return (
                    <React.Fragment key={`repeat-${i}`}>
                      {part.split('Sign up').map((subpart, j, subarr) => {
                        if (j === 0) {
                          return (
                            <React.Fragment key={`repeat-${j}`}>
                              {subpart}
                              <button 
                                onClick={handleSignUp}
                                className="text-green-300 hover:text-green-200 hover:underline mx-1 font-medium"
                              >
                                Sign up
                              </button>
                            </React.Fragment>
                          );
                        }
                        return subpart;
                      })}
                    </React.Fragment>
                  );
                }
                return part;
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdMarquee;