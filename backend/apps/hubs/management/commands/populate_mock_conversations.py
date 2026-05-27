from django.core.management.base import BaseCommand
from apps.authentication.models import User
from apps.hubs.models import CareerHub, Post, Comment


MOCK_USERS = [
    {
        'username': 'brian_kamau',
        'email': 'brian.kamau@students.uon.ac.ke',
        'first_name': 'Brian',
        'last_name': 'Kamau',
        'role': 'contributor',
        'bio': 'CS student at UoN. Passionate about web dev and open source.',
        'location': 'Nairobi, Kenya',
    },
    {
        'username': 'amina_hassan',
        'email': 'amina.hassan@students.ku.ac.ke',
        'first_name': 'Amina',
        'last_name': 'Hassan',
        'role': 'novice',
        'bio': 'Electrical Engineering student at KU. Interested in renewable energy.',
        'location': 'Nairobi, Kenya',
    },
    {
        'username': 'david_ochieng',
        'email': 'david.ochieng@students.strathmore.edu',
        'first_name': 'David',
        'last_name': 'Ochieng',
        'role': 'contributor',
        'bio': 'LLB student at Strathmore. Moot court enthusiast and legal aid volunteer.',
        'location': 'Nairobi, Kenya',
    },
    {
        'username': 'faith_wanjiku',
        'email': 'faith.wanjiku@students.jkuat.ac.ke',
        'first_name': 'Faith',
        'last_name': 'Wanjiku',
        'role': 'novice',
        'bio': 'Software Engineering at JKUAT. Building my first SaaS product.',
        'location': 'Juja, Kenya',
    },
    {
        'username': 'samuel_kiprop',
        'email': 'samuel.kiprop@students.dkut.ac.ke',
        'first_name': 'Samuel',
        'last_name': 'Kiprop',
        'role': 'contributor',
        'bio': 'Mechatronics Engineering, DeKUT. Robotics club lead.',
        'location': 'Nyeri, Kenya',
    },
    {
        'username': 'priya_patel',
        'email': 'priya.patel@students.uon.ac.ke',
        'first_name': 'Priya',
        'last_name': 'Patel',
        'role': 'novice',
        'bio': 'LLB at UoN. Focusing on commercial and IP law.',
        'location': 'Nairobi, Kenya',
    },
    {
        'username': 'kevin_omondi',
        'email': 'kevin.omondi@students.mmust.ac.ke',
        'first_name': 'Kevin',
        'last_name': 'Omondi',
        'role': 'contributor',
        'bio': 'IT student at MMUST. Full-stack developer and hackathon regular.',
        'location': 'Kakamega, Kenya',
    },
    {
        'username': 'lydia_muthoni',
        'email': 'lydia.muthoni@students.egerton.ac.ke',
        'first_name': 'Lydia',
        'last_name': 'Muthoni',
        'role': 'novice',
        'bio': 'BSc Computer Science, Egerton University. Interested in data science.',
        'location': 'Nakuru, Kenya',
    },
]


