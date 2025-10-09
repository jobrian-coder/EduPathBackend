import agricultureIcon from '../../../assets/hubs/agriculturehubicon.jpeg';
import aviationIcon from '../../../assets/hubs/aviationhubicon.jpeg';
import businessIcon from '../../../assets/hubs/businesshubicon.png';
import creativeIcon from '../../../assets/hubs/creativehubicon.jpeg';
import eduIcon from '../../../assets/hubs/eduhubicon.jpeg';
import engineeringIcon from '../../../assets/hubs/engineeringhubicon.png';
import healthIcon from '../../../assets/hubs/healthhubicon.png';
import hospitalityIcon from '../../../assets/hubs/hospitalityhubicon.png';
import lawIcon from '../../../assets/hubs/lawhubicon.png';
import techIcon from '../../../assets/hubs/techhubicon.jpeg';

export interface HubSociety {
  id: string;
  name: string;
  acronym: string;
  full_name: string;
  logo: string;
  type: string;
  description: string;
  website?: string;
  icon: string;
}

export const HUB_SOCIETIES: HubSociety[] = [
  {
    id: '1',
    name: 'r/Engineering',
    acronym: 'ENG',
    full_name: 'Engineering Community',
    logo: '⚙️',
    type: 'Community',
    description: 'A place for engineers, students, and enthusiasts to share projects, ask questions, and discuss engineering topics. From civil to software engineering!',
    website: undefined,
    icon: engineeringIcon
  },
  {
    id: '2',
    name: 'r/Aviation',
    acronym: 'AVI',
    full_name: 'Aviation Community',
    logo: '✈️',
    type: 'Community',
    description: 'For pilots, aviation enthusiasts, and anyone interested in flying. Share experiences, ask questions, and discuss aviation news.',
    website: undefined,
    icon: aviationIcon
  },
  {
    id: '3',
    name: 'r/TechKenya',
    acronym: 'TECH',
    full_name: 'Tech Community',
    logo: '💻',
    type: 'Community',
    description: 'Kenya\'s tech community hub. Share coding projects, discuss tech trends, ask for help, and connect with fellow developers.',
    website: undefined,
    icon: techIcon
  },
  {
    id: '4',
    name: 'r/HealthKenya',
    acronym: 'HEALTH',
    full_name: 'Health Community',
    logo: '🏥',
    type: 'Community',
    description: 'Health discussions, medical advice, wellness tips, and healthcare experiences. A supportive community for health-related topics.',
    website: undefined,
    icon: healthIcon
  },
  {
    id: '5',
    name: 'r/BusinessKenya',
    acronym: 'BIZ',
    full_name: 'Business Community',
    logo: '💼',
    type: 'Community',
    description: 'Entrepreneurs, business owners, and professionals sharing insights, opportunities, and discussing business strategies.',
    website: undefined,
    icon: businessIcon
  },
  {
    id: '6',
    name: 'r/Agriculture',
    acronym: 'AGRI',
    full_name: 'Agriculture Community',
    logo: '🌾',
    type: 'Community',
    description: 'Farmers, agricultural students, and agribusiness enthusiasts sharing farming tips, market insights, and agricultural innovations.',
    website: undefined,
    icon: agricultureIcon
  },
  {
    id: '7',
    name: 'r/EducationKenya',
    acronym: 'EDU',
    full_name: 'Education Community',
    logo: '📚',
    type: 'Community',
    description: 'Teachers, students, and education enthusiasts discussing learning methods, sharing resources, and education news.',
    website: undefined,
    icon: eduIcon
  },
  {
    id: '8',
    name: 'r/CreativeKenya',
    acronym: 'CREATIVE',
    full_name: 'Creative Community',
    logo: '🎨',
    type: 'Community',
    description: 'Artists, designers, writers, and creatives sharing their work, collaborating on projects, and discussing creative processes.',
    website: undefined,
    icon: creativeIcon
  },
  {
    id: '9',
    name: 'r/Hospitality',
    acronym: 'HOSP',
    full_name: 'Hospitality Community',
    logo: '🏨',
    type: 'Community',
    description: 'Hospitality professionals, tourism workers, and service industry folks sharing experiences, tips, and industry insights.',
    website: undefined,
    icon: hospitalityIcon
  },
  {
    id: '10',
    name: 'r/LegalKenya',
    acronym: 'LAW',
    full_name: 'Legal Community',
    logo: '⚖️',
    type: 'Community',
    description: 'Law students, legal professionals, and citizens discussing legal matters, sharing knowledge, and legal news.',
    website: undefined,
    icon: lawIcon
  }
];
