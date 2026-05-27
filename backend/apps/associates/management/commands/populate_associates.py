from django.core.management.base import BaseCommand
from apps.hubs.models import CareerHub
from apps.associates.models import Associate, AssociatePost


ASSOCIATES_DATA = {
    'Tech Hub': [
        {
            'name': 'Moringa School',
            'associate_type': 'SCHOOL',
            'bio': 'Moringa School is East Africa\'s leading tech bootcamp, offering intensive programs in Software Engineering, Data Science, and Cybersecurity. We\'ve trained 10,000+ developers across Africa.',
            'profile_image': 'https://logo.clearbit.com/moringaschool.com',
            'website': 'https://moringaschool.com',
            'location': 'Nairobi, Kenya',
            'contact_email': 'admissions@moringaschool.com',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'Software Engineering Bootcamp — Applications Open',
                    'body': 'Applications are now open for our next Software Engineering cohort. Learn full-stack development in 6 months and join our network of 10,000+ graduates working at top tech companies across Africa and globally. Scholarships available for qualifying students.',
                    'external_url': 'https://moringaschool.com/courses/software-engineering',
                    'cta_label': 'Apply Now',
                },
            ],
        },
        {
            'name': 'Microsoft Learn Student Ambassadors Kenya',
            'associate_type': 'SOCIETY',
            'bio': 'Microsoft Learn Student Ambassadors (MLSA) is a global program empowering students to learn, connect, and make a difference. The Kenya chapter hosts workshops, hackathons, and certification prep events.',
            'profile_image': 'https://logo.clearbit.com/microsoft.com',
            'website': 'https://studentambassadors.microsoft.com',
            'location': 'Nairobi, Kenya',
            'contact_email': 'mlsa.kenya@microsoft.com',
            'posts': [
                {
                    'post_type': 'EVENT',
                    'title': 'Azure AI Fundamentals Workshop — Free Certification Prep',
                    'body': 'Join us for a free one-day workshop covering Azure AI Fundamentals (AI-900). Get hands-on with Azure Cognitive Services, Machine Learning, and Responsible AI. Participants receive a free exam voucher upon completion.',
                    'external_url': 'https://studentambassadors.microsoft.com/en-US/activities',
                    'cta_label': 'Register Free',
                },
            ],
        },
        {
            'name': 'Andela',
            'associate_type': 'SOCIETY',
            'bio': 'Andela connects companies with vetted, remote software engineers from Africa. We\'ve placed thousands of Kenyan developers at world-class companies including Google, Coursera, and GitHub.',
            'profile_image': 'https://logo.clearbit.com/andela.com',
            'website': 'https://andela.com',
            'location': 'Nairobi, Kenya',
            'contact_email': 'talent@andela.com',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'Join the Andela Talent Network — Remote Jobs for African Developers',
                    'body': 'Andela is actively sourcing mid-to-senior engineers for roles at global tech companies. If you have 2+ years experience in Python, JavaScript, Go, or mobile development, apply to our talent network and get matched with remote opportunities paying in USD.',
                    'external_url': 'https://andela.com/ateam',
                    'cta_label': 'Join Talent Network',
                },
            ],
        },
        {
            'name': 'Google Developer Groups Nairobi',
            'associate_type': 'SOCIETY',
            'bio': 'GDG Nairobi is an official Google Developer Group bringing together developers, designers, and tech enthusiasts. We run DevFests, study jams, and solution challenges throughout the year.',
            'profile_image': 'https://logo.clearbit.com/google.com',
            'website': 'https://gdg.community.dev/gdg-nairobi',
            'location': 'Nairobi, Kenya',
            'contact_email': 'gdgnairobi@gmail.com',
            'posts': [
                {
                    'post_type': 'EVENT',
                    'title': 'DevFest Nairobi 2025 — Kenya\'s Biggest Dev Conference',
                    'body': 'DevFest Nairobi returns! Join 2,000+ developers for a full day of talks on Flutter, Firebase, Google Cloud, and Machine Learning. Featuring speakers from Google, local startups, and the broader tech ecosystem. Free to attend.',
                    'external_url': 'https://gdg.community.dev/gdg-nairobi',
                    'cta_label': 'Get Your Free Ticket',
                },
            ],
        },
        {
            'name': 'iHub Kenya',
            'associate_type': 'SOCIETY',
            'bio': 'iHub is Kenya\'s premier tech innovation hub, established in 2010. We support tech startups, host research, and foster collaboration between developers, designers, and investors across East Africa.',
            'profile_image': 'https://logo.clearbit.com/ihub.co.ke',
            'website': 'https://ihub.co.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@ihub.co.ke',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'iHub Startup Incubation Programme — Apply for Cohort 12',
                    'body': 'iHub is accepting applications for its 6-month startup incubation programme. Selected startups receive mentorship, co-working space, investor access, and a seed grant of up to KES 500,000. Ideal for early-stage tech ventures with a working MVP.',
                    'external_url': 'https://ihub.co.ke/programmes',
                    'cta_label': 'Apply to Incubation',
                },
            ],
        },
        {
            'name': 'Safaricom PLC',
            'associate_type': 'SOCIETY',
            'bio': 'Safaricom is Kenya\'s leading telco and technology company, home to M-Pesa. Our developer platform and Spark Fund support Kenyan innovators building the next generation of digital solutions.',
            'profile_image': 'https://logo.clearbit.com/safaricom.co.ke',
            'website': 'https://developer.safaricom.co.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'developer@safaricom.co.ke',
            'posts': [
                {
                    'post_type': 'RESOURCE',
                    'title': 'M-Pesa Daraja API — Build Payments Into Your App Today',
                    'body': 'The Safaricom Daraja API lets you integrate M-Pesa payments into any web or mobile application. Access our sandbox environment, documentation, and developer community for free. Over 50,000 developers are already building with Daraja.',
                    'external_url': 'https://developer.safaricom.co.ke/daraja-api',
                    'cta_label': 'Explore Daraja API',
                },
            ],
        },
    ],

    'Engineering Hub': [
        {
            'name': 'IEEE Kenya Section',
            'associate_type': 'SOCIETY',
            'bio': 'The IEEE Kenya Section is part of the world\'s largest technical professional organization. We advance technology for humanity through conferences, publications, and student chapter activities across Kenyan universities.',
            'profile_image': 'https://logo.clearbit.com/ieee.org',
            'website': 'https://kenya.ieee.org',
            'location': 'Nairobi, Kenya',
            'contact_email': 'kenya@ieee.org',
            'posts': [
                {
                    'post_type': 'EVENT',
                    'title': 'IEEE Kenya Annual Engineering Conference 2025',
                    'body': 'The IEEE Kenya Section invites engineers and students to our annual conference focusing on Sustainable Engineering, AI in Infrastructure, and Clean Energy. Papers are invited from researchers and practitioners. IEEE student members attend free.',
                    'external_url': 'https://kenya.ieee.org/conferences',
                    'cta_label': 'Submit a Paper',
                },
            ],
        },
        {
            'name': 'Institution of Engineers of Kenya (IEK)',
            'associate_type': 'SOCIETY',
            'bio': 'IEK is the professional body representing engineers in Kenya. We regulate engineering practice, offer CPD programs, and advocate for engineers\' welfare and the advancement of engineering in Kenya.',
            'profile_image': 'https://logo.clearbit.com/iek.or.ke',
            'website': 'https://iek.or.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@iek.or.ke',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'IEK Graduate Engineer Membership — Register Your Engineering Career',
                    'body': 'IEK Graduate Membership is the first step toward becoming a Registered Engineer in Kenya. It gives you access to CPD events, networking, and the path to full membership. Applications are open year-round.',
                    'external_url': 'https://iek.or.ke/membership',
                    'cta_label': 'Become a Member',
                },
            ],
        },
        {
            'name': 'Kenya Power & Lighting Company',
            'associate_type': 'SOCIETY',
            'bio': 'Kenya Power manages the national electricity grid and is one of the largest employers of electrical and mechanical engineers in Kenya. Our graduate trainee programme has launched hundreds of engineering careers.',
            'profile_image': 'https://logo.clearbit.com/kplc.co.ke',
            'website': 'https://kplc.co.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'recruitment@kplc.co.ke',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'Kenya Power Graduate Trainee Programme 2025',
                    'body': 'Kenya Power is recruiting graduate trainees in Electrical, Mechanical, Civil, and ICT Engineering. The 2-year structured programme provides hands-on experience across our national transmission and distribution network. Open to graduates with minimum Upper Second Class Honours.',
                    'external_url': 'https://kplc.co.ke/careers',
                    'cta_label': 'Apply Now',
                },
            ],
        },
        {
            'name': 'Dedan Kimathi University of Technology',
            'associate_type': 'SCHOOL',
            'bio': 'DeKUT is Kenya\'s premier technical university, specialising in engineering, technology, and applied sciences. Our programmes are accredited by the Engineers Board of Kenya (EBK) and internationally recognised.',
            'profile_image': 'https://logo.clearbit.com/dkut.ac.ke',
            'website': 'https://dkut.ac.ke',
            'location': 'Nyeri, Kenya',
            'contact_email': 'admissions@dkut.ac.ke',
            'posts': [
                {
                    'post_type': 'UPDATE',
                    'title': 'DeKUT Opens Applications for September 2025 Engineering Intake',
                    'body': 'Dedan Kimathi University of Technology is now accepting applications for BSc programmes in Mechanical, Electrical, Civil, Mechatronics, and Computer Engineering for the September 2025 intake. Government-sponsored and self-sponsored slots available. Apply through KUCCPS or directly.',
                    'external_url': 'https://dkut.ac.ke/admissions',
                    'cta_label': 'Apply for Admission',
                },
            ],
        },
        {
            'name': 'Engineers Board of Kenya (EBK)',
            'associate_type': 'SOCIETY',
            'bio': 'EBK is the statutory body mandated to regulate engineering practice in Kenya. We register engineers, accredit engineering programmes, and ensure public safety through professional standards.',
            'profile_image': 'https://logo.clearbit.com/ebk.or.ke',
            'website': 'https://ebk.or.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@ebk.or.ke',
            'posts': [
                {
                    'post_type': 'RESOURCE',
                    'title': 'How to Register as a Graduate Engineer in Kenya',
                    'body': 'Every engineering graduate practising in Kenya must be registered with EBK. This guide walks you through the Graduate Engineer Registration process — required documents, fees, CPD requirements, and how to progress to Corporate Membership. Start your registration within 6 months of graduation.',
                    'external_url': 'https://ebk.or.ke/registration',
                    'cta_label': 'Read Registration Guide',
                },
            ],
        },
        {
            'name': 'Strathmore University (Engineering & Technology)',
            'associate_type': 'SCHOOL',
            'bio': 'Strathmore\'s Faculty of Information Technology offers accredited programs in Computer Science, Software Engineering, and IT. Known for producing work-ready graduates and strong industry partnerships.',
            'profile_image': 'https://logo.clearbit.com/strathmore.edu',
            'website': 'https://strathmore.edu/faculty-of-information-technology',
            'location': 'Nairobi, Kenya',
            'contact_email': 'fit@strathmore.edu',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'Strathmore FIT Open Day — Visit Our Campus',
                    'body': 'Discover our BSc and MSc programmes in Computer Science, Software Engineering, and Information Technology. Meet faculty, tour our labs, and learn about our industry partnerships with companies like IBM, Microsoft, and local tech firms. Open to all prospective students.',
                    'external_url': 'https://strathmore.edu/openday',
                    'cta_label': 'Book Your Visit',
                },
            ],
        },
    ],

    'Law Hub': [
        {
            'name': 'Law Society of Kenya (LSK)',
            'associate_type': 'SOCIETY',
            'bio': 'LSK is the professional body representing advocates of the High Court of Kenya. We promote the rule of law, defend human rights, and provide continuing legal education to over 16,000 advocates.',
            'profile_image': 'https://logo.clearbit.com/lsk.or.ke',
            'website': 'https://lsk.or.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@lsk.or.ke',
            'posts': [
                {
                    'post_type': 'EVENT',
                    'title': 'LSK Annual Law Conference — "Law, Technology and the Future of Justice"',
                    'body': 'The Law Society of Kenya Annual Conference brings together judges, senior advocates, academics, and law students to discuss the intersection of law and technology. Topics include digital evidence, AI in legal practice, and cybersecurity law. CLE points awarded to advocates.',
                    'external_url': 'https://lsk.or.ke/events',
                    'cta_label': 'Register to Attend',
                },
            ],
        },
        {
            'name': 'Kenya School of Law',
            'associate_type': 'SCHOOL',
            'bio': 'Kenya School of Law (KSL) is the state institution responsible for post-graduate legal education and training. The Advocates Training Programme (ATP) is the mandatory qualification route for all law graduates seeking admission to the bar.',
            'profile_image': 'https://logo.clearbit.com/ksl.ac.ke',
            'website': 'https://ksl.ac.ke',
            'location': 'Karen, Nairobi, Kenya',
            'contact_email': 'info@ksl.ac.ke',
            'posts': [
                {
                    'post_type': 'UPDATE',
                    'title': 'Advocates Training Programme (ATP) — 2025 Intake Applications',
                    'body': 'Kenya School of Law is accepting applications for the Advocates Training Programme (ATP) 2025 intake. The ATP is the mandatory route to admission as an advocate of the High Court. Applicants must hold an approved LLB degree. Apply through the KSL portal before the deadline.',
                    'external_url': 'https://ksl.ac.ke/atp',
                    'cta_label': 'Apply for ATP',
                },
            ],
        },
        {
            'name': 'Strathmore Law School',
            'associate_type': 'SCHOOL',
            'bio': 'Strathmore Law School is consistently ranked among the top law schools in Kenya and Africa. Our LLB programme emphasises practical legal skills, ethics, and access to justice. Home to the @iLabAfrica Centre for legal tech innovation.',
            'profile_image': 'https://logo.clearbit.com/law.strathmore.edu',
            'website': 'https://law.strathmore.edu',
            'location': 'Nairobi, Kenya',
            'contact_email': 'law@strathmore.edu',
            'posts': [
                {
                    'post_type': 'RESOURCE',
                    'title': 'Free Legal Tech Masterclass Series — Registrations Open',
                    'body': 'Strathmore Law School\'s @iLabAfrica is offering a free 5-part masterclass series on Legal Technology covering AI Contract Review, Legal Research Tools, Court e-Filing, and Legaltech Entrepreneurship. Open to law students and young advocates across Kenya.',
                    'external_url': 'https://law.strathmore.edu/legaltech',
                    'cta_label': 'Register Free',
                },
            ],
        },
        {
            'name': 'International Commission of Jurists — Kenya',
            'associate_type': 'SOCIETY',
            'bio': 'ICJ Kenya works to strengthen constitutional governance, rule of law, and human rights protection. We conduct legal training, strategic litigation support, and policy advocacy on key constitutional and human rights issues.',
            'profile_image': 'https://logo.clearbit.com/icj.org',
            'website': 'https://icj-kenya.org',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@icj-kenya.org',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'ICJ Kenya Legal Internship Programme 2025',
                    'body': 'ICJ Kenya offers competitive legal internships for LLB students and recent graduates. Interns assist with human rights litigation, constitutional law research, and policy briefs. Placements run for 3 months and are based in Nairobi. Applications considered on a rolling basis.',
                    'external_url': 'https://icj-kenya.org/internships',
                    'cta_label': 'Apply for Internship',
                },
            ],
        },
        {
            'name': 'Kenya Law (National Council for Law Reporting)',
            'associate_type': 'SOCIETY',
            'bio': 'Kenya Law is the official legal information resource of Kenya. We publish the Kenya Law Reports, the Kenya Gazette, and all Acts of Parliament. Our free online database is an essential tool for every law student and practitioner.',
            'profile_image': 'https://logo.clearbit.com/kenyalaw.org',
            'website': 'https://kenyalaw.org',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@kenyalaw.org',
            'posts': [
                {
                    'post_type': 'RESOURCE',
                    'title': 'Kenya Law Free Legal Database — How to Research Like a Pro',
                    'body': 'Kenya Law provides free access to all judgements, legislation, and legal notices from Kenyan courts and government. This guide shows you how to use advanced search features, set up case alerts, and download legislation in PDF format. An indispensable tool for moot court, assignments, and practice.',
                    'external_url': 'https://kenyalaw.org/kl/index.php',
                    'cta_label': 'Access Free Legal Database',
                },
            ],
        },
        {
            'name': 'Amnesty International Kenya',
            'associate_type': 'SOCIETY',
            'bio': 'Amnesty International Kenya campaigns for human rights, justice, and dignity. We engage law students through our Know Your Rights programme and provide opportunities to contribute to global and local human rights advocacy.',
            'profile_image': 'https://logo.clearbit.com/amnesty.org',
            'website': 'https://amnesty.or.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'admin@amnesty.or.ke',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'Join Amnesty Kenya\'s Student Human Rights Network',
                    'body': 'Amnesty Kenya is recruiting law and social science students to our Student Human Rights Network. Members participate in campaigns, capacity-building workshops, and community outreach. This is an excellent opportunity to build your human rights advocacy credentials.',
                    'external_url': 'https://amnesty.or.ke/get-involved',
                    'cta_label': 'Join the Network',
                },
            ],
        },
    ],

    'Health Hub': [
        {
            'name': 'Kenya Medical Association (KMA)',
            'associate_type': 'SOCIETY',
            'bio': 'KMA is the professional body representing doctors in Kenya. We advance the medical profession, promote public health, and provide continuing medical education (CME) to doctors across the country.',
            'profile_image': 'https://logo.clearbit.com/kma.or.ke',
            'website': 'https://kma.or.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@kma.or.ke',
            'posts': [
                {
                    'post_type': 'EVENT',
                    'title': 'KMA Annual Scientific Conference — CME Points Available',
                    'body': 'The Kenya Medical Association Annual Scientific Conference brings together medical practitioners from all disciplines. This year\'s theme: "Universal Health Coverage — Kenya\'s Progress and Challenges." CME points are awarded to registered attendees. Medical students welcome at discounted rates.',
                    'external_url': 'https://kma.or.ke/events',
                    'cta_label': 'Register for Conference',
                },
            ],
        },
        {
            'name': 'Aga Khan University Hospital Nairobi',
            'associate_type': 'SCHOOL',
            'bio': 'Aga Khan University Hospital is one of East Africa\'s premier academic medical centres. AKU trains doctors, nurses, and allied health professionals through its Faculty of Health Sciences and offers internationally accredited postgraduate programmes.',
            'profile_image': 'https://logo.clearbit.com/aku.edu',
            'website': 'https://hospitals.aku.edu/nairobi',
            'location': 'Nairobi, Kenya',
            'contact_email': 'admissions.nairobi@aku.edu',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'AKU Postgraduate Medical Training Programmes 2025',
                    'body': 'Aga Khan University offers postgraduate medical and nursing programmes including MMed, MSc Nursing, and Postgraduate Diplomas in Clinical Disciplines. AKU programmes are internationally recognised and affiliated with partner institutions in the UK and Canada.',
                    'external_url': 'https://hospitals.aku.edu/nairobi/pages/academic-programmes.aspx',
                    'cta_label': 'Explore Programmes',
                },
            ],
        },
        {
            'name': 'AMREF Health Africa',
            'associate_type': 'SOCIETY',
            'bio': 'AMREF Health Africa is the continent\'s leading health development NGO, headquartered in Nairobi. We train health workers, deliver community health programmes, and advocate for equitable healthcare across sub-Saharan Africa.',
            'profile_image': 'https://logo.clearbit.com/amref.org',
            'website': 'https://amref.org',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@amrefafrica.org',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'AMREF Health Africa Internship & Volunteer Opportunities 2025',
                    'body': 'AMREF Health Africa offers structured internships for medical, nursing, public health, and development studies students across our Kenya programmes. Placements cover community health, maternal & child health, HIV/AIDS, and health systems strengthening.',
                    'external_url': 'https://amref.org/careers',
                    'cta_label': 'View Opportunities',
                },
            ],
        },
        {
            'name': 'Kenya Red Cross Society',
            'associate_type': 'SOCIETY',
            'bio': 'Kenya Red Cross Society provides emergency response, health services, and disaster relief across Kenya. We engage thousands of volunteers and offer first aid training, blood donation programmes, and community health outreach.',
            'profile_image': 'https://logo.clearbit.com/redcross.or.ke',
            'website': 'https://redcross.or.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@redcross.or.ke',
            'posts': [
                {
                    'post_type': 'EVENT',
                    'title': 'Certified First Aid Training — Open to the Public',
                    'body': 'Kenya Red Cross is offering certified First Aid & CPR training sessions at branches nationwide. The one-day course covers emergency response, wound management, choking, and basic life support. Certificates are internationally recognised. Ideal for health students and community volunteers.',
                    'external_url': 'https://redcross.or.ke/first-aid-training',
                    'cta_label': 'Book a Training Slot',
                },
            ],
        },
        {
            'name': 'Kenyatta National Hospital',
            'associate_type': 'SOCIETY',
            'bio': 'Kenyatta National Hospital (KNH) is Kenya\'s largest public referral and teaching hospital, affiliated with the University of Nairobi School of Medicine. KNH serves over 1 million patients annually and trains thousands of medical professionals.',
            'profile_image': 'https://logo.clearbit.com/knh.or.ke',
            'website': 'https://knh.or.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@knh.or.ke',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'KNH Clinical Attachment Programme for Medical Students',
                    'body': 'Kenyatta National Hospital offers clinical attachment placements for undergraduate medical and nursing students. Attachments are available in internal medicine, surgery, paediatrics, obstetrics, and other specialties. Apply through your university or directly via the KNH clinical training office.',
                    'external_url': 'https://knh.or.ke/clinical-training',
                    'cta_label': 'Apply for Attachment',
                },
            ],
        },
        {
            'name': 'KMPDU — Kenya Medical Practitioners & Dentists Union',
            'associate_type': 'SOCIETY',
            'bio': 'KMPDU is the trade union and professional welfare body for doctors and dentists in Kenya. We advocate for fair working conditions, offer legal support to members, and engage government on healthcare policy.',
            'profile_image': 'https://logo.clearbit.com/kmpdu.org',
            'website': 'https://kmpdu.org',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@kmpdu.org',
            'posts': [
                {
                    'post_type': 'RESOURCE',
                    'title': 'Know Your Rights as a Medical Intern in Kenya',
                    'body': 'Medical interns often face exploitative conditions without knowing their legal rights. KMPDU has published a comprehensive guide covering intern allowances, working hours, leave entitlements, and grievance procedures under Kenyan labour law. Every medical graduate should read this before starting internship.',
                    'external_url': 'https://kmpdu.org/resources',
                    'cta_label': 'Read the Guide',
                },
            ],
        },
    ],

    'Business Hub': [
        {
            'name': 'Strathmore Business School (SBS)',
            'associate_type': 'SCHOOL',
            'bio': 'Strathmore Business School is one of Africa\'s top-ranked business schools, offering MBA, Executive Education, and undergraduate business programmes. SBS is AACSB-accredited and has strong ties with business leaders across East Africa.',
            'profile_image': 'https://logo.clearbit.com/strathmore.edu',
            'website': 'https://sbs.strathmore.edu',
            'location': 'Nairobi, Kenya',
            'contact_email': 'sbs@strathmore.edu',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'SBS MBA Programme 2025 — Applications Now Open',
                    'body': 'The Strathmore Business School MBA is a transformative 18-month programme designed for mid-career professionals. Specialisations available in Finance, Entrepreneurship, and Strategy. Partial scholarships available for high-performing applicants. GMAT/GRE waivers considered.',
                    'external_url': 'https://sbs.strathmore.edu/mba',
                    'cta_label': 'Apply for MBA',
                },
            ],
        },
        {
            'name': 'Kenya Private Sector Alliance (KEPSA)',
            'associate_type': 'SOCIETY',
            'bio': 'KEPSA is the apex body of the Kenyan private sector, representing over 200 business associations and 750,000 businesses. We engage government on policy, promote business growth, and connect young entrepreneurs with mentors and markets.',
            'profile_image': 'https://logo.clearbit.com/kepsa.or.ke',
            'website': 'https://kepsa.or.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@kepsa.or.ke',
            'posts': [
                {
                    'post_type': 'EVENT',
                    'title': 'KEPSA Business Summit 2025 — "Building Competitive Kenyan Businesses"',
                    'body': 'The KEPSA Business Summit convenes Kenya\'s top CEOs, government officials, and investors to discuss private sector growth, policy reform, and investment opportunities. Young entrepreneurs are invited to pitch at the Innovation Pavilion. Networking dinner included.',
                    'external_url': 'https://kepsa.or.ke/events',
                    'cta_label': 'Register for Summit',
                },
            ],
        },
        {
            'name': 'Nairobi Securities Exchange (NSE)',
            'associate_type': 'SOCIETY',
            'bio': 'The Nairobi Securities Exchange is East Africa\'s premier stock exchange, listing over 60 companies. NSE provides investment education to students and young professionals through the NSE Academy and investor education programmes.',
            'profile_image': 'https://logo.clearbit.com/nse.co.ke',
            'website': 'https://nse.co.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@nse.co.ke',
            'posts': [
                {
                    'post_type': 'RESOURCE',
                    'title': 'NSE Investment Education Programme — Learn to Invest in Stocks',
                    'body': 'The NSE Academy offers free and paid investment education courses covering stock market fundamentals, how to open a CDS account, reading financial statements, and portfolio management. Ideal for business students looking to understand capital markets in Kenya.',
                    'external_url': 'https://nse.co.ke/nse-academy',
                    'cta_label': 'Start Learning',
                },
            ],
        },
        {
            'name': 'Equity Bank Kenya',
            'associate_type': 'SOCIETY',
            'bio': 'Equity Bank is East and Central Africa\'s largest bank by customer base, serving over 15 million customers. Our Equity Leaders Programme (ELP) and Wings to Fly scholarship have transformed thousands of young Kenyans.',
            'profile_image': 'https://logo.clearbit.com/equitybankgroup.com',
            'website': 'https://equitybankgroup.com',
            'location': 'Nairobi, Kenya',
            'contact_email': 'equitybank@equitybank.co.ke',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'Equity Bank Graduate Trainee Programme 2025',
                    'body': 'Equity Bank is recruiting graduates for our Graduate Trainee Programme across Finance, IT, Risk Management, and Customer Experience. The 12-month programme combines classroom training with rotational job attachments. Open to graduates with minimum Second Class Upper Honours.',
                    'external_url': 'https://equitybankgroup.com/careers',
                    'cta_label': 'Apply Now',
                },
            ],
        },
        {
            'name': 'Kenya National Chamber of Commerce & Industry',
            'associate_type': 'SOCIETY',
            'bio': 'KNCCI is Kenya\'s oldest and largest business membership organisation, representing businesses from all sectors and counties. We facilitate trade, business registration support, and market access for Kenyan enterprises.',
            'profile_image': 'https://logo.clearbit.com/kenyachamber.or.ke',
            'website': 'https://kenyachamber.or.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@kenyachamber.or.ke',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'KNCCI SME Trade Expo — Showcase Your Business to 500+ Buyers',
                    'body': 'The Kenya National Chamber of Commerce is hosting the annual SME Trade Expo, connecting 500+ local businesses with buyers, distributors, and investors. Exhibition booths available for student entrepreneurs and early-stage startups at subsidised rates.',
                    'external_url': 'https://kenyachamber.or.ke/expo',
                    'cta_label': 'Book an Exhibition Booth',
                },
            ],
        },
        {
            'name': 'Young Entrepreneurs Association Kenya (YEA)',
            'associate_type': 'SOCIETY',
            'bio': 'YEA Kenya is the leading network for young business owners and entrepreneurs aged 18-35. We provide mentorship, access to finance, business development training, and peer networking to the next generation of Kenyan business leaders.',
            'profile_image': 'https://logo.clearbit.com/yea.co.ke',
            'website': 'https://yea.co.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@yea.co.ke',
            'posts': [
                {
                    'post_type': 'EVENT',
                    'title': 'YEA Pitch Night — Win KES 500K in Startup Funding',
                    'body': 'Young Entrepreneurs Association Kenya is hosting its flagship Pitch Night where 10 selected startups present to a panel of investors and seasoned entrepreneurs. The winner receives KES 500,000 in seed funding plus 6 months of mentorship. Applications open to YEA members.',
                    'external_url': 'https://yea.co.ke/pitch-night',
                    'cta_label': 'Apply to Pitch',
                },
            ],
        },
    ],

    'Agriculture Hub': [
        {
            'name': 'KALRO — Kenya Agricultural & Livestock Research Organisation',
            'associate_type': 'SOCIETY',
            'bio': 'KALRO is Kenya\'s national agricultural research institution, driving innovation in crop science, livestock, fisheries, and agribusiness. We transfer technology to farmers and offer internships for agriculture students.',
            'profile_image': 'https://logo.clearbit.com/kalro.org',
            'website': 'https://kalro.org',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@kalro.org',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'KALRO Student Research Internship Programme 2025',
                    'body': 'KALRO offers 3-month research internships for agriculture, veterinary, and food science students at our centres across Kenya. Interns participate in ongoing research, data collection, and field trials. Applications open to students in their 3rd year or final year of study.',
                    'external_url': 'https://kalro.org/internships',
                    'cta_label': 'Apply for Internship',
                },
            ],
        },
        {
            'name': 'Farm Africa',
            'associate_type': 'SOCIETY',
            'bio': 'Farm Africa is an international NGO working with farmers and agribusinesses across East Africa to increase agricultural productivity and market access. We run programmes in agroforestry, horticulture, and dryland farming.',
            'profile_image': 'https://logo.clearbit.com/farmafrica.org',
            'website': 'https://farmafrica.org',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@farmafrica.org',
            'posts': [
                {
                    'post_type': 'RESOURCE',
                    'title': 'Practical Agroforestry Guide for Kenyan Smallholders',
                    'body': 'Farm Africa has published a free practical guide on integrating trees into smallholder farms in Kenya. The guide covers species selection, planting techniques, and income generation from timber, fruits, and fodder. Available for free download.',
                    'external_url': 'https://farmafrica.org/resources',
                    'cta_label': 'Download Free Guide',
                },
            ],
        },
        {
            'name': 'Kenya National Farmers Federation (KENAFF)',
            'associate_type': 'SOCIETY',
            'bio': 'KENAFF is the apex farmer organisation in Kenya, representing over 3 million smallholder farmers. We advocate for farmer-friendly policies, provide agronomic training, and facilitate market linkages for Kenyan farmers.',
            'profile_image': 'https://logo.clearbit.com/kenaff.org',
            'website': 'https://kenaff.org',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@kenaff.org',
            'posts': [
                {
                    'post_type': 'EVENT',
                    'title': 'KENAFF National Farmers Conference 2025',
                    'body': 'KENAFF\'s annual conference gathers farmers, agribusinesses, and policy makers from all 47 counties. This year\'s focus: "Climate-Smart Agriculture and Youth in Farming." Young farmers aged 18-30 are invited to share their innovations at the Youth Agripreneur showcase.',
                    'external_url': 'https://kenaff.org/conference',
                    'cta_label': 'Register to Attend',
                },
            ],
        },
        {
            'name': 'One Acre Fund Kenya',
            'associate_type': 'SOCIETY',
            'bio': 'One Acre Fund serves smallholder farmers in Kenya with farm inputs on credit, training, and market access. We work with 800,000+ farmers and are one of the largest employers of agriculture graduates in rural Kenya.',
            'profile_image': 'https://logo.clearbit.com/oneacrefund.org',
            'website': 'https://oneacrefund.org/kenya',
            'location': 'Kakamega, Kenya',
            'contact_email': 'kenya@oneacrefund.org',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'One Acre Fund — Field Officer & Agricultural Trainee Roles 2025',
                    'body': 'One Acre Fund is hiring Field Officers and Agricultural Trainees across Western Kenya and the Rift Valley. Roles involve farmer training, input distribution, loan management, and data collection. Open to diploma and degree holders in Agriculture, Agronomy, or related fields.',
                    'external_url': 'https://oneacrefund.org/careers',
                    'cta_label': 'View Open Roles',
                },
            ],
        },
        {
            'name': 'Kenya Seed Company',
            'associate_type': 'SOCIETY',
            'bio': 'Kenya Seed Company is East Africa\'s leading seed producer, supplying certified seeds of maize, wheat, beans, vegetables, and other crops to millions of farmers. We offer graduate traineeships and research attachments.',
            'profile_image': 'https://logo.clearbit.com/kenyaseed.com',
            'website': 'https://kenyaseed.com',
            'location': 'Kitale, Kenya',
            'contact_email': 'info@kenyaseed.com',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'Kenya Seed Company Graduate Trainee Programme',
                    'body': 'Kenya Seed Company is recruiting graduates in Plant Breeding, Agronomy, Agricultural Engineering, and Business for our annual graduate trainee intake. Trainees rotate across seed production, quality control, and commercial divisions over 12 months.',
                    'external_url': 'https://kenyaseed.com/careers',
                    'cta_label': 'Apply Now',
                },
            ],
        },
        {
            'name': 'FAO Kenya — Food & Agriculture Organization',
            'associate_type': 'SOCIETY',
            'bio': 'The UN Food and Agriculture Organization\'s Kenya office works with government to improve food security, sustainable agriculture, and rural development. FAO Kenya offers consultancy roles and partnerships for young agriculture professionals.',
            'profile_image': 'https://logo.clearbit.com/fao.org',
            'website': 'https://fao.org/kenya',
            'location': 'Nairobi, Kenya',
            'contact_email': 'fao-ke@fao.org',
            'posts': [
                {
                    'post_type': 'RESOURCE',
                    'title': 'FAO Kenya — Free Online Agriculture & Food Security Courses',
                    'body': 'FAO offers a library of free e-learning courses on food security, agronomy, climate adaptation, and food systems through the FAO elearning Academy. Certificates are issued on completion. Available in English and Swahili. Ideal for agriculture students and practitioners.',
                    'external_url': 'https://elearning.fao.org',
                    'cta_label': 'Access Free Courses',
                },
            ],
        },
    ],

    'Education Hub': [
        {
            'name': 'Kenya Institute of Curriculum Development (KICD)',
            'associate_type': 'SOCIETY',
            'bio': 'KICD develops, reviews, and approves education curricula for all levels of learning in Kenya, including the CBC. We support teachers with curriculum materials, conduct research, and provide teacher training resources.',
            'profile_image': 'https://logo.clearbit.com/kicd.ac.ke',
            'website': 'https://kicd.ac.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@kicd.ac.ke',
            'posts': [
                {
                    'post_type': 'RESOURCE',
                    'title': 'CBC Digital Resources — Free Teaching & Learning Materials',
                    'body': 'KICD has published a comprehensive library of CBC-aligned digital teaching and learning materials for primary, junior secondary, and senior secondary. Resources include lesson plans, activity books, and assessment tools. Free to all teachers and students via the KICD portal.',
                    'external_url': 'https://kicd.ac.ke/digital-resources',
                    'cta_label': 'Access Free Resources',
                },
            ],
        },
        {
            'name': 'British Council Kenya',
            'associate_type': 'SOCIETY',
            'bio': 'British Council Kenya creates international cultural relations through education, arts, and the English language. We offer English teaching, UK university application support, scholarships information, and professional development for educators.',
            'profile_image': 'https://logo.clearbit.com/britishcouncil.org',
            'website': 'https://britishcouncil.or.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'kenya.enquiries@britishcouncil.org',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'UK Scholarships Fair — Meet Representatives from 50+ UK Universities',
                    'body': 'British Council Kenya is hosting the annual UK Scholarships and Universities Fair in Nairobi. Meet representatives from Oxford, Cambridge, UCL, LSE, and 50+ other UK institutions. Get information on IELTS requirements, scholarship opportunities including Chevening, and visa processes. Free to attend.',
                    'external_url': 'https://www.britishcouncil.or.ke/study-uk',
                    'cta_label': 'Register Free',
                },
            ],
        },
        {
            'name': 'Teach For Kenya',
            'associate_type': 'SOCIETY',
            'bio': 'Teach For Kenya places talented graduates in under-resourced schools as teachers and leaders for two years. Our Fellows develop into lifelong advocates for educational equity, building Kenya\'s next generation of education leaders.',
            'profile_image': 'https://logo.clearbit.com/teachforkenya.org',
            'website': 'https://teachforkenya.org',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@teachforkenya.org',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'Teach For Kenya 2025 Fellowship — Applications Open',
                    'body': 'Are you a recent graduate with a passion for education and social change? Apply for the Teach For Kenya Fellowship — a 2-year fully supported placement teaching in an under-resourced school. Fellows receive a monthly stipend, teacher training, and leadership development. All degree disciplines welcome.',
                    'external_url': 'https://teachforkenya.org/apply',
                    'cta_label': 'Apply for Fellowship',
                },
            ],
        },
        {
            'name': 'Kenya National Examinations Council (KNEC)',
            'associate_type': 'SOCIETY',
            'bio': 'KNEC is the government body mandated to conduct national examinations in Kenya, including KCPE, KCSE, and TVET certifications. We also provide qualification verification services for employers and institutions.',
            'profile_image': 'https://logo.clearbit.com/knec.ac.ke',
            'website': 'https://knec.ac.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@knec.ac.ke',
            'posts': [
                {
                    'post_type': 'RESOURCE',
                    'title': 'KCSE Past Papers Portal — Free Access to 15 Years of Papers',
                    'body': 'KNEC\'s online portal provides free access to 15 years of KCSE past papers and marking schemes across all subjects. Essential for Form 4 revision and teacher preparation. Results slip verification and certificate authentication services also available online.',
                    'external_url': 'https://knec.ac.ke/past-papers',
                    'cta_label': 'Access Past Papers',
                },
            ],
        },
        {
            'name': 'UNICEF Kenya — Education Section',
            'associate_type': 'SOCIETY',
            'bio': 'UNICEF Kenya\'s Education section works with government and partners to ensure every child has access to quality education. We support CBC implementation, school feeding programmes, and learning recovery initiatives.',
            'profile_image': 'https://logo.clearbit.com/unicef.org',
            'website': 'https://unicef.org/kenya/education',
            'location': 'Nairobi, Kenya',
            'contact_email': 'nairobieducation@unicef.org',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'UNICEF Kenya Education Volunteer & JPO Opportunities',
                    'body': 'UNICEF Kenya regularly recruits Junior Professional Officers (JPOs) and national volunteers in the Education, Child Protection, and Social Policy sections. Opportunities exist for recent graduates and young professionals with education, social science, or development backgrounds.',
                    'external_url': 'https://www.unicef.org/careers/internships-and-junior-professional-officers',
                    'cta_label': 'Explore Opportunities',
                },
            ],
        },
        {
            'name': 'Strathmore University',
            'associate_type': 'SCHOOL',
            'bio': 'Strathmore University is one of Kenya\'s leading private universities offering programmes across business, law, engineering, IT, and humanities. Known for strong values formation, industry linkages, and a vibrant campus community.',
            'profile_image': 'https://logo.clearbit.com/strathmore.edu',
            'website': 'https://strathmore.edu',
            'location': 'Nairobi, Kenya',
            'contact_email': 'admissions@strathmore.edu',
            'posts': [
                {
                    'post_type': 'UPDATE',
                    'title': 'Strathmore University September 2025 Admissions — Applications Open',
                    'body': 'Strathmore University is now accepting applications for September 2025 undergraduate and postgraduate programmes. Programmes available in Business, Law, IT, Engineering, and Humanities. Apply online through the Strathmore admissions portal. Scholarships and bursaries available.',
                    'external_url': 'https://strathmore.edu/admissions',
                    'cta_label': 'Apply for Admission',
                },
            ],
        },
    ],

    'Creative Hub': [
        {
            'name': 'Kenya Film Commission',
            'associate_type': 'SOCIETY',
            'bio': 'Kenya Film Commission promotes Kenya as a world-class filming destination and develops the local film and creative industries. We offer location permits, co-production support, and funding for Kenyan filmmakers.',
            'profile_image': 'https://logo.clearbit.com/filmingkenya.com',
            'website': 'https://filmingkenya.com',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@filmingkenya.com',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'Kenya Film Commission Content Fund — Apply for Production Grants',
                    'body': 'The Kenya Film Commission Content Fund supports Kenyan filmmakers with grants of up to KES 2,000,000 for feature films, documentaries, and TV series. Applications are open to Kenyan citizens with a completed script and production plan. Deadline: rolling applications.',
                    'external_url': 'https://filmingkenya.com/funding',
                    'cta_label': 'Apply for Grant',
                },
            ],
        },
        {
            'name': 'GoDown Arts Centre',
            'associate_type': 'SOCIETY',
            'bio': 'GoDown Arts Centre is Nairobi\'s leading multidisciplinary arts venue, hosting exhibitions, performances, residencies, and creative industry development programmes. We support emerging artists across visual arts, music, dance, and theatre.',
            'profile_image': 'https://logo.clearbit.com/thegodownartscentre.com',
            'website': 'https://thegodownartscentre.com',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@thegodownartscentre.com',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'GoDown Arts Centre — Artist-in-Residence Programme 2025',
                    'body': 'GoDown Arts Centre is accepting applications for its 3-month Artist-in-Residence programme. Selected artists receive studio space, a monthly stipend, mentorship, and a public showcase at the end of the residency. Open to visual artists, performers, and interdisciplinary creatives from Kenya and East Africa.',
                    'external_url': 'https://thegodownartscentre.com/residency',
                    'cta_label': 'Apply for Residency',
                },
            ],
        },
        {
            'name': 'Creatives Garage Kenya',
            'associate_type': 'SOCIETY',
            'bio': 'Creatives Garage is a creative business incubator in Nairobi supporting fashion designers, illustrators, photographers, and digital creatives to build sustainable businesses. We run bootcamps, markets, and a creative co-working space.',
            'profile_image': 'https://logo.clearbit.com/creativesgarage.org',
            'website': 'https://creativesgarage.org',
            'location': 'Nairobi, Kenya',
            'contact_email': 'hello@creativesgarage.org',
            'posts': [
                {
                    'post_type': 'EVENT',
                    'title': 'Creatives Garage Market Day — Sell Your Work to 2,000+ Visitors',
                    'body': 'Creatives Garage\'s monthly market day is Nairobi\'s favourite pop-up for independent creatives. Tables available for artists, illustrators, photographers, jewellery makers, and fashion designers. Book early — spaces fill up fast. Open to both established and emerging creatives.',
                    'external_url': 'https://creativesgarage.org/market',
                    'cta_label': 'Book a Table',
                },
            ],
        },
        {
            'name': 'Kenya Cultural Centre (National Theatre)',
            'associate_type': 'SOCIETY',
            'bio': 'The Kenya Cultural Centre and National Theatre is the home of performing arts in Kenya. We host theatre productions, comedy shows, dance performances, and provide rehearsal and performance space for artists across East Africa.',
            'profile_image': 'https://logo.clearbit.com/kenyaculturalcentre.go.ke',
            'website': 'https://kenyaculturalcentre.go.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@kenyaculturalcentre.go.ke',
            'posts': [
                {
                    'post_type': 'EVENT',
                    'title': 'Kenya National Theatre Open Auditions — Drama & Musical',
                    'body': 'The Kenya National Theatre is holding open auditions for its upcoming season productions including a full musical and a contemporary drama. Open to all ages and experience levels. Callbacks held one week after auditions. Come ready with a 2-minute monologue or prepared song.',
                    'external_url': 'https://kenyaculturalcentre.go.ke/auditions',
                    'cta_label': 'Sign Up to Audition',
                },
            ],
        },
        {
            'name': 'Nairobi Design Week',
            'associate_type': 'SOCIETY',
            'bio': 'Nairobi Design Week is East Africa\'s largest design festival, celebrating architecture, product design, fashion, graphic design, and urban innovation. Our annual festival draws 20,000+ visitors and showcases over 100 creatives.',
            'profile_image': 'https://logo.clearbit.com/nairobidesignweek.co.ke',
            'website': 'https://nairobidesignweek.co.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@nairobidesignweek.co.ke',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'Nairobi Design Week 2025 — Call for Design Submissions',
                    'body': 'Nairobi Design Week is calling for submissions from designers, architects, and creative students. Selected works will be exhibited at the NDW 2025 festival attended by 20,000+ visitors, buyers, and media. Categories include industrial design, fashion, architecture, and digital art. Submission is free.',
                    'external_url': 'https://nairobidesignweek.co.ke/submissions',
                    'cta_label': 'Submit Your Work',
                },
            ],
        },
        {
            'name': 'Kenya Writers Guild',
            'associate_type': 'SOCIETY',
            'bio': 'Kenya Writers Guild is the professional association for Kenyan writers in all genres. We advocate for writers\' rights, run the annual Jalada Africa festival, and offer writing workshops, mentorship, and publishing guidance.',
            'profile_image': 'https://logo.clearbit.com/kenyawritersguild.org',
            'website': 'https://kenyawritersguild.org',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@kenyawritersguild.org',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'Kenya Writers Guild Short Story Prize 2025 — Win KES 100,000',
                    'body': 'Kenya Writers Guild is accepting submissions for the 2025 Short Story Prize. The winning story receives KES 100,000 and publication in the Jalada Africa anthology. Open to Kenyan citizens and residents. Stories must be original, unpublished, 2,000–5,000 words, in English or Kiswahili.',
                    'external_url': 'https://kenyawritersguild.org/prize',
                    'cta_label': 'Submit Your Story',
                },
            ],
        },
    ],

    'Hospitality Hub': [
        {
            'name': 'Kenya Utalii College',
            'associate_type': 'SCHOOL',
            'bio': 'Kenya Utalii College is Africa\'s premier hospitality and tourism training institution, established in 1975. Our programmes in Hotel Management, Culinary Arts, Travel & Tourism, and Tour Guiding are recognised across the continent.',
            'profile_image': 'https://logo.clearbit.com/utalii.ac.ke',
            'website': 'https://utalii.ac.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'admissions@utalii.ac.ke',
            'posts': [
                {
                    'post_type': 'UPDATE',
                    'title': 'Kenya Utalii College 2025 Intake — Applications Now Open',
                    'body': 'Kenya Utalii College is accepting applications for Certificate, Diploma, and Degree programmes in Hotel Management, Culinary Arts, Food & Beverage Management, and Tour Guiding. Government-sponsored slots available through KUCCPS. Self-sponsored applications directly to the college.',
                    'external_url': 'https://utalii.ac.ke/admissions',
                    'cta_label': 'Apply for Admission',
                },
            ],
        },
        {
            'name': 'Kenya Tourism Board (KTB)',
            'associate_type': 'SOCIETY',
            'bio': 'Kenya Tourism Board markets Kenya as a world-class tourism destination and supports the growth of the hospitality sector. KTB provides training, certification, and industry linkages for tourism and hospitality professionals.',
            'profile_image': 'https://logo.clearbit.com/magicalkenya.com',
            'website': 'https://magicalkenya.com',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@magicalkenya.com',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'KTB Tourism Ambassador Programme — Join the Team',
                    'body': 'Kenya Tourism Board is recruiting youth tourism ambassadors to promote Kenya\'s destinations on social media and at international travel fairs. Selected ambassadors receive travel, accommodation, and a monthly stipend. Open to hospitality students and young tourism professionals with strong social media presence.',
                    'external_url': 'https://magicalkenya.com/ambassador',
                    'cta_label': 'Apply to Be an Ambassador',
                },
            ],
        },
        {
            'name': 'Kenya Association of Hotel Keepers & Caterers (KAHC)',
            'associate_type': 'SOCIETY',
            'bio': 'KAHC is the trade association representing hotels, restaurants, and caterers in Kenya. We advocate for the industry, set service standards, and connect hospitality students with member hotels for attachment and employment.',
            'profile_image': 'https://logo.clearbit.com/kahc.or.ke',
            'website': 'https://kahc.or.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@kahc.or.ke',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'KAHC Industrial Attachment Placement Programme',
                    'body': 'KAHC facilitates industrial attachment placements for hospitality students at member hotels and restaurants across Kenya. Participating hotels include Serena, Sarova, Fairmont, and 200+ others. Apply through KAHC for a placement that matches your specialisation — F&B, Rooms, Front Office, or Kitchen.',
                    'external_url': 'https://kahc.or.ke/attachments',
                    'cta_label': 'Apply for Attachment',
                },
            ],
        },
        {
            'name': 'Serena Hotels Kenya',
            'associate_type': 'SOCIETY',
            'bio': 'Serena Hotels is one of East Africa\'s most prestigious hotel groups, operating luxury properties across Kenya including Nairobi Serena, Mara Serena, and Amboseli Serena. We are known for our exceptional graduate trainee and hospitality apprenticeship programmes.',
            'profile_image': 'https://logo.clearbit.com/serenahotels.com',
            'website': 'https://serenahotels.com',
            'location': 'Nairobi, Kenya',
            'contact_email': 'careers.kenya@serenahotels.com',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'Serena Hotels Hospitality Graduate Trainee Programme 2025',
                    'body': 'Serena Hotels is recruiting graduate trainees for a 12-month rotational programme across Food & Beverage, Front Office, Housekeeping, and Finance. Successful trainees are considered for permanent roles across our Kenya and East Africa properties. Apply with your CV and a cover letter.',
                    'external_url': 'https://serenahotels.com/careers',
                    'cta_label': 'Apply Now',
                },
            ],
        },
        {
            'name': 'Sarova Hotels & Resorts',
            'associate_type': 'SOCIETY',
            'bio': 'Sarova Hotels is Kenya\'s leading home-grown hotel group with properties in Nairobi, Nakuru, Amboseli, Tsavo, and the Mara. We have a rich tradition of developing Kenyan hospitality talent through our award-winning training programmes.',
            'profile_image': 'https://logo.clearbit.com/sarovahotels.com',
            'website': 'https://sarovahotels.com',
            'location': 'Nairobi, Kenya',
            'contact_email': 'hr@sarovahotels.com',
            'posts': [
                {
                    'post_type': 'EVENT',
                    'title': 'Sarova Hotels Open Career Day — Meet Our Hiring Managers',
                    'body': 'Sarova Hotels is hosting a Career Open Day at the Sarova Stanley for hospitality students and young professionals. Meet hiring managers from all departments, attend a hotel tour, and submit your CV for immediate consideration. Dress code: smart casual. Bring 10 copies of your CV.',
                    'external_url': 'https://sarovahotels.com/careers',
                    'cta_label': 'RSVP to Attend',
                },
            ],
        },
        {
            'name': 'Fairmont The Norfolk Hotel',
            'associate_type': 'SOCIETY',
            'bio': 'The Fairmont Norfolk is Nairobi\'s most historic hotel, established in 1904. As part of the global Fairmont brand, we offer world-class hospitality training, international exchange programmes, and the prestigious Fairmont Academy development path.',
            'profile_image': 'https://logo.clearbit.com/fairmont.com',
            'website': 'https://fairmont.com/norfolk-nairobi',
            'location': 'Nairobi, Kenya',
            'contact_email': 'norfolk.careers@fairmont.com',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'Fairmont Academy — International Hospitality Management Programme',
                    'body': 'The Fairmont Academy is a global leadership programme for high-potential hospitality graduates. Selected candidates complete 18-month rotational placements across Fairmont properties worldwide — potentially in London, Dubai, or the Maldives. Apply from Kenya for a chance at an international hospitality career.',
                    'external_url': 'https://fairmont.com/careers/academy',
                    'cta_label': 'Apply for Fairmont Academy',
                },
            ],
        },
    ],

    'Aviation Hub': [
        {
            'name': 'Kenya Airways',
            'associate_type': 'SOCIETY',
            'bio': 'Kenya Airways is Kenya\'s national airline and the Pride of Africa, connecting 54 destinations across Africa and the world. We run cadet pilot programmes, engineering apprenticeships, and graduate trainee schemes for ambitious Kenyan youth.',
            'profile_image': 'https://logo.clearbit.com/kenya-airways.com',
            'website': 'https://kenya-airways.com',
            'location': 'Nairobi, Kenya',
            'contact_email': 'careers@kenya-airways.com',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'Kenya Airways Cadet Pilot Programme 2025 — Applications Open',
                    'body': 'Kenya Airways is accepting applications for the 2025 Cadet Pilot Programme, a fully-funded Ab-Initio flying training programme for aspiring commercial pilots. Applicants must be Kenyan citizens aged 18–28 with a minimum of B in KCSE Maths and Physics. Selection involves aptitude tests, medicals, and interviews.',
                    'external_url': 'https://kenya-airways.com/careers/cadet-pilot',
                    'cta_label': 'Apply for Cadet Programme',
                },
            ],
        },
        {
            'name': 'Kenya Civil Aviation Authority (KCAA)',
            'associate_type': 'SOCIETY',
            'bio': 'KCAA is the government body responsible for regulating civil aviation in Kenya, including licensing of pilots, engineers, air traffic controllers, and aviation training organisations. We ensure the safety and security of Kenya\'s airspace.',
            'profile_image': 'https://logo.clearbit.com/kcaa.or.ke',
            'website': 'https://kcaa.or.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@kcaa.or.ke',
            'posts': [
                {
                    'post_type': 'RESOURCE',
                    'title': 'How to Get Your Private Pilot Licence (PPL) in Kenya',
                    'body': 'This KCAA guide walks you through the requirements for obtaining a Private Pilot Licence in Kenya — medical class, ground school, flight hours, and the examinations required. Includes a list of KCAA-approved flying schools in Kenya and estimated training costs.',
                    'external_url': 'https://kcaa.or.ke/licensing/pilots',
                    'cta_label': 'Read PPL Guide',
                },
            ],
        },
        {
            'name': 'AMREF Flying Doctors',
            'associate_type': 'SOCIETY',
            'bio': 'AMREF Flying Doctors is the world\'s largest air ambulance service, operating from Wilson Airport Nairobi. We provide aeromedical evacuations, air ambulance transfers, and aviation medicine training across Africa.',
            'profile_image': 'https://logo.clearbit.com/flydoc.org',
            'website': 'https://flydoc.org',
            'location': 'Wilson Airport, Nairobi, Kenya',
            'contact_email': 'ops@flydoc.org',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'AMREF Flying Doctors Aviation & Medical Internship',
                    'body': 'AMREF Flying Doctors offers internship opportunities for aviation and medical students to experience aeromedical operations. Interns rotate through dispatch, flight operations, and the medical team. Placements are 3 months and based at Wilson Airport, Nairobi.',
                    'external_url': 'https://flydoc.org/careers',
                    'cta_label': 'Apply for Internship',
                },
            ],
        },
        {
            'name': 'East African School of Aviation (EASA)',
            'associate_type': 'SCHOOL',
            'bio': 'EASA is the leading aviation training institution in East Africa, offering ICAO-compliant programmes in Air Traffic Control, Aircraft Maintenance Engineering, Airport Operations, and Aviation Management. EASA graduates work at airports across the continent.',
            'profile_image': 'https://logo.clearbit.com/eastafricanschoolofaviation.ac.ke',
            'website': 'https://eastafricanschoolofaviation.ac.ke',
            'location': 'Wilson Airport, Nairobi, Kenya',
            'contact_email': 'admissions@easa.ac.ke',
            'posts': [
                {
                    'post_type': 'UPDATE',
                    'title': 'EASA 2025 Intake — Air Traffic Control & Aircraft Maintenance Programmes',
                    'body': 'East African School of Aviation is now accepting applications for the 2025 intake in Air Traffic Control, Aircraft Maintenance Engineering (B1/B2), Airport Operations, and Meteorology. All programmes are KCAA and ICAO accredited. Government-sponsored slots available via KUCCPS.',
                    'external_url': 'https://eastafricanschoolofaviation.ac.ke/admissions',
                    'cta_label': 'Apply for Admission',
                },
            ],
        },
        {
            'name': 'Safarilink Aviation',
            'associate_type': 'SOCIETY',
            'bio': 'Safarilink is Kenya\'s leading regional airline, connecting Nairobi with major safari and beach destinations including the Masai Mara, Lamu, Diani, and Amboseli. We offer pilot cadetships and aviation career development programmes.',
            'profile_image': 'https://logo.clearbit.com/safarilink.aero',
            'website': 'https://flysafarilink.com',
            'location': 'Wilson Airport, Nairobi, Kenya',
            'contact_email': 'careers@flysafarilink.com',
            'posts': [
                {
                    'post_type': 'OPPORTUNITY',
                    'title': 'Safarilink First Officer Recruitment 2025',
                    'body': 'Safarilink Aviation is recruiting First Officers for its Cessna Caravan and Dash 8 fleets. Applicants must hold a valid KCAA ATPL or CPL with IR, have a minimum of 500 flight hours, and a valid Class 1 medical. Strong knowledge of East African low-level bush flying is an advantage.',
                    'external_url': 'https://flysafarilink.com/careers',
                    'cta_label': 'Apply for First Officer',
                },
            ],
        },
        {
            'name': 'Kenya Aeronautical College (KAC)',
            'associate_type': 'SCHOOL',
            'bio': 'Kenya Aeronautical College offers accredited training in Aircraft Maintenance Engineering, Avionics, Air Transport Management, and private pilot training. KAC is approved by the Kenya Civil Aviation Authority and produces over 200 aviation graduates annually.',
            'profile_image': 'https://logo.clearbit.com/kac.ac.ke',
            'website': 'https://kac.ac.ke',
            'location': 'Nairobi, Kenya',
            'contact_email': 'info@kac.ac.ke',
            'posts': [
                {
                    'post_type': 'UPDATE',
                    'title': 'KAC Aircraft Maintenance Engineering Programme — September 2025 Intake',
                    'body': 'Kenya Aeronautical College is accepting applications for the KCAA-approved Aircraft Maintenance Engineering programme starting September 2025. The 3-year programme covers airframe, engines, and avionics. Graduates are eligible to apply for KCAA Part-66 licensing. Minimum entry: KCSE C+ with B in Maths and Physics.',
                    'external_url': 'https://kac.ac.ke/admissions',
                    'cta_label': 'Apply for AME Programme',
                },
            ],
        },
    ],
}