CONVERSATIONS = {
    'Tech Hub': [
        {
            'title': 'How do I land a dev job straight out of university in Kenya?',
            'content': (
                "I'm finishing my BSc Computer Science at UoN in August and I'm genuinely worried about the job market. "
                "Most internship listings want 1-2 years of experience, which makes no sense if they're asking for interns. "
                "I've done a few personal projects (a Django REST API and a basic React app) but nothing industry-scale. "
                "Has anyone successfully gone from campus to a paid dev role without going through Andela or a bootcamp first? "
                "What did your CV actually look like when you got your first interview?"
            ),
            'post_type': 'question',
            'upvotes': 34,
            'author_username': 'faith_wanjiku',
            'comments': [
                {
                    'author': 'brian_kamau',
                    'content': (
                        "Graduated from UoN CS last year. Honest answer: GitHub profile mattered more than my degree certificate "
                        "in every single interview. I pushed code daily for 4 months before graduation — nothing fancy, just "
                        "consistent commits on real projects. Three companies I interviewed at specifically mentioned my GitHub streak. "
                        "Also, contribute to at least one open source project. Even a documentation fix counts."
                    ),
                    'upvotes': 18,
                    'replies': [
                        {
                            'author': 'kevin_omondi',
                            'content': (
                                "This. I'd add: deploy something. A live URL you can show is worth ten GitHub repos. "
                                "Heroku is free tier enough for a portfolio project. It shows you understand the full pipeline, "
                                "not just writing code locally."
                            ),
                            'upvotes': 12,
                        },
                        {
                            'author': 'faith_wanjiku',
                            'content': (
                                "Thanks Brian — quick question, did you use a specific format for the GitHub README on your "
                                "portfolio projects or just default? I hear recruiters spend less than 30 seconds on a repo."
                            ),
                            'upvotes': 5,
                        },
                    ],
                },
                {
                    'author': 'lydia_muthoni',
                    'content': (
                        "The Andela route is genuinely good if you qualify — the stipend during the fellowship covers rent and "
                        "you come out with a reference from a global tech company. But the bar is high. I'd also look at "
                        "Safaricom's Spark programme and KCB's digital banking grad scheme. Not pure dev roles but they pay well "
                        "and give you mentorship you won't get at a startup."
                    ),
                    'upvotes': 14,
                    'replies': [],
                },
                {
                    'author': 'kevin_omondi',
                    'content': (
                        "Attend tech meetups physically. GDG Nairobi, PyNairobi, ReactKe — these communities have hiring managers "
                        "and CTOs who show up. I met my first employer at a GDG DevFest. A handshake beats a LinkedIn cold message "
                        "every time. iHub also posts jobs on their board that never make it to JobWebKenya."
                    ),
                    'upvotes': 21,
                    'replies': [
                        {
                            'author': 'amina_hassan',
                            'content': (
                                "Are these meetups also open to students from non-Nairobi universities? I'm at KU Thika campus "
                                "and the commute to town is a real barrier. Any remote communities that are equally active?"
                            ),
                            'upvotes': 8,
                        },
                    ],
                },
            ],
        },
        {
            'title': 'Completed Moringa School bootcamp — honest review after 6 months',
            'content': (
                "I enrolled in Moringa's Software Engineering track in January and just finished. Here's my unfiltered take.\n\n"
                "**The good:** The curriculum is structured and paced well. You go from zero to full-stack (React + Flask) in 20 weeks. "
                "Instructors are practising developers, not just lecturers. The alumni network is real — classmates are now at Cellulant, "
                "Twiga, and one is at GitHub in Amsterdam.\n\n"
                "**The hard:** The pace is brutal in weeks 6-10. You WILL fall behind on sleep. Group projects exposed every "
                "weakness I had in collaboration.\n\n"
                "**The reality:** I'm 3 months post-graduation and still job hunting. The job placement support is inconsistent — "
                "some cohorts get heavy support, others feel forgotten. Ask about the CURRENT cohort's placement rate before enrolling.\n\n"
                "Happy to answer specific questions."
            ),
            'post_type': 'success_story',
            'upvotes': 67,
            'author_username': 'brian_kamau',
            'comments': [
                {
                    'author': 'faith_wanjiku',
                    'content': (
                        "This is exactly the kind of review I needed. Was the scholarship process transparent? "
                        "I've been told Moringa offers need-based scholarships but I can't find clear criteria anywhere "
                        "on their site — just a 'contact us' form."
                    ),
                    'upvotes': 9,
                    'replies': [
                        {
                            'author': 'brian_kamau',
                            'content': (
                                "Scholarship criteria: KCSE B+ and above, financial need documented by a letter from your "
                                "parent/guardian, and you pass their technical assessment. The assessment is 2 hours — logic "
                                "problems and some basic coding. It's more competitive than they let on publicly."
                            ),
                            'upvotes': 13,
                        },
                    ],
                },
                {
                    'author': 'kevin_omondi',
                    'content': (
                        "Appreciate the honesty on job placement. I've seen too many bootcamp reviews that read like "
                        "paid marketing. One thing I'd push back on: if you're 3 months out and still hunting, it might be "
                        "worth auditing what you're actually applying for. Are you targeting roles that match your portfolio, "
                        "or are you going straight for senior positions?"
                    ),
                    'upvotes': 17,
                    'replies': [
                        {
                            'author': 'brian_kamau',
                            'content': (
                                "Fair point. I was applying to mid-level roles initially which was dumb in hindsight. "
                                "Narrowed my search to junior roles explicitly and internship-to-hire positions last month. "
                                "Already had two callbacks. The title matters more than I expected."
                            ),
                            'upvotes': 11,
                        },
                    ],
                },
                {
                    'author': 'lydia_muthoni',
                    'content': (
                        "How does Moringa compare to just doing freeCodeCamp or The Odin Project independently? "
                        "Genuinely asking because the fee is 120K+ and I'm wondering if structured accountability "
                        "is worth that much over self-study."
                    ),
                    'upvotes': 20,
                    'replies': [
                        {
                            'author': 'brian_kamau',
                            'content': (
                                "If you are genuinely self-disciplined: self-study is fine. The Odin Project is excellent. "
                                "Moringa's real value is the cohort — having 40 people going through the same struggle, "
                                "the peer reviews, and the career support. If you're the type to skip study sessions "
                                "when things get hard, pay for structure."
                            ),
                            'upvotes': 15,
                        },
                    ],
                },
            ],
        },
        {
            'title': 'Best free resources to learn Python + Data Science in 2025 (Kenya focus)',
            'content': (
                "Putting together a list of resources that actually work for students in Kenya — factoring in data costs, "
                "offline access, and relevance to local job market.\n\n"
                "Would love input from anyone currently working in data roles or studying data science at Kenyan universities. "
                "What did you actually use vs what just looks good on a list?"
            ),
            'post_type': 'guide',
            'upvotes': 45,
            'author_username': 'lydia_muthoni',
            'comments': [
                {
                    'author': 'brian_kamau',
                    'content': (
                        "CS50P (Harvard, totally free) and then fast.ai for ML fundamentals. Both downloadable offline. "
                        "For local context: the Kenya Open Data Portal has real datasets — analysing constituency budgets "
                        "or KCPE county performance data is a great portfolio project because you understand the domain."
                    ),
                    'upvotes': 22,
                    'replies': [],
                },
                {
                    'author': 'faith_wanjiku',
                    'content': (
                        "Kaggle Learn is underrated. Their free courses on Pandas, SQL, and ML are short, practical, "
                        "and come with competitions where you can win cash or swag. I've seen Kenyan students ranked in "
                        "the top 5% on their tabular competitions. It's also a portfolio signal on your CV."
                    ),
                    'upvotes': 16,
                    'replies': [
                        {
                            'author': 'lydia_muthoni',
                            'content': (
                                "Agreed on Kaggle. One tip: join team competitions, not just solo ones. "
                                "The collaboration aspect and working on notebooks together is how you learn "
                                "professional practices, not just techniques."
                            ),
                            'upvotes': 10,
                        },
                    ],
                },
                {
                    'author': 'amina_hassan',
                    'content': (
                        "For data engineering side (which pays better in Kenya right now): the dbt fundamentals course "
                        "is free, and there are good YouTube playlists on Apache Spark from African content creators. "
                        "Companies like Twiga, Cellulant, and SafeBoda are actively hiring data engineers over pure data scientists."
                    ),
                    'upvotes': 19,
                    'replies': [
                        {
                            'author': 'kevin_omondi',
                            'content': (
                                "Can confirm on data engineering demand. The ratio of data engineers to data scientists "
                                "hired in Nairobi startups I've tracked on LinkedIn over the past year is roughly 3:1. "
                                "Pipelines and warehousing are the immediate pain point for most growing local companies."
                            ),
                            'upvotes': 14,
                        },
                        {
                            'author': 'faith_wanjiku',
                            'content': (
                                "This is a genuine shift in what I was planning to focus on. "
                                "Is there a learning path you'd recommend to go from Python basics to job-ready "
                                "data engineering in about 6 months of consistent study?"
                            ),
                            'upvotes': 7,
                        },
                    ],
                },
            ],
        },
    ],

    'Engineering Hub': [
        {
            'title': 'JKUAT vs DeKUT for Electrical Engineering — which should I actually choose?',
            'content': (
                "I've been offered admission to both JKUAT (BSc Electrical & Electronic Engineering) and "
                "DeKUT (BSc Electrical Engineering) and I genuinely cannot decide.\n\n"
                "JKUAT has the name recognition and larger alumni network. DeKUT seems more focused on hands-on "
                "technical work but is in Nyeri which is further from industry connections in Nairobi.\n\n"
                "I want to work in power systems / renewable energy eventually. Any graduates from either "
                "institution willing to share what the lab facilities and industry attachment programmes are "
                "actually like? Not the marketing brochure version — the real one."
            ),
            'post_type': 'question',
            'upvotes': 41,
            'author_username': 'amina_hassan',
            'comments': [
                {
                    'author': 'samuel_kiprop',
                    'content': (
                        "DeKUT alumnus here (Mechatronics, 2023). The hands-on reputation is earned — we had mandatory "
                        "lab hours every week and our industrial attachment in 3rd year was 3 full months, not 6 weeks "
                        "like some universities. The power lab was well-equipped. If you want power systems specifically, "
                        "DeKUT's relationship with Kenya Power for attachments is solid."
                    ),
                    'upvotes': 27,
                    'replies': [
                        {
                            'author': 'amina_hassan',
                            'content': (
                                "The Kenya Power attachment angle is exactly what I was hoping to hear. "
                                "Do students typically get placed in Nairobi or at rural substations? "
                                "I'm okay with either but want to plan for accommodation."
                            ),
                            'upvotes': 8,
                        },
                        {
                            'author': 'samuel_kiprop',
                            'content': (
                                "Placements vary — I know classmates who went to Olkaria (geothermal, fascinating experience) "
                                "and others who were in Nairobi North region. The department coordinates placements but "
                                "you can express a preference in your attachment application form."
                            ),
                            'upvotes': 11,
                        },
                    ],
                },
                {
                    'author': 'brian_kamau',
                    'content': (
                        "On the Nairobi networking point: the distance is less of a barrier than it used to be. "
                        "IEEE Kenya holds most events hybrid now, and LinkedIn networking has largely replaced "
                        "in-person coffee chats for early-career connections. If DeKUT's curriculum is stronger "
                        "for your goal, the location shouldn't be a dealbreaker."
                    ),
                    'upvotes': 15,
                    'replies': [],
                },
                {
                    'author': 'faith_wanjiku',
                    'content': (
                        "Also consider the KCAA / EBK accreditation status of each specific programme when you graduate. "
                        "Both are EBK accredited but check the most recent accreditation visit year — a programme with "
                        "a recent visit is more likely to have updated equipment standards."
                    ),
                    'upvotes': 13,
                    'replies': [
                        {
                            'author': 'amina_hassan',
                            'content': (
                                "Didn't know accreditation visits were on a rolling basis — I assumed once accredited, "
                                "always accredited. Where do you check the last EBK visit date? Their website isn't clear."
                            ),
                            'upvotes': 6,
                        },
                    ],
                },
            ],
        },
        {
            'title': 'Passed the EBK Graduate Engineer registration — here\'s what the process actually looks like',
            'content': (
                "I've been asked this so many times in DMs that it makes sense to just post it publicly.\n\n"
                "**Timeline:** I graduated December 2023, submitted application March 2024, received my Graduate Engineer "
                "certificate July 2024. That's 4 months — faster than I expected.\n\n"
                "**Documents required (as of 2024):**\n"
                "- Certified copies of degree certificate and transcripts\n"
                "- Two passport photos\n"
                "- Completed application form (downloadable from ebk.or.ke)\n"
                "- Registration fee: KES 3,000\n"
                "- Employer reference letter or supervisor's letter if not yet employed\n\n"
                "**Important:** If your university is not on EBK's accredited list, your application will be referred "
                "for assessment which adds 3-6 months. Verify before you apply.\n\n"
                "Happy to answer specific questions."
            ),
            'post_type': 'success_story',
            'upvotes': 89,
            'author_username': 'samuel_kiprop',
            'comments': [
                {
                    'author': 'amina_hassan',
                    'content': (
                        "This is incredibly useful, thank you. Quick question: can you apply while you're still in your "
                        "final semester, or must you wait until you physically have the degree certificate? "
                        "My graduation ceremony is in December but I need to start a job in September."
                    ),
                    'upvotes': 19,
                    'replies': [
                        {
                            'author': 'samuel_kiprop',
                            'content': (
                                "You have to wait for the actual certificate — a completion letter from the university "
                                "is not accepted. However, most employers are okay hiring a Graduate Engineer "
                                "provisionally while you wait for EBK registration, as long as you submit proof of "
                                "application. Ask your HR to specify this in the offer letter."
                            ),
                            'upvotes': 23,
                        },
                    ],
                },
                {
                    'author': 'kevin_omondi',
                    'content': (
                        "The employer reference letter requirement confused me when I first read it. Can you clarify — "
                        "if you're newly graduated and haven't started a job yet, does a lecturer serve as a referee, "
                        "or does EBK have a different provision for new graduates?"
                    ),
                    'upvotes': 11,
                    'replies': [
                        {
                            'author': 'samuel_kiprop',
                            'content': (
                                "Your final year project supervisor works perfectly as a referee. "
                                "I used mine and it went through without any query. Just make sure the letter "
                                "is on official university letterhead and references your project and academic work specifically."
                            ),
                            'upvotes': 17,
                        },
                        {
                            'author': 'amina_hassan',
                            'content': (
                                "Does the letter need to be from a Registered Engineer specifically, "
                                "or just an academic with engineering credentials?"
                            ),
                            'upvotes': 8,
                        },
                    ],
                },
                {
                    'author': 'lydia_muthoni',
                    'content': (
                        "Saving this post. This is the kind of practical knowledge that nobody teaches in university "
                        "and isn't anywhere on the official EBK website in clear language. You should submit this as "
                        "a proper guide on this hub."
                    ),
                    'upvotes': 14,
                    'replies': [],
                },
            ],
        },
        {
            'title': 'Kenya Power industrial attachment — what to genuinely expect (2025)',
            'content': (
                "Just finished my 3-month Kenya Power attachment in the Nairobi South region. Sharing my experience "
                "because most of what I found online before going was either vague or outdated.\n\n"
                "**The work:** I was attached to the Distribution department. The first two weeks were mostly shadow work "
                "— accompanying technicians on fault-finding and transformer maintenance. From week three, I was contributing "
                "to GIS mapping updates and participating in switchgear maintenance under supervision.\n\n"
                "**Practical reality:** Bring proper PPE — the stipend won't cover site-grade boots and gloves. "
                "The allowance is KES 5,000/month which barely covers transport. Arrange accommodation before you arrive.\n\n"
                "**What impressed me:** The engineers are genuinely knowledgeable and most were willing to explain things. "
                "The smart metering rollout projects are interesting to observe. I also got to visit the national control centre once.\n\n"
                "Ask me anything."
            ),
            'post_type': 'discussion',
            'upvotes': 53,
            'author_username': 'amina_hassan',
            'comments': [
                {
                    'author': 'samuel_kiprop',
                    'content': (
                        "The PPE point is critical and nobody warns you about this. I'd add: buy your own hard hat "
                        "early — the ones they lend out at sites are often cracked or don't fit. "
                        "Personal PPE also signals to site engineers that you're serious, which affects how much "
                        "meaningful work they let you do."
                    ),
                    'upvotes': 21,
                    'replies': [],
                },
                {
                    'author': 'kevin_omondi',
                    'content': (
                        "How competitive is the application process? Do you apply directly to Kenya Power or through "
                        "your university attachment office? I'm at MMUST which doesn't have an obvious formal channel "
                        "with KPLC like the Nairobi universities seem to."
                    ),
                    'upvotes': 12,
                    'replies': [
                        {
                            'author': 'amina_hassan',
                            'content': (
                                "Applications go directly to KPLC — there's a form on their website under 'Careers > "
                                "Industrial Training'. The university attachment letter is required as a supporting document "
                                "but KPLC manages the selection. Apply early — they process in batches and popular regions "
                                "fill up fast."
                            ),
                            'upvotes': 15,
                        },
                    ],
                },
                {
                    'author': 'faith_wanjiku',
                    'content': (
                        "What was the working hours arrangement like? 8-5 Mon-Fri or were there site visits "
                        "that went outside regular hours? Asking because I need to balance an online course "
                        "I'm doing concurrently."
                    ),
                    'upvotes': 9,
                    'replies': [
                        {
                            'author': 'amina_hassan',
                            'content': (
                                "Generally 7:30am to 4:30pm at the depot, but fault response calls occasionally "
                                "extended the day — you're not obligated to join those as an attachee but I usually did "
                                "because the emergency work was the most educational. "
                                "Evening hours were free. An online course is very doable."
                            ),
                            'upvotes': 11,
                        },
                        {
                            'author': 'samuel_kiprop',
                            'content': (
                                "Agree. Use the evenings productively during attachment — it's one of the few periods "
                                "where you have structured days and free evenings. I got my AWS Cloud Practitioner "
                                "during my attachment period."
                            ),
                            'upvotes': 8,
                        },
                    ],
                },
            ],
        },
    ],

    'Law Hub': [
        {
            'title': 'My ATP application was rejected by KSL — what are my actual options?',
            'content': (
                "I graduated with an LLB from a private university in Kenya last year. My application to join the "
                "Advocates Training Programme at Kenya School of Law was rejected because my university was listed as "
                "'not approved' on their current list.\n\n"
                "I've been trying to get clarity from KSL for 3 months and keep getting different answers from "
                "different offices. My degree is from a genuinely accredited institution — they're on the CUE register.\n\n"
                "Has anyone else gone through this? Is there a formal appeal process? Can I go to High Court to "
                "compel KSL to consider my application? I'm seriously considering this as my lecturers have suggested "
                "it has worked before."
            ),
            'post_type': 'question',
            'upvotes': 58,
            'author_username': 'priya_patel',
            'comments': [
                {
                    'author': 'david_ochieng',
                    'content': (
                        "This has happened to several people I know. The legal basis for challenging KSL's refusal "
                        "is Judicial Review — specifically a Prerogative Order of Mandamus compelling them to process "
                        "your application. The threshold is met when an institution has a public duty to act and refuses to. "
                        "The LSK has a pro-bono referral programme — contact them before paying a private advocate."
                    ),
                    'upvotes': 34,
                    'replies': [
                        {
                            'author': 'priya_patel',
                            'content': (
                                "Thank you David. Is there a time limit to file for JR from the date of the rejection letter? "
                                "I've heard the limitation period is 3 months but I'm not sure if that applies here."
                            ),
                            'upvotes': 12,
                        },
                        {
                            'author': 'david_ochieng',
                            'content': (
                                "Order 53 Rule 2 of the Civil Procedure Rules requires leave to apply for JR to be sought "
                                "promptly and within 6 months for High Court. But courts expect you to exhaust internal "
                                "remedies first — so formally appeal in writing to KSL's Registrar, keep that paper trail, "
                                "THEN consider JR if the appeal fails. The paper trail strengthens your case significantly."
                            ),
                            'upvotes': 28,
                        },
                    ],
                },
                {
                    'author': 'lydia_muthoni',
                    'content': (
                        "Have you tried writing directly to the Commission for University Education (CUE) to get a formal "
                        "letter confirming your institution's accreditation status? Sometimes KSL will reconsider if you "
                        "present official documentation from CUE rather than just your degree certificate. "
                        "CUE responds to formal written requests within 14 working days."
                    ),
                    'upvotes': 22,
                    'replies': [
                        {
                            'author': 'priya_patel',
                            'content': (
                                "This is the most actionable thing I've read in 3 months of searching. "
                                "I didn't know I could request a formal letter from CUE directly. Doing this tomorrow."
                            ),
                            'upvotes': 16,
                        },
                    ],
                },
                {
                    'author': 'kevin_omondi',
                    'content': (
                        "While you're working through this, it might be worth exploring whether you can sit for "
                        "the ACCA or CPA as an interim qualification — not because law isn't worth fighting for, "
                        "but having an additional professional qualification means you're not in limbo. "
                        "Some law graduates I know ended up in compliance and legal advisory roles this way."
                    ),
                    'upvotes': 9,
                    'replies': [],
                },
            ],
        },
        {
            'title': 'How I passed all ATP exams in my first sitting — practical study strategy',
            'content': (
                "I passed all 8 ATP subjects in my first sitting (November 2024 diet). I want to share what worked because "
                "the pass rate has been declining and the materials available online are mostly outdated.\n\n"
                "**The honest truth first:** The ATP exams are harder than any undergraduate paper I sat. The examiners "
                "expect application of law to facts, not regurgitation. Multiple-choice MCQs are there to trick you.\n\n"
                "**What worked for me:**\n"
                "1. Past papers (minimum 5 years) for every subject — pattern recognition is real\n"
                "2. Study groups of 4-5, not solo cramming. Teaching a concept to someone else cements it.\n"
                "3. KSL's own study materials are insufficient alone — supplement with Halsbury's Laws for procedure questions\n"
                "4. The Professional Practice paper is the most practical — simulate client scenarios in your study groups\n\n"
                "Happy to share my notes for Civil Litigation and Criminal Procedure if there's interest."
            ),
            'post_type': 'success_story',
            'upvotes': 113,
            'author_username': 'david_ochieng',
            'comments': [
                {
                    'author': 'priya_patel',
                    'content': (
                        "Congratulations David! On study groups — how did you find people to form yours with? "
                        "I enrolled at KSL and don't know many people in my cohort yet. Did you connect through "
                        "the KSL WhatsApp groups or through LSK student membership?"
                    ),
                    'upvotes': 18,
                    'replies': [
                        {
                            'author': 'david_ochieng',
                            'content': (
                                "LSK has a student membership category and their WhatsApp community for KSL students "
                                "is very active. Also, go to the KSL library early on day one and introduce yourself "
                                "to the people already there with highlighters out — those are your people. "
                                "My study group of 5 formed in the first week."
                            ),
                            'upvotes': 21,
                        },
                    ],
                },
                {
                    'author': 'lydia_muthoni',
                    'content': (
                        "Please do share the Civil Litigation notes — that paper has the highest failure rate historically. "
                        "What aspect trips most people up in your view? Is it the procedure rules themselves or "
                        "applying them to novel facts?"
                    ),
                    'upvotes': 25,
                    'replies': [
                        {
                            'author': 'david_ochieng',
                            'content': (
                                "Applying procedure to facts, every time. People memorise Order numbers but freeze "
                                "when given a fact pattern about a commercial dispute and asked to draft a pleading. "
                                "The secret: practice drafting plaints, defences, and interlocutory applications "
                                "from scratch, not filling in templates."
                            ),
                            'upvotes': 31,
                        },
                        {
                            'author': 'priya_patel',
                            'content': (
                                "Where do you get practice fact patterns to draft from? I don't want to rely only on "
                                "past papers — I worry I'm just memorising scenarios."
                            ),
                            'upvotes': 13,
                        },
                    ],
                },
                {
                    'author': 'brian_kamau',
                    'content': (
                        "Not a law student but reading this thread is fascinating. The parallels to software engineering "
                        "interviews are interesting — it's always application to novel problems, not recitation of "
                        "syntax. Different fields, same lesson."
                    ),
                    'upvotes': 8,
                    'replies': [],
                },
            ],
        },
        {
            'title': 'Is an LLB in Kenya still worth it in 2025? A realistic assessment',
            'content': (
                "I'm about to start Form 4 and the pressure to 'do law' from my family is real. Before I commit, "
                "I want an honest conversation with people who are in or have recently graduated from Kenyan law programmes.\n\n"
                "My specific concerns:\n"
                "1. The advocate job market seems saturated — LSK has 16,000+ members. How are new graduates actually faring?\n"
                "2. The ATP bottleneck means years before you're earning. Is the 5+ year investment realistic for a "
                "middle-income family?\n"
                "3. I've heard the real money in law is corporate and IP. Is that accessible without connections?\n\n"
                "Not trying to discourage anyone — just want a frank discussion, not the standard 'law opens all doors' speech."
            ),
            'post_type': 'discussion',
            'upvotes': 76,
            'author_username': 'lydia_muthoni',
            'comments': [
                {
                    'author': 'david_ochieng',
                    'content': (
                        "LLB student at Strathmore, 3rd year. Honest take: the market IS saturated at the general "
                        "advocacy level. But the shortage is in specialist areas — data privacy law, fintech regulation, "
                        "environmental law, and international arbitration. If you enter law with a specialisation mindset "
                        "from year one, your trajectory is completely different from someone who just wants to 'be a lawyer'."
                    ),
                    'upvotes': 42,
                    'replies': [
                        {
                            'author': 'lydia_muthoni',
                            'content': (
                                "Data privacy law is interesting — is that driven by the Data Protection Act 2019? "
                                "Are companies actually hiring legal counsel for compliance or outsourcing to consultants?"
                            ),
                            'upvotes': 17,
                        },
                        {
                            'author': 'david_ochieng',
                            'content': (
                                "Both, and growing rapidly. The Office of the Data Protection Commissioner has been "
                                "actively enforcing the Act since 2022. Safaricom, banks, and healthcare companies "
                                "are hiring DPOs and legal advisors. Even mid-size SACCOs are realising they need "
                                "compliance counsel. The regulation created a profession almost overnight."
                            ),
                            'upvotes': 29,
                        },
                    ],
                },
                {
                    'author': 'priya_patel',
                    'content': (
                        "On the connections point for corporate law: the Big 4 accounting firms' legal arms and "
                        "international law firms with Nairobi offices (Bowmans, DLA Piper, CMS) recruit on merit "
                        "through structured graduate programmes — not purely connections. Your undergraduate grades "
                        "and mooting record matter more than family networks at those firms."
                    ),
                    'upvotes': 33,
                    'replies': [
                        {
                            'author': 'faith_wanjiku',
                            'content': (
                                "This is encouraging. I've always assumed Kenyan professional services were "
                                "relationship-based for hiring. Are there specific moot court competitions that "
                                "these firms notice, or is any competitive mooting experience valuable?"
                            ),
                            'upvotes': 11,
                        },
                        {
                            'author': 'priya_patel',
                            'content': (
                                "Vis Moot (international commercial arbitration) is the most recognised globally. "
                                "East African Moot Court Competition is well-known locally. Any national moot counts "
                                "but Vis alumni are specifically sought at international commercial law firms. "
                                "Strathmore and UoN have strong Vis records."
                            ),
                            'upvotes': 24,
                        },
                    ],
                },
                {
                    'author': 'kevin_omondi',
                    'content': (
                        "Slightly different angle: a law degree combined with a tech background is incredibly powerful "
                        "right now. LegalTech, IP in software, and data governance are niches with almost no competition "
                        "in Nairobi. If you have a genuine interest in both, a combined LLB/CS or law + programming "
                        "self-study path could place you where very few people can compete with you."
                    ),
                    'upvotes': 38,
                    'replies': [],
                },
            ],
        },
    ],
}


