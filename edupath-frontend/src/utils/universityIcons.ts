// University icon mapping utility
import defaultUniIcon from '../assets/universitiesicon/Open University of Kenya.jpg'
import jkuatIcon from '../assets/universitiesicon/Jomo Kenyatta University Of Agriculture And Technology.jpg'
import masenoIcon from '../assets/universitiesicon/Maseno University.png'
import murangaIcon from '../assets/universitiesicon/muranga-university-of-technology.jpg'
import tukuIcon from '../assets/universitiesicon/Technical University of Kenya.jpg'
import tumIcon from '../assets/universitiesicon/Technical University of Mombasa.jpg'
import anuIcon from '../assets/universitiesicon/Africa Nazarene University.jpg'
import cueaIcon from '../assets/universitiesicon/Catholic University of Eastern Africa.jpg'
import coopIcon from '../assets/universitiesicon/Co-operative University of Kenya.jpg'
import kemuIcon from '../assets/universitiesicon/Kenya Methodist University.jpg'
import kibabiiIcon from '../assets/universitiesicon/Kibabii-University.jpg'
import mmuIcon from '../assets/universitiesicon/Multimedia University of Kenya.jpg'
import pwaniIcon from '../assets/universitiesicon/Pwani University.webp'
import ummaIcon from '../assets/universitiesicon/UMMA University.png'
import ueaIcon from '../assets/universitiesicon/University of Eastern Africa, Baraton.jpeg'
import uoeIcon from '../assets/universitiesicon/University Of Eldoret Eldoret.jpeg'
import uonIcon from '../assets/universitiesicon/university of nairobi.jpg'
import kuIcon from '../assets/universitiesicon/Kenyatta university.png'
import egertonIcon from '../assets/universitiesicon/Egerton University.png'
import kcaIcon from '../assets/universitiesicon/KCA University.png'
import mountKenyaIcon from '../assets/universitiesicon/mount kenya university.png'
import rongoIcon from '../assets/universitiesicon/Rongo University.jpg'
import sekuIcon from '../assets/universitiesicon/South Eastern Kenya University.png'
// University icon mapping
const universityIconMap: { [key: string]: string } = {
  // JKUAT variations - has specific icon
  'Jomo Kenyatta University of Agriculture and Technology': jkuatIcon,
  'JKUAT': jkuatIcon,
  'Jomo Kenyatta University': jkuatIcon,
  
  // Maseno University - has specific icon
  'Maseno University': masenoIcon,
  
  // Technical Universities - have specific icons
  'Muranga University of Technology': murangaIcon,
  'Technical University of Kenya': tukuIcon,
  'TUK': tukuIcon,
  'Technical University of Mombasa': tumIcon,
  'TUM': tumIcon,
  
  // Private Universities - have specific icons
  'Africa Nazarene University': anuIcon,
  'ANU': anuIcon,
  'Catholic University of Eastern Africa': cueaIcon,
  'CUEA': cueaIcon,
  'Co-operative University of Kenya': coopIcon,
  'Kenya Methodist University': kemuIcon,
  'KEMU': kemuIcon,
  'Multimedia University of Kenya': mmuIcon,
  'MMU': mmuIcon,
  'UMMA University': ummaIcon,
  'UMMA': ummaIcon,
  
  // Regional Universities - have specific icons
  'Kibabii University': kibabiiIcon,
  'Pwani University': pwaniIcon,
  'University of Eastern Africa, Baraton': ueaIcon,
  'University of Eldoret': uoeIcon,
  'UoE': uoeIcon,
  
  // Major Public Universities - now using their specific icons
  'University of Nairobi': uonIcon,
  'UoN': uonIcon,
  'Kenyatta University': kuIcon,
  'KU': kuIcon,
  'Egerton University': egertonIcon,
  'Egerton': egertonIcon,
  
  // Additional Universities with specific icons
  'KCA University': kcaIcon,
  'KCA': kcaIcon,
  'Mount Kenya University': mountKenyaIcon,
  'MKU': mountKenyaIcon,
  'Rongo University': rongoIcon,
  'Rongo': rongoIcon,
  'South Eastern Kenya University': sekuIcon,
  'SEKU': sekuIcon,
  
  // Universities without specific icons (using default)
  'Moi University': defaultUniIcon,
  'Moi': defaultUniIcon,
  'Chuka University': defaultUniIcon,
  'Chuka': defaultUniIcon,
  'Kisii University': defaultUniIcon,
  'Kisii': defaultUniIcon,
  'Machakos University': defaultUniIcon,
  'Machakos': defaultUniIcon,
}

/**
 * Get university icon based on university name
 * @param universityName - The name of the university
 * @returns The icon path for the university, or default icon if not found
 */
export const getUniversityIcon = (universityName: string): string => {
  if (!universityName) return defaultUniIcon
  
  // Try exact match first
  if (universityIconMap[universityName]) {
    return universityIconMap[universityName]
  }
  
  // Try case-insensitive match
  const lowerName = universityName.toLowerCase()
  for (const [key, icon] of Object.entries(universityIconMap)) {
    if (key.toLowerCase() === lowerName) {
      return icon
    }
  }
  
  // Try partial match for common variations
  for (const [key, icon] of Object.entries(universityIconMap)) {
    if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
      return icon
    }
  }
  
  // Return default icon if no match found
  return defaultUniIcon
}

/**
 * Get all available university icons
 * @returns Object with university names as keys and icon paths as values
 */
export const getAllUniversityIcons = (): { [key: string]: string } => {
  return { ...universityIconMap }
}

/**
 * Check if a university has a specific icon
 * @param universityName - The name of the university
 * @returns True if university has a specific icon, false if using default
 */
export const hasUniversityIcon = (universityName: string): boolean => {
  return universityIconMap[universityName] !== defaultUniIcon
}

export default getUniversityIcon