class Command(BaseCommand):
    help = 'Populate associates and their banner posts for all hubs'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing associates before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            Associate.objects.all().delete()
            self.stdout.write(self.style.WARNING('Cleared all existing associates.'))

        total_associates = 0
        total_posts = 0
        skipped_hubs = []

        for hub_name, associates_list in ASSOCIATES_DATA.items():
            try:
                hub = CareerHub.objects.get(name=hub_name)
            except CareerHub.DoesNotExist:
                skipped_hubs.append(hub_name)
                self.stdout.write(self.style.WARNING(f'  Hub not found, skipping: {hub_name}'))
                continue

            self.stdout.write(f'\n📌 {hub_name}')

            for assoc_data in associates_list:
                posts_data = assoc_data.pop('posts', [])

                assoc, created = Associate.objects.update_or_create(
                    name=assoc_data['name'],
                    hub=hub,
                    defaults={
                        **assoc_data,
                        'is_verified': True,
                        'is_suspended': False,
                        'application_status': 'APPROVED',
                    }
                )
                total_associates += 1
                status_label = 'Created' if created else 'Updated'
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ {status_label}: {assoc.name} ({assoc.associate_type})')
                )

                for post_data in posts_data:
                    _, post_created = AssociatePost.objects.get_or_create(
                        associate=assoc,
                        title=post_data['title'],
                        defaults={
                            **post_data,
                            'is_visible': True,
                            'upvotes': 0,
                        }
                    )
                    total_posts += 1
                    if post_created:
                        self.stdout.write(f'    📝 Post: {post_data["title"][:60]}...')

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS(
            f'Done! {total_associates} associates, {total_posts} posts seeded.'
        ))
        if skipped_hubs:
            self.stdout.write(self.style.WARNING(
                f'Skipped hubs (not in DB): {", ".join(skipped_hubs)}'
            ))
        self.stdout.write(
            self.style.WARNING('Run populate_hubs first if any hubs were skipped.')
        )