class Command(BaseCommand):
    help = 'Seed mock users, hub posts, and simulated conversations for Tech, Engineering, and Law hubs'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all mock user posts and comments before seeding',
        )

    def _get_or_create_users(self):
        users = {}
        for user_data in MOCK_USERS:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    'username': user_data['username'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'role': user_data['role'],
                    'bio': user_data['bio'],
                    'location': user_data['location'],
                    'email_verified': True,
                    'is_active': True,
                }
            )
            if created:
                user.set_password('MockPass123!')
                user.save(update_fields=['password'])
                self.stdout.write(self.style.SUCCESS(f'  ✓ Created user: {user.username}'))
            else:
                self.stdout.write(f'  ~ Existing user: {user.username}')
            users[user_data['username']] = user
        return users

    def handle(self, *args, **options):
        self.stdout.write('\n👤 Creating mock users...')
        users = self._get_or_create_users()

        total_posts = 0
        total_comments = 0

        for hub_name, posts_data in CONVERSATIONS.items():
            try:
                hub = CareerHub.objects.get(name=hub_name)
            except CareerHub.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'\nHub not found, skipping: {hub_name}'))
                continue

            self.stdout.write(f'\n📌 {hub_name}')

            for post_data in posts_data:
                author = users.get(post_data['author_username'])
                if not author:
                    self.stdout.write(self.style.WARNING(f'  Author not found: {post_data["author_username"]}'))
                    continue

                post, post_created = Post.objects.get_or_create(
                    hub=hub,
                    title=post_data['title'],
                    defaults={
                        'author': author,
                        'content': post_data['content'],
                        'post_type': post_data['post_type'],
                        'upvotes': post_data['upvotes'],
                        'score': post_data['upvotes'],
                        'is_deleted': False,
                    }
                )
                total_posts += 1
                label = 'Created' if post_created else 'Existing'
                self.stdout.write(f'  {"✓" if post_created else "~"} {label} post: {post.title[:60]}')

                comment_count = 0

                for comment_data in post_data.get('comments', []):
                    comment_author = users.get(comment_data['author'])
                    if not comment_author:
                        continue

                    top_comment, c_created = Comment.objects.get_or_create(
                        post=post,
                        author=comment_author,
                        content=comment_data['content'],
                        defaults={
                            'upvotes': comment_data.get('upvotes', 0),
                            'score': comment_data.get('upvotes', 0),
                            'parent_comment': None,
                        }
                    )
                    comment_count += 1
                    total_comments += 1

                    for reply_data in comment_data.get('replies', []):
                        reply_author = users.get(reply_data['author'])
                        if not reply_author:
                            continue

                        _, r_created = Comment.objects.get_or_create(
                            post=post,
                            author=reply_author,
                            content=reply_data['content'],
                            defaults={
                                'upvotes': reply_data.get('upvotes', 0),
                                'score': reply_data.get('upvotes', 0),
                                'parent_comment': top_comment,
                            }
                        )
                        comment_count += 1
                        total_comments += 1

                if post_created or post.comment_count != comment_count:
                    Post.objects.filter(pk=post.pk).update(comment_count=comment_count)

                self.stdout.write(f'    💬 {comment_count} comments/replies seeded')

        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS(
            f'Done! {len(MOCK_USERS)} users, {total_posts} posts, {total_comments} comments seeded.'
        ))
