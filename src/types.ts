export type SectionType = 'contact' | 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'achievements';

export type TemplateType = 'ats-classic' | 'harvard' | 'jakes' | 'modern' | 'technical';

export type ExportType = 'ats' | 'modern' | 'compact' | 'onepage';

export interface SectionConfig {
  id: string;
  type: SectionType;
  visible: boolean;
  locked: boolean;
  label: string;
}

export interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
}

export interface Experience {
  id: string;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link: string;
  bullets: string[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  honors: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
}

export interface ResumeData {
  contact: ContactInfo;
  summary: string;
  skills: string[];
  experience: Experience[];
  projects: Project[];
  education: Education[];
  achievements: Achievement[];
}

export interface ResumeVersion {
  id: string;
  timestamp: number;
  data: ResumeData;
  label: string;
}

export interface AppSettings {
  viewMode: 'view' | 'edit';
  sectionOrder: SectionConfig[];
  sidebarOpen: boolean;
  template: TemplateType;
  exportType: ExportType;
}

export const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'contact', type: 'contact', visible: true, locked: true, label: 'Contact' },
  { id: 'summary', type: 'summary', visible: true, locked: false, label: 'Professional Summary' },
  { id: 'skills', type: 'skills', visible: true, locked: false, label: 'Skills' },
  { id: 'experience', type: 'experience', visible: true, locked: false, label: 'Experience' },
  { id: 'projects', type: 'projects', visible: true, locked: false, label: 'Projects' },
  { id: 'education', type: 'education', visible: true, locked: false, label: 'Education' },
  { id: 'achievements', type: 'achievements', visible: true, locked: false, label: 'Achievements & Certifications' },
];

export const initialResumeData: ResumeData = {
  contact: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
  },
  summary: '',
  skills: [],
  experience: [],
  projects: [],
  education: [],
  achievements: [],
};

export const sampleResumeData: ResumeData = {
  contact: {
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '(555) 123-4567',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/janedoe',
    github: 'github.com/janedoe',
    website: '',
  },
  summary: 'Software engineer with 5+ years of experience building scalable web applications. Specialized in React, TypeScript, and cloud infrastructure. Passionate about delivering high-quality, user-centered software solutions.',
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS', 'PostgreSQL', 'Docker', 'GraphQL'],
  experience: [
    {
      id: 'exp-1',
      position: 'Senior Frontend Engineer',
      company: 'TechCorp',
      location: 'San Francisco, CA',
      startDate: 'Jan 2022',
      endDate: 'Present',
      current: true,
      bullets: [
        'Led development of customer dashboard serving 10k+ users daily, reducing load time by 40%',
        'Architected a reusable component library adopted by 3 product teams across the organization',
        'Mentored 3 junior developers through code reviews and pair programming sessions',
        'Drove migration from legacy jQuery codebase to React, improving maintainability by 60%',
      ],
    },
    {
      id: 'exp-2',
      position: 'Frontend Developer',
      company: 'StartupInc',
      location: 'Remote',
      startDate: 'Jun 2020',
      endDate: 'Dec 2021',
      current: false,
      bullets: [
        'Built responsive web application from concept to production using React and TypeScript',
        'Implemented CI/CD pipeline resulting in 30% faster deployment cycles',
        'Collaborated with design team to create accessible, mobile-first UI components',
      ],
    },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'Project Management App',
      description: 'Real-time collaborative project management tool with offline support',
      technologies: ['React', 'TypeScript', 'Firebase', 'Tailwind CSS'],
      link: 'github.com/janedoe/project-app',
      bullets: [
        'Built offline-first PWA with real-time sync across 500+ daily active users',
        'Implemented drag-and-drop Kanban board with optimistic UI updates',
        'Designed and deployed RESTful API endpoints serving 10k+ requests per day',
      ],
    },
    {
      id: 'proj-2',
      name: 'E-commerce Platform',
      description: 'Full-stack e-commerce platform with payment integration',
      technologies: ['Next.js', 'Stripe', 'PostgreSQL', 'Redis'],
      link: 'github.com/janedoe/ecommerce',
      bullets: [
        'Developed complete checkout flow processing $50k+ monthly transactions',
        'Reduced page load time by 55% through image optimization and lazy loading',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'BS Computer Science',
      institution: 'University of California',
      location: 'Berkeley, CA',
      startDate: '2018',
      endDate: '2022',
      gpa: '3.8',
      honors: 'Summa Cum Laude',
    },
  ],
  achievements: [
    {
      id: 'ach-1',
      title: 'AWS Certified Solutions Architect',
      description: 'Amazon Web Services',
      date: '2023',
    },
    {
      id: 'ach-2',
      title: 'Google Cloud Professional Developer',
      description: 'Google Cloud',
      date: '2024',
    },
  ],
};

export const TEMPLATES: { id: TemplateType; name: string; description: string }[] = [
  { id: 'ats-classic', name: 'ATS Classic', description: 'Clean, machine-readable format optimized for applicant tracking systems' },
  { id: 'harvard', name: 'Harvard', description: 'Traditional academic-style format with clear hierarchy' },
  { id: 'jakes', name: "Jake's Style", description: 'Modern single-column layout inspired by Jake\'s popular resume template' },
  { id: 'modern', name: 'Modern Professional', description: 'Contemporary design with refined typography and spacing' },
  { id: 'technical', name: 'Technical SWE', description: 'Engineer-optimized layout with skills prominence' },
];

export const EXPORT_TYPES: { id: ExportType; name: string; description: string }[] = [
  { id: 'ats', name: 'ATS PDF', description: 'Optimized for applicant tracking systems - minimal formatting' },
  { id: 'modern', name: 'Modern PDF', description: 'Professional formatting with balanced whitespace' },
  { id: 'compact', name: 'Compact PDF', description: 'Space-efficient layout fitting more content per page' },
  { id: 'onepage', name: 'One Page PDF', description: 'Aggressively optimized to fit on a single page' },
];
