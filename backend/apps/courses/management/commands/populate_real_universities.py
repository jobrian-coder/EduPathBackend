from django.core.management.base import BaseCommand
from apps.courses.models import University
import random


class Command(BaseCommand):
    help = 'Populate database with real Kenyan universities'

    def handle(self, *args, **kwargs):
        # First, delete all existing universities
        University.objects.all().delete()
        self.stdout.write(self.style.WARNING('Deleted all existing universities'))

        # University data with realistic information
        universities_data = [
            # Public Universities
            {
                'code': 'AA01', 'name': 'Africa International University', 'short_name': 'AIU',
                'type': 'Private', 'location': 'Nairobi', 'established': 1997, 'ranking': 45,
                'students': '3,500+', 'website': 'https://aiu.ac.ke',
                'description': 'A Christian university offering quality education in various fields including theology, business, and education.',
                'facilities': ['Library', 'Computer Labs', 'Sports Complex', 'Chapel', 'Student Hostels'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA02', 'name': 'Africa Nazarene University', 'short_name': 'ANU',
                'type': 'Private', 'location': 'Nairobi', 'established': 1994, 'ranking': 42,
                'students': '4,200+', 'website': 'https://anu.ac.ke',
                'description': 'A Christian university committed to providing holistic education with strong emphasis on character development.',
                'facilities': ['Library', 'Laboratories', 'Sports Facilities', 'Chapel', 'Dining Hall'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA03', 'name': 'Alupe University', 'short_name': 'ALUPE',
                'type': 'Public', 'location': 'Busia', 'established': 2013, 'ranking': 35,
                'students': '2,800+', 'website': 'https://alupe.ac.ke',
                'description': 'A public university focusing on agriculture, health sciences, and education in Western Kenya.',
                'facilities': ['Agricultural Research Center', 'Health Sciences Labs', 'Library', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA04', 'name': 'AMREF International University', 'short_name': 'AMIU',
                'type': 'Private', 'location': 'Nairobi', 'established': 2017, 'ranking': 48,
                'students': '1,500+', 'website': 'https://amiu.ac.ke',
                'description': 'Specialized in health sciences and public health, affiliated with AMREF Health Africa.',
                'facilities': ['Health Sciences Labs', 'Simulation Center', 'Library', 'Research Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA05', 'name': 'Bomet University College', 'short_name': 'BUC',
                'type': 'Public', 'location': 'Bomet', 'established': 2017, 'ranking': 40,
                'students': '2,200+', 'website': 'https://buc.ac.ke',
                'description': 'A constituent college of Moi University focusing on agriculture, education, and health sciences.',
                'facilities': ['Agricultural Research Center', 'Health Sciences Labs', 'Library', 'Student Hostels'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA06', 'name': 'Catholic University of Eastern Africa', 'short_name': 'CUEA',
                'type': 'Private', 'location': 'Nairobi', 'established': 1984, 'ranking': 15,
                'students': '12,000+', 'website': 'https://cuea.edu',
                'description': 'A leading Catholic university offering comprehensive education in various disciplines.',
                'facilities': ['Chapel', 'Library', 'Computer Labs', 'Sports Complex', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA07', 'name': 'Chuka University', 'short_name': 'CHUKA',
                'type': 'Public', 'location': 'Chuka', 'established': 2007, 'ranking': 25,
                'students': '8,500+', 'website': 'https://chuka.ac.ke',
                'description': 'A public university offering diverse programs in agriculture, education, and health sciences.',
                'facilities': ['Agricultural Research Center', 'Health Sciences Labs', 'Library', 'Sports Complex'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA08', 'name': 'Co-operative University of Kenya', 'short_name': 'CUK',
                'type': 'Public', 'location': 'Nairobi', 'established': 2011, 'ranking': 30,
                'students': '6,000+', 'website': 'https://cuk.ac.ke',
                'description': 'Specialized in cooperative studies, business, and agriculture with focus on cooperative movement.',
                'facilities': ['Cooperative Research Center', 'Business Labs', 'Library', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA09', 'name': 'Daystar University', 'short_name': 'DAYSTAR',
                'type': 'Private', 'location': 'Nairobi', 'established': 1974, 'ranking': 20,
                'students': '7,500+', 'website': 'https://daystar.ac.ke',
                'description': 'A Christian university known for excellence in communication, business, and theology.',
                'facilities': ['Media Center', 'Chapel', 'Library', 'Sports Facilities', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA10', 'name': 'Dedan Kimathi University of Technology', 'short_name': 'DEKUT',
                'type': 'Public', 'location': 'Nyeri', 'established': 2007, 'ranking': 18,
                'students': '9,000+', 'website': 'https://dkut.ac.ke',
                'description': 'A leading technology university offering engineering, ICT, and business programs.',
                'facilities': ['Engineering Labs', 'ICT Center', 'Library', 'Innovation Hub', 'Sports Complex'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA11', 'name': 'Egerton University', 'short_name': 'EGERTON',
                'type': 'Public', 'location': 'Njoro', 'established': 1939, 'ranking': 8,
                'students': '25,000+', 'website': 'https://egerton.ac.ke',
                'description': 'One of Kenya\'s oldest universities, renowned for agriculture, veterinary medicine, and engineering.',
                'facilities': ['Agricultural Research Center', 'Veterinary Hospital', 'Engineering Labs', 'Library', 'Sports Complex'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA12', 'name': 'Garissa University', 'short_name': 'GARISSA',
                'type': 'Public', 'location': 'Garissa', 'established': 2011, 'ranking': 38,
                'students': '3,000+', 'website': 'https://garissa.ac.ke',
                'description': 'A public university serving Northeastern Kenya with focus on education, agriculture, and health.',
                'facilities': ['Library', 'Health Sciences Labs', 'Agricultural Research Center', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA13', 'name': 'Great Lakes University of Kisumu', 'short_name': 'GLUK',
                'type': 'Private', 'location': 'Kisumu', 'established': 2002, 'ranking': 33,
                'students': '4,500+', 'website': 'https://gluk.ac.ke',
                'description': 'A private university offering programs in health sciences, business, and education.',
                'facilities': ['Health Sciences Labs', 'Library', 'Computer Labs', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA14', 'name': 'Gretsa University', 'short_name': 'GRETSA',
                'type': 'Private', 'location': 'Thika', 'established': 2006, 'ranking': 44,
                'students': '2,500+', 'website': 'https://gretsa.ac.ke',
                'description': 'A private university offering quality education in business, education, and health sciences.',
                'facilities': ['Business Labs', 'Library', 'Computer Labs', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA15', 'name': 'Islamic University of Kenya', 'short_name': 'IUK',
                'type': 'Private', 'location': 'Nairobi', 'established': 2013, 'ranking': 46,
                'students': '1,800+', 'website': 'https://iuk.ac.ke',
                'description': 'A private Islamic university offering programs in Islamic studies, business, and education.',
                'facilities': ['Mosque', 'Library', 'Computer Labs', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA16', 'name': 'Jaramogi Oginga Odinga University of Science and Technology', 'short_name': 'JOOUST',
                'type': 'Public', 'location': 'Bondo', 'established': 2009, 'ranking': 28,
                'students': '5,500+', 'website': 'https://jooust.ac.ke',
                'description': 'A public university focusing on science, technology, and agriculture in Western Kenya.',
                'facilities': ['Science Labs', 'Agricultural Research Center', 'Library', 'Sports Complex'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA17', 'name': 'Jomo Kenyatta University of Agriculture and Technology', 'short_name': 'JKUAT',
                'type': 'Public', 'location': 'Nairobi', 'established': 1994, 'ranking': 5,
                'students': '35,000+', 'website': 'https://jkuat.ac.ke',
                'description': 'A leading technology and agriculture university with strong research programs.',
                'facilities': ['Engineering Labs', 'Agricultural Research Center', 'ICT Center', 'Library', 'Innovation Hub'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA18', 'name': 'Kabarak University', 'short_name': 'KABARAK',
                'type': 'Private', 'location': 'Nakuru', 'established': 2000, 'ranking': 12,
                'students': '8,000+', 'website': 'https://kabarak.ac.ke',
                'description': 'A Christian university known for excellence in medicine, law, and business.',
                'facilities': ['Medical School', 'Law School', 'Library', 'Sports Complex', 'Chapel'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA19', 'name': 'Kaimosi Friends University', 'short_name': 'KAFU',
                'type': 'Private', 'location': 'Kaimosi', 'established': 2016, 'ranking': 50,
                'students': '1,200+', 'website': 'https://kafu.ac.ke',
                'description': 'A Quaker university offering programs in education, agriculture, and health sciences.',
                'facilities': ['Library', 'Health Sciences Labs', 'Agricultural Research Center', 'Chapel'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA20', 'name': 'Karatina University', 'short_name': 'KARU',
                'type': 'Public', 'location': 'Karatina', 'established': 2007, 'ranking': 32,
                'students': '4,000+', 'website': 'https://karu.ac.ke',
                'description': 'A public university offering programs in agriculture, education, and business.',
                'facilities': ['Agricultural Research Center', 'Library', 'Computer Labs', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA21', 'name': 'KCA University', 'short_name': 'KCA',
                'type': 'Private', 'location': 'Nairobi', 'established': 1989, 'ranking': 22,
                'students': '6,500+', 'website': 'https://kca.ac.ke',
                'description': 'A leading business and technology university with strong industry connections.',
                'facilities': ['Business School', 'ICT Center', 'Library', 'Innovation Hub', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA22', 'name': 'Kenya Assemblies of God East University', 'short_name': 'KAG EAST',
                'type': 'Private', 'location': 'Nairobi', 'established': 2012, 'ranking': 47,
                'students': '1,500+', 'website': 'https://kageast.ac.ke',
                'description': 'A Christian university offering programs in theology, business, and education.',
                'facilities': ['Chapel', 'Library', 'Computer Labs', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA23', 'name': 'Kenya Highlands Evangelical University', 'short_name': 'KHEU',
                'type': 'Private', 'location': 'Kericho', 'established': 2004, 'ranking': 41,
                'students': '2,800+', 'website': 'https://kheu.ac.ke',
                'description': 'A Christian university offering programs in theology, education, and health sciences.',
                'facilities': ['Chapel', 'Library', 'Health Sciences Labs', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA24', 'name': 'Kenya Methodist University', 'short_name': 'KEMU',
                'type': 'Private', 'location': 'Meru', 'established': 1997, 'ranking': 26,
                'students': '7,000+', 'website': 'https://kemu.ac.ke',
                'description': 'A Methodist university offering comprehensive programs in various disciplines.',
                'facilities': ['Chapel', 'Library', 'Health Sciences Labs', 'Sports Complex', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA25', 'name': 'Kenyatta University', 'short_name': 'KU',
                'type': 'Public', 'location': 'Nairobi', 'established': 1985, 'ranking': 3,
                'students': '50,000+', 'website': 'https://ku.ac.ke',
                'description': 'One of Kenya\'s largest and most prestigious universities with comprehensive programs.',
                'facilities': ['Medical School', 'Engineering Labs', 'Library', 'Sports Complex', 'Research Centers'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA26', 'name': 'Kenyatta University – Mama Ngina University College', 'short_name': 'KU-MNUC',
                'type': 'Public', 'location': 'Mombasa', 'established': 2016, 'ranking': 36,
                'students': '2,500+', 'website': 'https://ku.ac.ke/mnuc',
                'description': 'A constituent college of Kenyatta University offering programs in coastal Kenya.',
                'facilities': ['Library', 'Computer Labs', 'Student Center', 'Sports Facilities'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA27', 'name': 'Kibabii University', 'short_name': 'KIBU',
                'type': 'Public', 'location': 'Bungoma', 'established': 2015, 'ranking': 34,
                'students': '3,500+', 'website': 'https://kibu.ac.ke',
                'description': 'A public university offering programs in education, agriculture, and health sciences.',
                'facilities': ['Agricultural Research Center', 'Health Sciences Labs', 'Library', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA28', 'name': 'Kirinyaga University', 'short_name': 'KYU',
                'type': 'Public', 'location': 'Kerugoya', 'established': 2016, 'ranking': 39,
                'students': '2,800+', 'website': 'https://kyu.ac.ke',
                'description': 'A public university offering programs in agriculture, education, and business.',
                'facilities': ['Agricultural Research Center', 'Library', 'Computer Labs', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA29', 'name': 'Kiriri Women\'s University of Science and Technology', 'short_name': 'KWUST',
                'type': 'Private', 'location': 'Nairobi', 'established': 2002, 'ranking': 37,
                'students': '2,200+', 'website': 'https://kwust.ac.ke',
                'description': 'A women\'s university focusing on science, technology, and business education.',
                'facilities': ['Science Labs', 'Computer Labs', 'Library', 'Student Center', 'Women\'s Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA30', 'name': 'Laikipia University', 'short_name': 'LAIKIPIA',
                'type': 'Public', 'location': 'Nyahururu', 'established': 2013, 'ranking': 31,
                'students': '4,500+', 'website': 'https://laikipia.ac.ke',
                'description': 'A public university offering programs in agriculture, education, and health sciences.',
                'facilities': ['Agricultural Research Center', 'Health Sciences Labs', 'Library', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA31', 'name': 'Lukenya University', 'short_name': 'LUKENYA',
                'type': 'Private', 'location': 'Machakos', 'established': 2018, 'ranking': 52,
                'students': '1,000+', 'website': 'https://lukenya.ac.ke',
                'description': 'A private university offering programs in business, education, and health sciences.',
                'facilities': ['Business Labs', 'Library', 'Computer Labs', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA32', 'name': 'Maasai Mara University', 'short_name': 'MMU',
                'type': 'Public', 'location': 'Narok', 'established': 2008, 'ranking': 29,
                'students': '5,000+', 'website': 'https://mmarau.ac.ke',
                'description': 'A public university offering programs in tourism, agriculture, and education.',
                'facilities': ['Tourism Research Center', 'Agricultural Research Center', 'Library', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA33', 'name': 'Machakos University', 'short_name': 'MKU',
                'type': 'Public', 'location': 'Machakos', 'established': 2011, 'ranking': 27,
                'students': '6,500+', 'website': 'https://mksu.ac.ke',
                'description': 'A public university offering comprehensive programs in various disciplines.',
                'facilities': ['Engineering Labs', 'Health Sciences Labs', 'Library', 'Sports Complex', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA34', 'name': 'Management University of Africa', 'short_name': 'MUA',
                'type': 'Private', 'location': 'Nairobi', 'established': 2011, 'ranking': 43,
                'students': '2,000+', 'website': 'https://mua.ac.ke',
                'description': 'A private university specializing in management and business education.',
                'facilities': ['Business School', 'Library', 'Computer Labs', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA35', 'name': 'Marist International University College', 'short_name': 'MIUC',
                'type': 'Private', 'location': 'Nairobi', 'established': 2009, 'ranking': 49,
                'students': '1,500+', 'website': 'https://miuc.ac.ke',
                'description': 'A Catholic university college offering programs in education and business.',
                'facilities': ['Chapel', 'Library', 'Computer Labs', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA36', 'name': 'Maseno University', 'short_name': 'MASENO',
                'type': 'Public', 'location': 'Maseno', 'established': 1991, 'ranking': 10,
                'students': '20,000+', 'website': 'https://maseno.ac.ke',
                'description': 'A public university offering comprehensive programs with strong research focus.',
                'facilities': ['Research Centers', 'Library', 'Health Sciences Labs', 'Sports Complex', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA37', 'name': 'Masinde Muliro University of Science & Technology', 'short_name': 'MMUST',
                'type': 'Public', 'location': 'Kakamega', 'established': 2007, 'ranking': 14,
                'students': '15,000+', 'website': 'https://mmust.ac.ke',
                'description': 'A public university focusing on science, technology, and agriculture.',
                'facilities': ['Science Labs', 'Agricultural Research Center', 'Library', 'Sports Complex', 'Innovation Hub'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA38', 'name': 'Meru University of Science and Technology', 'short_name': 'MUST',
                'type': 'Public', 'location': 'Meru', 'established': 2008, 'ranking': 24,
                'students': '8,000+', 'website': 'https://must.ac.ke',
                'description': 'A public university offering programs in science, technology, and agriculture.',
                'facilities': ['Science Labs', 'Agricultural Research Center', 'Library', 'Sports Complex'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA39', 'name': 'Moi University', 'short_name': 'MOI',
                'type': 'Public', 'location': 'Eldoret', 'established': 1984, 'ranking': 4,
                'students': '40,000+', 'website': 'https://mu.ac.ke',
                'description': 'One of Kenya\'s leading public universities with comprehensive programs and research.',
                'facilities': ['Medical School', 'Engineering Labs', 'Agricultural Research Center', 'Library', 'Sports Complex'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA40', 'name': 'Mount Kenya University', 'short_name': 'MKU',
                'type': 'Private', 'location': 'Thika', 'established': 1996, 'ranking': 11,
                'students': '25,000+', 'website': 'https://mku.ac.ke',
                'description': 'A leading private university offering comprehensive programs across multiple campuses.',
                'facilities': ['Medical School', 'Engineering Labs', 'Library', 'Sports Complex', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA41', 'name': 'Multimedia University of Kenya', 'short_name': 'MMU',
                'type': 'Public', 'location': 'Nairobi', 'established': 2008, 'ranking': 23,
                'students': '7,500+', 'website': 'https://mmu.ac.ke',
                'description': 'A public university specializing in ICT, media, and communication technologies.',
                'facilities': ['ICT Center', 'Media Labs', 'Library', 'Innovation Hub', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA42', 'name': 'Murang\'a University of Technology', 'short_name': 'MUT',
                'type': 'Public', 'location': 'Murang\'a', 'established': 2016, 'ranking': 21,
                'students': '6,000+', 'website': 'https://mut.ac.ke',
                'description': 'A public university focusing on technology, engineering, and agriculture.',
                'facilities': ['Engineering Labs', 'Agricultural Research Center', 'Library', 'Innovation Hub'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA43', 'name': 'Open University of Kenya', 'short_name': 'OUK',
                'type': 'Public', 'location': 'Nairobi', 'established': 2023, 'ranking': 51,
                'students': '500+', 'website': 'https://ouk.ac.ke',
                'description': 'Kenya\'s first open university offering flexible distance learning programs.',
                'facilities': ['Digital Learning Center', 'Library', 'Student Support Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA44', 'name': 'Pan Africa Christian University', 'short_name': 'PACU',
                'type': 'Private', 'location': 'Nairobi', 'established': 1978, 'ranking': 19,
                'students': '5,500+', 'website': 'https://pacu.ac.ke',
                'description': 'A Christian university offering programs in theology, business, and education.',
                'facilities': ['Chapel', 'Library', 'Computer Labs', 'Sports Facilities', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA45', 'name': 'Presbyterian University of East Africa', 'short_name': 'PUEA',
                'type': 'Private', 'location': 'Kikuyu', 'established': 2007, 'ranking': 17,
                'students': '6,500+', 'website': 'https://puea.ac.ke',
                'description': 'A Presbyterian university offering comprehensive programs in various disciplines.',
                'facilities': ['Chapel', 'Library', 'Health Sciences Labs', 'Sports Complex', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA46', 'name': 'Pwani University', 'short_name': 'PWANI',
                'type': 'Public', 'location': 'Kilifi', 'established': 2007, 'ranking': 16,
                'students': '12,000+', 'website': 'https://pwani.ac.ke',
                'description': 'A public university serving the coastal region with comprehensive programs.',
                'facilities': ['Marine Research Center', 'Health Sciences Labs', 'Library', 'Sports Complex', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA47', 'name': 'Riara University', 'short_name': 'RIARA',
                'type': 'Private', 'location': 'Nairobi', 'established': 2012, 'ranking': 13,
                'students': '4,500+', 'website': 'https://riara.ac.ke',
                'description': 'A private university offering programs in business, education, and health sciences.',
                'facilities': ['Business School', 'Health Sciences Labs', 'Library', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA48', 'name': 'Rongo University', 'short_name': 'RONGO',
                'type': 'Public', 'location': 'Rongo', 'established': 2016, 'ranking': 37,
                'students': '3,000+', 'website': 'https://rongo.ac.ke',
                'description': 'A public university offering programs in agriculture, education, and health sciences.',
                'facilities': ['Agricultural Research Center', 'Health Sciences Labs', 'Library', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA49', 'name': 'Scott Christian University', 'short_name': 'SCU',
                'type': 'Private', 'location': 'Machakos', 'established': 1997, 'ranking': 38,
                'students': '2,500+', 'website': 'https://scott.ac.ke',
                'description': 'A Christian university offering programs in theology, education, and business.',
                'facilities': ['Chapel', 'Library', 'Computer Labs', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA50', 'name': 'South Eastern Kenya University', 'short_name': 'SEKU',
                'type': 'Public', 'location': 'Kitui', 'established': 2013, 'ranking': 20,
                'students': '8,500+', 'website': 'https://seku.ac.ke',
                'description': 'A public university offering comprehensive programs in Eastern Kenya.',
                'facilities': ['Agricultural Research Center', 'Health Sciences Labs', 'Library', 'Sports Complex', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA51', 'name': 'St Paul\'s University', 'short_name': 'SPU',
                'type': 'Private', 'location': 'Nairobi', 'established': 1903, 'ranking': 9,
                'students': '8,000+', 'website': 'https://spu.ac.ke',
                'description': 'One of Kenya\'s oldest universities offering comprehensive programs.',
                'facilities': ['Chapel', 'Library', 'Health Sciences Labs', 'Sports Complex', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA52', 'name': 'Taita Taveta University', 'short_name': 'TTU',
                'type': 'Public', 'location': 'Voi', 'established': 2016, 'ranking': 40,
                'students': '2,800+', 'website': 'https://ttu.ac.ke',
                'description': 'A public university offering programs in agriculture, education, and health sciences.',
                'facilities': ['Agricultural Research Center', 'Health Sciences Labs', 'Library', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA53', 'name': 'Tangaza University', 'short_name': 'TANGAZA',
                'type': 'Private', 'location': 'Nairobi', 'established': 1986, 'ranking': 16,
                'students': '3,500+', 'website': 'https://tangaza.ac.ke',
                'description': 'A Catholic university offering programs in theology, education, and social sciences.',
                'facilities': ['Chapel', 'Library', 'Computer Labs', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA54', 'name': 'Technical University of Kenya', 'short_name': 'TUK',
                'type': 'Public', 'location': 'Nairobi', 'established': 2007, 'ranking': 6,
                'students': '18,000+', 'website': 'https://tukenya.ac.ke',
                'description': 'A leading technical university offering engineering, technology, and business programs.',
                'facilities': ['Engineering Labs', 'ICT Center', 'Library', 'Innovation Hub', 'Sports Complex'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA55', 'name': 'Technical University of Mombasa', 'short_name': 'TUM',
                'type': 'Public', 'location': 'Mombasa', 'established': 2007, 'ranking': 7,
                'students': '15,000+', 'website': 'https://tum.ac.ke',
                'description': 'A technical university specializing in engineering, technology, and maritime studies.',
                'facilities': ['Engineering Labs', 'Maritime Center', 'Library', 'Innovation Hub', 'Sports Complex'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA56', 'name': 'Tharaka University', 'short_name': 'THARAKA',
                'type': 'Public', 'location': 'Tharaka', 'established': 2017, 'ranking': 42,
                'students': '1,800+', 'website': 'https://tharaka.ac.ke',
                'description': 'A public university offering programs in agriculture, education, and health sciences.',
                'facilities': ['Agricultural Research Center', 'Health Sciences Labs', 'Library', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA57', 'name': 'The East African University', 'short_name': 'TEAU',
                'type': 'Private', 'location': 'Nairobi', 'established': 2010, 'ranking': 45,
                'students': '2,000+', 'website': 'https://teau.ac.ke',
                'description': 'A private university offering programs in business, education, and health sciences.',
                'facilities': ['Business Labs', 'Library', 'Computer Labs', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA58', 'name': 'Tom Mboya University', 'short_name': 'TMU',
                'type': 'Public', 'location': 'Homa Bay', 'established': 2016, 'ranking': 41,
                'students': '2,200+', 'website': 'https://tmu.ac.ke',
                'description': 'A public university offering programs in agriculture, education, and health sciences.',
                'facilities': ['Agricultural Research Center', 'Health Sciences Labs', 'Library', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA59', 'name': 'Turkana University College', 'short_name': 'TUC',
                'type': 'Public', 'location': 'Lodwar', 'established': 2017, 'ranking': 48,
                'students': '1,200+', 'website': 'https://tuc.ac.ke',
                'description': 'A constituent college of Moi University serving Northern Kenya.',
                'facilities': ['Library', 'Health Sciences Labs', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA60', 'name': 'University of Eastern Africa, Baraton', 'short_name': 'UEAB',
                'type': 'Private', 'location': 'Eldoret', 'established': 1979, 'ranking': 18,
                'students': '4,500+', 'website': 'https://ueab.ac.ke',
                'description': 'A Seventh-day Adventist university offering comprehensive programs.',
                'facilities': ['Chapel', 'Library', 'Health Sciences Labs', 'Sports Complex', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA61', 'name': 'University of Eldoret', 'short_name': 'UOE',
                'type': 'Public', 'location': 'Eldoret', 'established': 2010, 'ranking': 15,
                'students': '10,000+', 'website': 'https://uoeld.ac.ke',
                'description': 'A public university offering programs in agriculture, education, and health sciences.',
                'facilities': ['Agricultural Research Center', 'Health Sciences Labs', 'Library', 'Sports Complex', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA62', 'name': 'University of Embu', 'short_name': 'UEMBU',
                'type': 'Public', 'location': 'Embu', 'established': 2011, 'ranking': 25,
                'students': '5,500+', 'website': 'https://embuni.ac.ke',
                'description': 'A public university offering programs in agriculture, education, and health sciences.',
                'facilities': ['Agricultural Research Center', 'Health Sciences Labs', 'Library', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA63', 'name': 'University of Kabianga', 'short_name': 'UOK',
                'type': 'Public', 'location': 'Kericho', 'established': 2013, 'ranking': 30,
                'students': '4,500+', 'website': 'https://kabianga.ac.ke',
                'description': 'A public university offering programs in agriculture, education, and health sciences.',
                'facilities': ['Agricultural Research Center', 'Health Sciences Labs', 'Library', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA64', 'name': 'University of Nairobi', 'short_name': 'UON',
                'type': 'Public', 'location': 'Nairobi', 'established': 1970, 'ranking': 1,
                'students': '70,000+', 'website': 'https://uon.ac.ke',
                'description': 'Kenya\'s premier university and the largest institution of higher learning.',
                'facilities': ['Medical School', 'Engineering Labs', 'Law School', 'Library', 'Research Centers', 'Sports Complex'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA65', 'name': 'UZIMA University', 'short_name': 'UZIMA',
                'type': 'Private', 'location': 'Kisumu', 'established': 2012, 'ranking': 35,
                'students': '2,500+', 'website': 'https://uzima.ac.ke',
                'description': 'A private university specializing in health sciences and medicine.',
                'facilities': ['Medical School', 'Health Sciences Labs', 'Library', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA66', 'name': 'Zetech University', 'short_name': 'ZETECH',
                'type': 'Private', 'location': 'Nairobi', 'established': 1999, 'ranking': 14,
                'students': '8,500+', 'website': 'https://zetech.ac.ke',
                'description': 'A private university offering programs in technology, business, and education.',
                'facilities': ['ICT Center', 'Business Labs', 'Library', 'Innovation Hub', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA67', 'name': 'Koitaleel Samoei University College', 'short_name': 'KSUC',
                'type': 'Public', 'location': 'Nandi', 'established': 2018, 'ranking': 46,
                'students': '1,500+', 'website': 'https://ksuc.ac.ke',
                'description': 'A constituent college of Moi University offering programs in agriculture and education.',
                'facilities': ['Agricultural Research Center', 'Library', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA68', 'name': 'TUK (Technical University of Kenya)', 'short_name': 'TUK',
                'type': 'Public', 'location': 'Nairobi', 'established': 2007, 'ranking': 6,
                'students': '18,000+', 'website': 'https://tukenya.ac.ke',
                'description': 'A leading technical university offering engineering, technology, and business programs.',
                'facilities': ['Engineering Labs', 'ICT Center', 'Library', 'Innovation Hub', 'Sports Complex'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA69', 'name': 'TUM (Technical University of Mombasa)', 'short_name': 'TUM',
                'type': 'Public', 'location': 'Mombasa', 'established': 2007, 'ranking': 7,
                'students': '15,000+', 'website': 'https://tum.ac.ke',
                'description': 'A technical university specializing in engineering, technology, and maritime studies.',
                'facilities': ['Engineering Labs', 'Maritime Center', 'Library', 'Innovation Hub', 'Sports Complex'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA70', 'name': 'SEKU (South Eastern Kenya University)', 'short_name': 'SEKU',
                'type': 'Public', 'location': 'Kitui', 'established': 2013, 'ranking': 20,
                'students': '8,500+', 'website': 'https://seku.ac.ke',
                'description': 'A public university offering comprehensive programs in Eastern Kenya.',
                'facilities': ['Agricultural Research Center', 'Health Sciences Labs', 'Library', 'Sports Complex', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA71', 'name': 'UEAB (University of Eastern Africa, Baraton)', 'short_name': 'UEAB',
                'type': 'Private', 'location': 'Eldoret', 'established': 1979, 'ranking': 18,
                'students': '4,500+', 'website': 'https://ueab.ac.ke',
                'description': 'A Seventh-day Adventist university offering comprehensive programs.',
                'facilities': ['Chapel', 'Library', 'Health Sciences Labs', 'Sports Complex', 'Student Center'],
                'accreditation': 'Commission for University Education (CUE)'
            },
            {
                'code': 'AA72', 'name': 'OPEN (Open University of Kenya)', 'short_name': 'OUK',
                'type': 'Public', 'location': 'Nairobi', 'established': 2023, 'ranking': 51,
                'students': '500+', 'website': 'https://ouk.ac.ke',
                'description': 'Kenya\'s first open university offering flexible distance learning programs.',
                'facilities': ['Digital Learning Center', 'Library', 'Student Support Center'],
                'accreditation': 'Commission for University Education (CUE)'
            }
        ]

        # Create universities
        created_count = 0
        for uni_data in universities_data:
            # Skip duplicates (some codes appear twice with different names)
            if University.objects.filter(code=uni_data['code']).exists():
                continue
                
            university = University.objects.create(
                name=uni_data['name'],
                short_name=uni_data['short_name'],
                type=uni_data['type'],
                location=uni_data['location'],
                logo='🎓',  # Default logo
                established=uni_data['established'],
                ranking=uni_data['ranking'],
                students=uni_data['students'],
                website=uni_data['website'],
                description=uni_data['description'],
                facilities=uni_data['facilities'],
                accreditation=uni_data['accreditation']
            )
            created_count += 1
            self.stdout.write(f"Created: {university.name} ({university.short_name})")

        self.stdout.write(self.style.SUCCESS(f"Successfully created {created_count} universities"))
        
        # Show summary
        public_count = University.objects.filter(type='Public').count()
        private_count = University.objects.filter(type='Private').count()
        
        self.stdout.write(f"Total Universities: {University.objects.count()}")
        self.stdout.write(f"Public Universities: {public_count}")
        self.stdout.write(f"Private Universities: {private_count}")
        
        # Show top 10 by ranking
        self.stdout.write(self.style.SUCCESS("\nTop 10 Universities by Ranking:"))
        top_universities = University.objects.all().order_by('ranking')[:10]
        for i, uni in enumerate(top_universities, 1):
            self.stdout.write(f"{i:2d}. {uni.name} ({uni.short_name}) - Rank #{uni.ranking}")
