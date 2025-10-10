from django.core.management.base import BaseCommand
from apps.hubs.models import CareerHub


class Command(BaseCommand):
    help = 'Populate database with career hub communities'

    def handle(self, *args, **kwargs):
        # First, delete all existing hubs
        from apps.hubs.models import CareerHub
        CareerHub.objects.all().delete()
        self.stdout.write(self.style.WARNING('Deleted all existing hubs'))

        hubs_data = [
            {
                'name': 'Engineering Hub',
                'field': 'Engineering',
                'category': 'Engineering',
                'icon': '⚙️',
                'icon_url': '/assets/hubs/engineeringhubicon.png',
                'color': 'bg-blue-600',
                'description': 'A place for engineers, students, and enthusiasts to share projects, ask questions, and discuss engineering topics. From civil to software engineering!',
                'rules': '1. Be respectful\n2. No spam\n3. Share knowledge freely\n4. Help others learn',
                'related_societies': [
                    {'name': 'Institution of Engineers of Kenya (IEK)', 'website': 'https://iek.or.ke', 'description': 'Professional body for engineers in Kenya'},
                    {'name': 'IEEE Kenya Section', 'website': 'https://ieee.org', 'description': 'Institute of Electrical and Electronics Engineers'},
                    {'name': 'Kenya Association of Manufacturers (KAM)', 'website': 'https://kam.co.ke', 'description': 'Manufacturing and industrial engineering'},
                    {'name': 'Kenya Private Sector Alliance (KEPSA)', 'website': 'https://kepsa.or.ke', 'description': 'Private sector engineering opportunities'}
                ]
            },
            {
                'name': 'Aviation Hub',
                'field': 'Aviation',
                'category': 'Aviation',
                'icon': '✈️',
                'icon_url': '/assets/hubs/aviationhubicon.jpeg',
                'color': 'bg-sky-600',
                'description': 'For pilots, aviation enthusiasts, and anyone interested in flying. Share experiences, ask questions, and discuss aviation news.',
                'rules': '1. Safety first\n2. Share flying experiences\n3. Ask questions\n4. Be supportive',
                'related_societies': [
                    {'name': 'Kenya Airways', 'website': 'https://kenya-airways.com', 'description': 'National carrier and aviation career opportunities'},
                    {'name': 'AMREF Flying Doctors', 'website': 'https://amref.org', 'description': 'Medical aviation and humanitarian flying'},
                    {'name': 'Kenya Civil Aviation Authority (KCAA)', 'website': 'https://kcaa.or.ke', 'description': 'Aviation regulatory body'},
                    {'name': 'Kenya Airline Pilots Association (KALPA)', 'website': 'https://kalpa.or.ke', 'description': 'Professional pilots association'}
                ]
            },
            {
                'name': 'Tech Hub',
                'field': 'Technology',
                'category': 'Technology',
                'icon': '💻',
                'icon_url': '/assets/hubs/techhubicon.jpeg',
                'color': 'bg-purple-600',
                'description': "Kenya's tech community hub. Share coding projects, discuss tech trends, ask for help, and connect with fellow developers.",
                'rules': '1. Share code responsibly\n2. Help beginners\n3. Discuss tech trends\n4. No piracy',
                'related_societies': [
                    {'name': 'Kenya ICT Authority', 'website': 'https://ict.go.ke', 'description': 'Government ICT regulatory body'},
                    {'name': 'iHub Kenya', 'website': 'https://ihub.co.ke', 'description': 'Tech innovation hub and community'},
                    {'name': 'Google Developer Groups Kenya', 'website': 'https://gdg.community.dev', 'description': 'Google developer community'},
                    {'name': 'Microsoft User Group Kenya', 'website': 'https://mugkenya.org', 'description': 'Microsoft technology community'}
                ]
            },
            {
                'name': 'Health Hub',
                'field': 'Health',
                'category': 'Health',
                'icon': '🏥',
                'icon_url': '/assets/hubs/healthhubicon.png',
                'color': 'bg-red-600',
                'description': 'Health discussions, medical advice, wellness tips, and healthcare experiences. A supportive community for health-related topics.',
                'rules': '1. Respect privacy\n2. No medical diagnoses\n3. Share experiences\n4. Be supportive',
                'related_societies': [
                    {'name': 'Kenya Medical Practitioners and Dentists Union (KMPDU)', 'website': 'https://kmpdu.org', 'description': 'Medical professionals union'},
                    {'name': 'Kenya Red Cross Society', 'website': 'https://redcross.or.ke', 'description': 'Humanitarian medical services'},
                    {'name': 'Ministry of Health Kenya', 'website': 'https://health.go.ke', 'description': 'Government health department'},
                    {'name': 'Kenya Medical Association (KMA)', 'website': 'https://kma.or.ke', 'description': 'Professional medical association'}
                ]
            },
            {
                'name': 'Business Hub',
                'field': 'Business',
                'category': 'Business',
                'icon': '💼',
                'icon_url': '/assets/hubs/businesshubicon.png',
                'color': 'bg-green-600',
                'description': 'Entrepreneurs, business owners, and professionals sharing insights, opportunities, and discussing business strategies.',
                'rules': '1. No spam\n2. Share insights\n3. Help others succeed\n4. Ethical business only',
                'related_societies': [
                    {'name': 'Kenya Private Sector Alliance (KEPSA)', 'website': 'https://kepsa.or.ke', 'description': 'Private sector business association'},
                    {'name': 'Kenya National Chamber of Commerce', 'website': 'https://kenyachamber.or.ke', 'description': 'Business networking and advocacy'},
                    {'name': 'Kenya Association of Manufacturers (KAM)', 'website': 'https://kam.co.ke', 'description': 'Manufacturing and industrial business'},
                    {'name': 'Young Entrepreneurs Association Kenya', 'website': 'https://yea.co.ke', 'description': 'Young business leaders network'}
                ]
            },
            {
                'name': 'Agriculture Hub',
                'field': 'Agriculture',
                'category': 'Agriculture',
                'icon': '🌾',
                'icon_url': '/assets/hubs/agriculturehubicon.jpeg',
                'color': 'bg-yellow-600',
                'description': 'Farmers, agricultural students, and agribusiness enthusiasts sharing farming tips, market insights, and agricultural innovations.',
                'rules': '1. Share farming knowledge\n2. Respect all farming methods\n3. Discuss innovations\n4. Help fellow farmers',
                'related_societies': [
                    {'name': 'Ministry of Agriculture Kenya', 'website': 'https://agriculture.go.ke', 'description': 'Government agriculture department'},
                    {'name': 'Kenya National Farmers Federation (KENAFF)', 'website': 'https://kenaff.org', 'description': 'National farmers organization'},
                    {'name': 'Agricultural Society of Kenya (ASK)', 'website': 'https://ask.co.ke', 'description': 'Agricultural development and shows'},
                    {'name': 'Kenya Agricultural Research Institute (KARI)', 'website': 'https://kalro.org', 'description': 'Agricultural research and innovation'}
                ]
            },
            {
                'name': 'Education Hub',
                'field': 'Education',
                'category': 'Education',
                'icon': '📚',
                'icon_url': '/assets/hubs/eduhubicon.jpeg',
                'color': 'bg-indigo-600',
                'description': 'Teachers, students, and education enthusiasts discussing learning methods, sharing resources, and education news.',
                'rules': '1. Share resources\n2. Respect educators\n3. Help students\n4. Discuss teaching methods',
                'related_societies': [
                    {'name': 'Ministry of Education Kenya', 'website': 'https://education.go.ke', 'description': 'Government education department'},
                    {'name': 'Kenya National Union of Teachers (KNUT)', 'website': 'https://knut.or.ke', 'description': 'Teachers professional union'},
                    {'name': 'Kenya Union of Post Primary Education Teachers (KUPPET)', 'website': 'https://kuppet.org', 'description': 'Secondary school teachers union'},
                    {'name': 'Kenya Institute of Curriculum Development (KICD)', 'website': 'https://kicd.ac.ke', 'description': 'Curriculum development and research'}
                ]
            },
            {
                'name': 'Creative Hub',
                'field': 'Creative',
                'category': 'Creative',
                'icon': '🎨',
                'icon_url': '/assets/hubs/creativehubicon.jpeg',
                'color': 'bg-pink-600',
                'description': 'Artists, designers, writers, and creatives sharing their work, collaborating on projects, and discussing creative processes.',
                'rules': '1. Credit artists\n2. Share constructive feedback\n3. No art theft\n4. Collaborate freely',
                'related_societies': [
                    {'name': 'Kenya Film Commission', 'website': 'https://filmingkenya.com', 'description': 'Film and media industry support'},
                    {'name': 'Kenya National Theatre', 'website': 'https://nationaltheatre.or.ke', 'description': 'Performing arts and theatre'},
                    {'name': 'GoDown Arts Centre', 'website': 'https://godownartscentre.com', 'description': 'Contemporary arts and culture'},
                    {'name': 'Kenya Writers Guild', 'website': 'https://kenyawritersguild.org', 'description': 'Professional writers association'}
                ]
            },
            {
                'name': 'Hospitality Hub',
                'field': 'Hospitality',
                'category': 'Hospitality',
                'icon': '🏨',
                'icon_url': '/assets/hubs/hospitalityhubicon.png',
                'color': 'bg-orange-600',
                'description': 'Hospitality professionals, tourism workers, and service industry folks sharing experiences, tips, and industry insights.',
                'rules': '1. Share experiences\n2. Respect customers\n3. Discuss service excellence\n4. Help industry peers',
                'related_societies': [
                    {'name': 'Kenya Association of Hotel Keepers and Caterers (KAHC)', 'website': 'https://kahc.or.ke', 'description': 'Hotel and catering industry association'},
                    {'name': 'Kenya Tourism Board (KTB)', 'website': 'https://magicalkenya.com', 'description': 'National tourism marketing body'},
                    {'name': 'Kenya Utalii College', 'website': 'https://utalii.ac.ke', 'description': 'Hospitality and tourism training'},
                    {'name': 'Kenya Association of Travel Agents (KATA)', 'website': 'https://kata.or.ke', 'description': 'Travel agents professional body'}
                ]
            },
            {
                'name': 'Law Hub',
                'field': 'Legal',
                'category': 'Legal',
                'icon': '⚖️',
                'icon_url': '/assets/hubs/lawhubicon.png',
                'color': 'bg-gray-600',
                'description': 'Law students, legal professionals, and citizens discussing legal matters, sharing knowledge, and legal news.',
                'rules': '1. No legal advice\n2. Share legal knowledge\n3. Discuss cases ethically\n4. Respect confidentiality',
                'related_societies': [
                    {'name': 'Law Society of Kenya (LSK)', 'website': 'https://lsk.or.ke', 'description': 'Professional body for lawyers'},
                    {'name': 'Kenya Law Reports', 'website': 'https://kenyalaw.org', 'description': 'Legal information and case law'},
                    {'name': 'Kenya National Commission on Human Rights (KNCHR)', 'website': 'https://knchr.org', 'description': 'Human rights advocacy'},
                    {'name': 'Kenya Magistrates and Judges Association', 'website': 'https://kmja.or.ke', 'description': 'Judicial officers professional body'}
                ]
            },
        ]

        created_count = 0
        updated_count = 0

        for hub_data in hubs_data:
            hub, created = CareerHub.objects.update_or_create(
                name=hub_data['name'],
                defaults=hub_data
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created hub: {hub.name}'))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f'Updated hub: {hub.name}'))

        self.stdout.write(self.style.SUCCESS(
            f'\nCompleted! Created {created_count} hubs, Updated {updated_count} hubs'
        ))

