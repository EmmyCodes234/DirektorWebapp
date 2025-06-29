import React from 'react';
import { Team } from '../types/database';

interface TeamLogoProps {
  team?: Team | null;
  teamName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showFlag?: boolean;
  className?: string;
}

const COUNTRY_FLAGS: Record<string, string> = {
  'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'AU': '🇦🇺', 'NZ': '🇳🇿',
  'NG': '🇳🇬', 'GH': '🇬🇭', 'KE': '🇰🇪', 'ZA': '🇿🇦', 'UG': '🇺🇬',
  'IN': '🇮🇳', 'PK': '🇵🇰', 'BD': '🇧🇩', 'LK': '🇱🇰', 'MY': '🇲🇾',
  'SG': '🇸🇬', 'TH': '🇹🇭', 'PH': '🇵🇭', 'ID': '🇮🇩', 'VN': '🇻🇳',
  'FR': '🇫🇷', 'DE': '🇩🇪', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱',
  'BE': '🇧🇪', 'CH': '🇨🇭', 'AT': '🇦🇹', 'SE': '🇸🇪', 'NO': '🇳🇴',
  'DK': '🇩🇰', 'FI': '🇫🇮', 'IE': '🇮🇪', 'PT': '🇵🇹', 'GR': '🇬🇷',
  'BR': '🇧🇷', 'AR': '🇦🇷', 'MX': '🇲🇽', 'CL': '🇨🇱', 'CO': '🇨🇴',
  'JP': '🇯🇵', 'KR': '🇰🇷', 'CN': '🇨🇳', 'TW': '🇹🇼', 'HK': '🇭🇰',
  'IL': '🇮🇱', 'TR': '🇹🇷', 'EG': '🇪🇬', 'MA': '🇲🇦', 'TN': '🇹🇳'
};

// Map of country codes to full country names
const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States', 'CA': 'Canada', 'GB': 'United Kingdom', 'AU': 'Australia', 'NZ': 'New Zealand',
  'NG': 'Nigeria', 'GH': 'Ghana', 'KE': 'Kenya', 'ZA': 'South Africa', 'UG': 'Uganda',
  'IN': 'India', 'PK': 'Pakistan', 'BD': 'Bangladesh', 'LK': 'Sri Lanka', 'MY': 'Malaysia',
  'SG': 'Singapore', 'TH': 'Thailand', 'PH': 'Philippines', 'ID': 'Indonesia', 'VN': 'Vietnam',
  'FR': 'France', 'DE': 'Germany', 'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands',
  'BE': 'Belgium', 'CH': 'Switzerland', 'AT': 'Austria', 'SE': 'Sweden', 'NO': 'Norway',
  'DK': 'Denmark', 'FI': 'Finland', 'IE': 'Ireland', 'PT': 'Portugal', 'GR': 'Greece',
  'BR': 'Brazil', 'AR': 'Argentina', 'MX': 'Mexico', 'CL': 'Chile', 'CO': 'Colombia',
  'JP': 'Japan', 'KR': 'South Korea', 'CN': 'China', 'TW': 'Taiwan', 'HK': 'Hong Kong',
  'IL': 'Israel', 'TR': 'Turkey', 'EG': 'Egypt', 'MA': 'Morocco', 'TN': 'Tunisia'
};

const TeamLogo: React.FC<TeamLogoProps> = ({ 
  team, 
  teamName, 
  size = 'md', 
  showFlag = true, 
  className = '' 
}) => {
  const sizeClasses = {
    xs: 'w-4 h-4 text-xs',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const getTeamInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);
  };

  const logoElement = team?.logo_url ? (
    <img
      src={team.logo_url}
      alt={`${teamName} logo`}
      className={`${sizeClasses[size]} rounded-full object-cover border border-gray-600 ${className}`}
      onError={(e) => {
        // Fallback to initials if image fails to load
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const parent = target.parentElement;
        if (parent) {
          parent.innerHTML = `
            <div class="${sizeClasses[size]} rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold font-orbitron border border-gray-600 ${className}">
              ${getTeamInitials(teamName)}
            </div>
          `;
        }
      }}
    />
  ) : (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold font-orbitron border border-gray-600 ${className}`}>
      {getTeamInitials(teamName)}
    </div>
  );

  if (showFlag && team?.country && COUNTRY_FLAGS[team.country]) {
    return (
      <div className="flex items-center gap-2">
        {logoElement}
        <div className="flex items-center gap-1">
          <span className="text-sm">{COUNTRY_FLAGS[team.country]}</span>
          <span className="text-sm text-gray-300">{COUNTRY_NAMES[team.country]}</span>
        </div>
      </div>
    );
  }

  return logoElement;
};

export default TeamLogo;