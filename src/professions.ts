// Curated role titles organized by the 2018 US Standard Occupational Classification
// major groups. Titles include common recruiting variants; this is not the complete
// BLS or O*NET occupation database. https://www.bls.gov/soc/2018/major_groups.htm
export interface ProfessionGroup {
  code: string;
  name: string;
  roles: string[];
  practice: string;
  project: string;
}
export const PROFESSION_GROUPS: ProfessionGroup[] = [
  {
    code: "11",
    name: "Management",
    roles: [
      "Project Manager",
      "Program Manager",
      "Product Manager",
      "Operations Manager",
      "Engineering Manager",
      "IT Manager",
      "Marketing Manager",
      "HR Manager",
      "Finance Manager",
      "Construction Manager",
      "Supply Chain Manager",
      "Entrepreneur",
    ],
    practice:
      "Update a project plan, prioritize a backlog, or document a decision and its trade-offs.",
    project:
      "Produce a project charter with scope, milestones, stakeholders, and risks.",
  },
  {
    code: "13",
    name: "Business & Financial Operations",
    roles: [
      "Analyst",
      "Business Analyst",
      "Data Analyst",
      "Business Intelligence Analyst",
      "Financial Analyst",
      "Operations Analyst",
      "Management Analyst",
      "Market Research Analyst",
      "Budget Analyst",
      "Credit Analyst",
      "Risk Analyst",
      "Compliance Analyst",
      "Investment Analyst",
      "Accountant",
      "Auditor",
      "Project Coordinator",
      "Program Coordinator",
      "Product Operations Analyst",
      "Business Operations Specialist",
      "Human Resources Specialist",
      "Recruiter",
      "Talent Acquisition Specialist",
      "Compensation Analyst",
      "Training & Development Specialist",
      "Procurement Specialist",
      "Logistician",
      "Supply Chain Analyst",
      "Insurance Underwriter",
      "Tax Preparer",
    ],
    practice:
      "Analyze a small dataset or business process. Record the question, evidence, and recommendation.",
    project:
      "Build a short analysis with a clean dataset, findings, and a stakeholder-ready summary.",
  },
  {
    code: "15",
    name: "Computer & Mathematical",
    roles: [
      "Software Developer",
      "Developer",
      "Web Developer",
      "Frontend Developer",
      "Backend Developer",
      "Full Stack Developer",
      "Mobile Developer",
      "QA Engineer",
      "Software Test Engineer",
      "Systems Analyst",
      "IT Support Specialist",
      "Network Engineer",
      "Network Administrator",
      "Systems Administrator",
      "Cloud Engineer",
      "DevOps Engineer",
      "Site Reliability Engineer",
      "Cybersecurity Analyst",
      "Security Engineer",
      "Database Administrator",
      "Data Engineer",
      "Data Scientist",
      "Machine Learning Engineer",
      "Statistician",
      "Actuary",
      "UX Researcher",
      "Computer Research Scientist",
    ],
    practice:
      "Complete a technical lab, fix an issue, or write and test a small implementation. Keep notes.",
    project:
      "Complete a documented technical project with reproducible steps and validation.",
  },
  {
    code: "17",
    name: "Architecture & Engineering",
    roles: [
      "Civil Engineer",
      "Mechanical Engineer",
      "Electrical Engineer",
      "Electronics Engineer",
      "Industrial Engineer",
      "Manufacturing Engineer",
      "Aerospace Engineer",
      "Environmental Engineer",
      "Biomedical Engineer",
      "Chemical Engineer",
      "Materials Engineer",
      "Architect",
      "Landscape Architect",
      "Surveyor",
      "Engineering Technician",
      "CAD Technician",
    ],
    practice:
      "Work through a design calculation, CAD exercise, or technical drawing and check the result.",
    project:
      "Develop a small design with requirements, calculations, a drawing, and a review checklist.",
  },
  {
    code: "19",
    name: "Life, Physical & Social Science",
    roles: [
      "Research Assistant",
      "Research Scientist",
      "Biologist",
      "Chemist",
      "Physicist",
      "Environmental Scientist",
      "Geoscientist",
      "Economist",
      "Psychologist",
      "Sociologist",
      "Political Scientist",
      "Laboratory Technician",
      "Food Scientist",
      "Urban Planner",
    ],
    practice:
      "Read a research paper or analyze observations. Separate evidence, assumptions, and limitations.",
    project:
      "Write a short research report with a question, method, analysis, and references.",
  },
  {
    code: "21",
    name: "Community & Social Service",
    roles: [
      "Social Worker",
      "School Counselor",
      "Career Counselor",
      "Mental Health Counselor",
      "Community Health Worker",
      "Case Manager",
      "Rehabilitation Counselor",
      "Youth Program Coordinator",
      "Christian Ministry Worker",
      "Pastoral Care Coordinator",
      "Volunteer Coordinator",
    ],
    practice:
      "Study a case or service resource and document an appropriate support plan within your training.",
    project:
      "Create a resource guide or supervised service plan for a defined community need.",
  },
  {
    code: "23",
    name: "Legal",
    roles: [
      "Attorney",
      "Paralegal",
      "Legal Assistant",
      "Judicial Clerk",
      "Mediator",
      "Legal Operations Specialist",
      "Title Examiner",
    ],
    practice:
      "Study a legal concept, summarize a case, or organize research with accurate citations.",
    project:
      "Prepare a research memo or document workflow within your qualifications.",
  },
  {
    code: "25",
    name: "Education & Library",
    roles: [
      "Educator",
      "Teacher",
      "Teaching Assistant",
      "Tutor",
      "Instructional Designer",
      "Corporate Trainer",
      "Professor",
      "Librarian",
      "Library Technician",
      "Special Education Teacher",
      "Preschool Teacher",
      "Curriculum Specialist",
      "Student",
    ],
    practice:
      "Study or teach a topic, then use retrieval practice to check understanding.",
    project:
      "Create a lesson, study unit, or learning resource with measurable learning objectives.",
  },
  {
    code: "27",
    name: "Arts, Design, Entertainment & Media",
    roles: [
      "Designer",
      "Graphic Designer",
      "UX Designer",
      "UI Designer",
      "Product Designer",
      "Animator",
      "Illustrator",
      "Writer",
      "Technical Writer",
      "Editor",
      "Journalist",
      "Photographer",
      "Videographer",
      "Video Editor",
      "Musician",
      "Audio Engineer",
      "Public Relations Specialist",
      "Content Strategist",
      "Social Media Specialist",
      "Translator",
      "Interpreter",
    ],
    practice:
      "Create or revise a small piece of work and evaluate it against a clear brief.",
    project:
      "Finish a portfolio piece and explain your process, decisions, and revisions.",
  },
  {
    code: "29",
    name: "Healthcare Practitioners & Technical",
    roles: [
      "Registered Nurse",
      "Nurse Practitioner",
      "Physician",
      "Physician Assistant",
      "Pharmacist",
      "Physical Therapist",
      "Occupational Therapist",
      "Speech Language Pathologist",
      "Dietitian",
      "Dental Hygienist",
      "Radiologic Technologist",
      "Medical Laboratory Scientist",
      "Paramedic",
      "Respiratory Therapist",
      "Health Information Technologist",
    ],
    practice:
      "Review an appropriate case or continuing-education topic within your training and scope.",
    project:
      "Complete an accredited learning module or a supervised quality-improvement exercise.",
  },
  {
    code: "31",
    name: "Healthcare Support",
    roles: [
      "Medical Assistant",
      "Nursing Assistant",
      "Home Health Aide",
      "Personal Care Aide",
      "Dental Assistant",
      "Physical Therapy Assistant",
      "Phlebotomist",
      "Veterinary Assistant",
    ],
    practice:
      "Review a safety procedure or supervised support skill within your role and training.",
    project:
      "Complete an approved training module and document the competencies practiced.",
  },
  {
    code: "33",
    name: "Protective Service",
    roles: [
      "Firefighter",
      "Police Officer",
      "Security Officer",
      "Emergency Management Specialist",
      "Public Safety Dispatcher",
      "Lifeguard",
      "Correctional Officer",
    ],
    practice:
      "Review a role-appropriate safety procedure or complete approved physical conditioning.",
    project:
      "Complete an approved preparedness exercise and document lessons learned.",
  },
  {
    code: "35",
    name: "Food Preparation & Serving",
    roles: [
      "Chef",
      "Cook",
      "Baker",
      "Food Service Manager",
      "Barista",
      "Bartender",
      "Server",
      "Catering Coordinator",
      "Food Preparation Worker",
    ],
    practice:
      "Practice a recipe, service procedure, or food-safety technique and record improvements.",
    project:
      "Plan and prepare a menu with timing, food safety, and cost considerations.",
  },
  {
    code: "37",
    name: "Building & Grounds Maintenance",
    roles: [
      "Facilities Coordinator",
      "Janitor",
      "Landscaper",
      "Groundskeeper",
      "Pest Control Technician",
      "Housekeeping Supervisor",
    ],
    practice:
      "Practice a maintenance task with the appropriate safety checks and equipment.",
    project:
      "Create and complete a preventive-maintenance plan for a defined area.",
  },
  {
    code: "39",
    name: "Personal Care & Service",
    roles: [
      "Personal Trainer",
      "Fitness Instructor",
      "Cosmetologist",
      "Barber",
      "Childcare Worker",
      "Recreation Worker",
      "Travel Guide",
      "Animal Caretaker",
      "Community Recreation Coordinator",
    ],
    practice:
      "Study a role-appropriate care or service technique and practice within your qualifications.",
    project:
      "Create a supervised service plan with accessibility, safety, and client goals.",
  },
  {
    code: "41",
    name: "Sales & Related",
    roles: [
      "Sales Representative",
      "Sales Development Representative",
      "Business Development Representative",
      "Account Executive",
      "Account Manager",
      "Sales Engineer",
      "Real Estate Agent",
      "Insurance Agent",
      "Retail Sales Associate",
      "Customer Success Manager",
      "Sales Operations Analyst",
    ],
    practice:
      "Research an account, practice discovery questions, or improve a concise product explanation.",
    project:
      "Build an account plan or sales presentation grounded in a real customer need.",
  },
  {
    code: "43",
    name: "Office & Administrative Support",
    roles: [
      "Administrative Assistant",
      "Executive Assistant",
      "Office Coordinator",
      "Office Manager",
      "Customer Service Representative",
      "Receptionist",
      "Bookkeeper",
      "Payroll Specialist",
      "Billing Specialist",
      "Data Entry Specialist",
      "Scheduling Coordinator",
      "Records Specialist",
      "Medical Secretary",
      "Loan Processor",
      "Inventory Clerk",
    ],
    practice:
      "Improve a spreadsheet, record-keeping workflow, or written communication.",
    project:
      "Document and improve an administrative process with a reusable checklist or template.",
  },
  {
    code: "45",
    name: "Farming, Fishing & Forestry",
    roles: [
      "Farmer",
      "Agricultural Technician",
      "Farmworker",
      "Forestry Technician",
      "Forest Conservation Worker",
      "Aquaculture Worker",
    ],
    practice:
      "Study or complete a safe role-appropriate cultivation or conservation task.",
    project:
      "Document a seasonal cultivation or conservation plan with observations.",
  },
  {
    code: "47",
    name: "Construction & Extraction",
    roles: [
      "Carpenter",
      "Electrician",
      "Plumber",
      "HVAC Installer",
      "Mason",
      "Construction Laborer",
      "Equipment Operator",
      "Building Inspector",
      "Solar Installer",
      "Welder Apprentice",
    ],
    practice:
      "Study a technical plan, code requirement, or supervised trade technique.",
    project:
      "Complete a supervised trade project with a materials list and safety checklist.",
  },
  {
    code: "49",
    name: "Installation, Maintenance & Repair",
    roles: [
      "HVAC Technician",
      "Automotive Technician",
      "Diesel Mechanic",
      "Industrial Maintenance Technician",
      "Aircraft Mechanic",
      "Telecommunications Technician",
      "Computer Repair Technician",
      "Appliance Technician",
      "Wind Turbine Technician",
    ],
    practice:
      "Work through a diagnostic exercise or supervised repair and document the findings.",
    project:
      "Complete a supervised diagnostic and repair workflow with post-repair validation.",
  },
  {
    code: "51",
    name: "Production",
    roles: [
      "Machinist",
      "CNC Operator",
      "Welder",
      "Production Technician",
      "Quality Control Inspector",
      "Assembler",
      "Printing Technician",
      "Water Treatment Operator",
      "Manufacturing Operator",
      "Craftsperson",
    ],
    practice:
      "Practice a production or inspection skill with the required safety and quality checks.",
    project:
      "Document a repeatable production process with tolerances and inspection criteria.",
  },
  {
    code: "53",
    name: "Transportation & Material Moving",
    roles: [
      "Truck Driver",
      "Delivery Driver",
      "Bus Driver",
      "Pilot",
      "Air Traffic Controller",
      "Warehouse Associate",
      "Forklift Operator",
      "Transportation Coordinator",
      "Freight Agent",
      "Shipping & Receiving Clerk",
    ],
    practice:
      "Review a role-appropriate route, logistics problem, or approved safety procedure.",
    project:
      "Create a transport or inventory plan with scheduling, safety, and cost constraints.",
  },
  {
    code: "55",
    name: "Military-Specific",
    roles: [
      "Military Service Member",
      "Military Operations Specialist",
      "Military Logistics Specialist",
      "Military Communications Specialist",
    ],
    practice:
      "Study an approved role-specific learning topic or complete authorized training.",
    project:
      "Complete an approved professional-development module and record learning outcomes.",
  },
  {
    code: "personal",
    name: "Personal / Undecided",
    roles: ["Explorer", "Career Changer", "Job Seeker", "Volunteer"],
    practice:
      "Explore a role, learn a useful skill, or complete one targeted job application.",
    project:
      "Prepare a career plan with target roles, skill gaps, and a portfolio or résumé update.",
  },
];
export const PROFESSIONS = [
  ...new Set(PROFESSION_GROUPS.flatMap((g) => g.roles)),
];
export const professionGroup = (name: string) =>
  PROFESSION_GROUPS.find((g) => g.roles.includes(name)) ||
  PROFESSION_GROUPS[23];
