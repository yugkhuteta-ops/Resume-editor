import { useState } from 'react';
import type { ResumeData } from '../types';
import { AlertCircle, AlertTriangle, Info, CheckCircle, Search, Plus } from 'lucide-react';

interface ATSIssue {
  type: 'error' | 'warning' | 'info' | 'pass';
  section: string;
  message: string;
  detail?: string;
}

const WEAK_VERBS = [
  'helped', 'worked', 'did', 'made', 'got', 'was', 'were',
  'assisted', 'participated', 'involved', 'responsible for',
  'handled', 'managed', 'performed', 'provided', 'supported',
  'been', 'been involved', 'tasked with', 'duties included',
];

const STRONG_VERBS = [
  'achieved', 'delivered', 'developed', 'implemented', 'launched',
  'optimized', 'designed', 'architected', 'led', 'drove',
  'established', 'created', 'built', 'engineered', 'increased',
  'reduced', 'improved', 'transformed', 'generated', 'spearheaded',
];

const COMMON_REQUIRED_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Python', 'Java', 'SQL',
  'Node.js', 'AWS', 'Docker', 'Git', 'CI/CD', 'Agile', 'REST',
  'GraphQL', 'PostgreSQL', 'MongoDB', 'CSS', 'HTML', 'Redux',
  'Kubernetes', 'Terraform', 'Go', 'Rust', 'Ruby', 'PHP',
  'Angular', 'Vue', 'Svelte', 'Next.js', 'Express', 'Django',
  'Flask', 'Spring', 'API', 'Microservices', 'Cloud', 'Azure',
  'GCP', 'Linux', 'DevOps', 'Testing', 'Jest', 'Cypress',
];

export function ATSAnalyzer({ resumeData }: { resumeData: ResumeData }) {
  const [jobDescription, setJobDescription] = useState('');
  const [showJobInput, setShowJobInput] = useState(false);
  const [keywordMatches, setKeywordMatches] = useState<{ found: string[]; missing: string[] } | null>(null);

  const issues: ATSIssue[] = [];

  // Contact check
  if (!resumeData.contact.fullName) {
    issues.push({ type: 'error', section: 'Contact', message: 'Missing full name', detail: 'Your name is essential for any application.' });
  }
  if (!resumeData.contact.email) {
    issues.push({ type: 'error', section: 'Contact', message: 'Missing email address', detail: 'Recruiters need a way to reach you.' });
  }
  if (!resumeData.contact.phone) {
    issues.push({ type: 'warning', section: 'Contact', message: 'Missing phone number', detail: 'Many recruiters prefer to call candidates.' });
  }
  if (!resumeData.contact.location) {
    issues.push({ type: 'info', section: 'Contact', message: 'Missing location', detail: 'Helps with location-based filtering.' });
  }
  if (resumeData.contact.email && !resumeData.contact.email.includes('@')) {
    issues.push({ type: 'error', section: 'Contact', message: 'Invalid email format', detail: 'Ensure your email is correctly formatted.' });
  }

  // Summary check
  if (!resumeData.summary) {
    issues.push({ type: 'warning', section: 'Summary', message: 'Professional summary is missing', detail: 'A strong summary helps recruiters quickly understand your profile.' });
  } else if (resumeData.summary.length < 80) {
    issues.push({ type: 'info', section: 'Summary', message: 'Summary is too short', detail: 'Aim for 2-4 sentences (80-200 characters).' });
  } else if (resumeData.summary.length > 400) {
    issues.push({ type: 'info', section: 'Summary', message: 'Summary is quite long', detail: 'Consider keeping it concise (under 400 characters).' });
  } else {
    issues.push({ type: 'pass', section: 'Summary', message: 'Summary looks good' });
  }

  // Skills check
  if (resumeData.skills.length === 0) {
    issues.push({ type: 'warning', section: 'Skills', message: 'No skills listed', detail: 'Add relevant technical and soft skills.' });
  } else if (resumeData.skills.length < 5) {
    issues.push({ type: 'info', section: 'Skills', message: `Only ${resumeData.skills.length} skills listed`, detail: 'Aim for 8-15 relevant skills.' });
  } else if (resumeData.skills.length > 20) {
    issues.push({ type: 'info', section: 'Skills', message: `${resumeData.skills.length} skills listed`, detail: 'Consider focusing on the most relevant skills (15 max recommended).' });
  } else {
    issues.push({ type: 'pass', section: 'Skills', message: `${resumeData.skills.length} skills listed` });
  }

  // Check for common missing skills
  const resumeText = [
    resumeData.summary,
    ...resumeData.skills,
    ...resumeData.experience.flatMap(e => [e.position, e.company, ...e.bullets]),
    ...resumeData.projects.flatMap(p => [p.name, p.description, ...p.technologies, ...p.bullets]),
    ...resumeData.education.flatMap(e => [e.degree, e.institution]),
    ...resumeData.achievements.flatMap(a => [a.title, a.description]),
  ].join(' ').toLowerCase();

  const missingCommonSkills = COMMON_REQUIRED_SKILLS.filter(
    skill => !resumeText.includes(skill.toLowerCase())
  );

  if (resumeData.skills.length > 0 && missingCommonSkills.length === COMMON_REQUIRED_SKILLS.length) {
    issues.push({ type: 'info', section: 'Skills', message: 'No common ATS keywords detected', detail: 'Add industry-standard skills to improve ATS matching.' });
  }

  // Experience checks
  if (resumeData.experience.length === 0) {
    issues.push({ type: 'warning', section: 'Experience', message: 'No experience entries', detail: 'Add work experience to strengthen your resume.' });
  } else {
    const allBullets = resumeData.experience.flatMap(e => e.bullets);
    const totalBullets = allBullets.length;

    if (totalBullets === 0) {
      issues.push({ type: 'warning', section: 'Experience', message: 'No bullet points in experience', detail: 'Add quantifiable achievements to each role.' });
    } else if (totalBullets < 6) {
      issues.push({ type: 'info', section: 'Experience', message: `Only ${totalBullets} bullet points total`, detail: 'Aim for 3-5 bullet points per role.' });
    }

    let metricsCount = 0;
    let weakVerbCount = 0;
    let strongVerbCount = 0;
    const seenBullets = new Set<string>();
    let duplicateCount = 0;

    resumeData.experience.forEach((exp, i) => {
      if (exp.bullets.length === 0) {
        issues.push({ type: 'warning', section: `Exp: ${exp.position || `#${i + 1}`}`, message: 'No bullet points', detail: 'Add achievements and responsibilities.' });
        return;
      }

      exp.bullets.forEach(bullet => {
        if (/\d/.test(bullet)) metricsCount++;

        const words = bullet.toLowerCase().split(/\s+/);
        if (WEAK_VERBS.some(v => words.includes(v) || bullet.toLowerCase().startsWith(v))) {
          weakVerbCount++;
        }
        if (STRONG_VERBS.some(v => words.includes(v) || bullet.toLowerCase().startsWith(v))) {
          strongVerbCount++;
        }

        const normalized = bullet.toLowerCase().trim();
        if (seenBullets.has(normalized)) {
          duplicateCount++;
        }
        seenBullets.add(normalized);

        // Check for quantification
        const hasPercentage = /[\d.]%/.test(bullet);
        const hasDollar = /\$[\d]/.test(bullet);
        const hasTimeframe = /\b(daily|weekly|monthly|quarterly|annually|per year|per month)\b/i.test(bullet);
        if (!hasPercentage && !hasDollar && !hasTimeframe) {
          // Soft flag - only mark if many bullets lack metrics
        }
      });
    });

    if (metricsCount === 0 && totalBullets > 0) {
      issues.push({ type: 'info', section: 'Experience', message: 'No metrics found in bullets', detail: 'Add numbers (%, $, time saved, users impacted) to strengthen impact.' });
    } else if (metricsCount > 0) {
      const pct = Math.round((metricsCount / totalBullets) * 100);
      issues.push({ type: pct >= 50 ? 'pass' : 'info', section: 'Experience', message: `${metricsCount}/${totalBullets} bullets contain metrics (${pct}%)` });
    }

    if (weakVerbCount > 0) {
      issues.push({ type: 'info', section: 'Experience', message: `${weakVerbCount} weak verb(s) detected`, detail: `Replace weak verbs like "helped", "worked" with stronger alternatives.` });
    }

    if (duplicateCount > 0) {
      issues.push({ type: 'info', section: 'Experience', message: `${duplicateCount} duplicate bullet(s)`, detail: 'Remove repeated content across positions.' });
    }

    if (strongVerbCount > 0) {
      issues.push({ type: 'pass', section: 'Experience', message: `${strongVerbCount} strong action verb(s) used` });
    }

    resumeData.experience.forEach(exp => {
      if (!exp.position) {
        issues.push({ type: 'warning', section: 'Experience', message: 'Missing job title', detail: 'Each role needs a position title.' });
      }
      if (!exp.company) {
        issues.push({ type: 'warning', section: 'Experience', message: 'Missing company name', detail: 'Each role needs a company/organization.' });
      }
      if (exp.bullets.length > 0 && exp.bullets.every(b => b.length < 30)) {
        issues.push({ type: 'info', section: `Exp: ${exp.position || 'Role'}`, message: 'Bullet points too short', detail: 'Aim for 30-150 characters per bullet with specific details.' });
      }
    });
  }

  // Projects checks
  if (resumeData.projects.length === 0) {
    issues.push({ type: 'info', section: 'Projects', message: 'No projects listed', detail: 'Projects showcase hands-on skills.' });
  } else {
    const projectBullets = resumeData.projects.flatMap(p => p.bullets);
    const projectMetrics = projectBullets.filter(b => /\d/.test(b)).length;

    if (projectBullets.length > 0 && projectMetrics === 0) {
      issues.push({ type: 'info', section: 'Projects', message: 'Project bullets lack metrics', detail: 'Add impact numbers to project descriptions.' });
    }

    resumeData.projects.forEach(p => {
      if (!p.name) {
        issues.push({ type: 'warning', section: 'Projects', message: 'Unnamed project', detail: 'Each project needs a name.' });
      }
    });
  }

  // Education checks
  if (resumeData.education.length === 0) {
    issues.push({ type: 'info', section: 'Education', message: 'No education listed', detail: 'Include your educational background.' });
  } else {
    resumeData.education.forEach(edu => {
      if (!edu.degree) {
        issues.push({ type: 'warning', section: 'Education', message: 'Missing degree info', detail: 'Specify your degree or field of study.' });
      }
      if (!edu.institution) {
        issues.push({ type: 'warning', section: 'Education', message: 'Missing institution', detail: 'Include the school or university name.' });
      }
    });
  }

  // Achievements checks
  if (resumeData.achievements.length === 0) {
    issues.push({ type: 'info', section: 'Achievements', message: 'No achievements listed', detail: 'Certifications and awards add credibility.' });
  }

  // Quantification analysis
  const allText = [
    resumeData.summary,
    ...resumeData.skills,
    ...resumeData.experience.flatMap(e => [e.position, e.company, ...e.bullets]),
    ...resumeData.projects.flatMap(p => [p.name, ...p.bullets]),
    ...resumeData.education.flatMap(e => [e.degree]),
  ].join(' ');

  const metricPatterns = [
    { pattern: /\d+%/, label: 'percentages' },
    { pattern: /\$\d+[,.\dk]*(?:k|K|M|B|m|b)?/, label: 'monetary values' },
    { pattern: /\d+\s*(?:users|customers|clients|people|employees|students|members)/i, label: 'user numbers' },
    { pattern: /\d+\s*(?:hours|days|weeks|months)/i, label: 'time metrics' },
    { pattern: /\d+\s*(?:sites|pages|features|components|services|APIs)/i, label: 'scale numbers' },
  ];

  const metricsFound = metricPatterns.filter(m => m.pattern.test(allText));
  if (metricsFound.length < 2 && resumeData.experience.length > 0) {
    issues.push({ type: 'info', section: 'Quantification', message: 'Add more quantified impact', detail: 'Metrics found: ' + (metricsFound.length > 0 ? metricsFound.map(m => m.label).join(', ') : 'none') + '. Aim for 3+ different metric types.' });
  }

  // Score calculation
  const errors = issues.filter(i => i.type === 'error').length;
  const warnings = issues.filter(i => i.type === 'warning').length;
  const infos = issues.filter(i => i.type === 'info').length;
  const passes = issues.filter(i => i.type === 'pass').length;

  const score = Math.min(100, Math.max(0, 100 - errors * 20 - warnings * 8 - infos * 3 + passes * 2));

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = () => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />;
      case 'warning': return <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />;
      case 'info': return <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />;
      case 'pass': return <CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" />;
      default: return null;
    }
  };

  const getIssueStyle = (type: string) => {
    switch (type) {
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-amber-200 bg-amber-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      case 'pass': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const analyzeKeywords = () => {
    if (!jobDescription.trim()) return;
    const jd = jobDescription.toLowerCase();
    const words = jd.split(/\W+/).filter(w => w.length > 2);

    // Extract meaningful keywords (skip common words)
    const stopWords = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'from', 'your', 'have', 'will', 'are', 'our', 'about', 'their', 'what', 'when', 'more', 'been', 'would', 'they', 'them', 'also', 'other', 'than']);
    const keywords = [...new Set(words.filter(w => !stopWords.has(w) && w.length > 2))];

    const resumeText = [
      resumeData.summary,
      ...resumeData.skills,
      ...resumeData.experience.flatMap(e => [e.position, e.company, ...e.bullets]),
      ...resumeData.projects.flatMap(p => [p.name, p.description, ...p.technologies, ...p.bullets]),
      ...resumeData.education.flatMap(e => [e.degree, e.institution]),
      ...resumeData.achievements.flatMap(a => [a.title, a.description]),
    ].join(' ').toLowerCase();

    const found: string[] = [];
    const missing: string[] = [];

    keywords.forEach(keyword => {
      if (resumeText.includes(keyword)) {
        found.push(keyword);
      } else {
        missing.push(keyword);
      }
    });

    setKeywordMatches({ found, missing });
  };

  return (
    <div className="space-y-3">
      {/* Score */}
      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${getScoreBg()}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">ATS Score</span>
          <span className={`text-xl font-bold ${getScoreColor()}`}>{score}</span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">
          {errors > 0 ? `${errors} critical` : warnings > 0 ? `${warnings} warnings` : `${passes} checks passed`}
        </span>
      </div>

      {/* Job Description Keyword Matching */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowJobInput(!showJobInput)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search size={14} />
            <span className="font-medium">Job Description Match</span>
          </div>
          <Plus size={14} className={`transition-transform ${showJobInput ? 'rotate-45' : ''}`} />
        </button>
        {showJobInput && (
          <div className="px-3 pb-3 pt-1 border-t border-gray-200">
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste a job description to check keyword match rate..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mb-2"
              rows={4}
            />
            <button
              onClick={analyzeKeywords}
              disabled={!jobDescription.trim()}
              className="w-full px-3 py-1.5 bg-primary-500 text-white text-xs rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Analyze Keywords
            </button>
            {keywordMatches && (
              <div className="mt-2 space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-green-700">Found ({keywordMatches.found.length})</span>
                    <span className="text-[11px] text-gray-400">
                      {Math.round((keywordMatches.found.length / (keywordMatches.found.length + keywordMatches.missing.length)) * 100)}% match
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {keywordMatches.found.map((kw, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] rounded">{kw}</span>
                    ))}
                    {keywordMatches.found.length === 0 && <span className="text-[11px] text-gray-400 italic">No keywords matched</span>}
                  </div>
                </div>
                {keywordMatches.missing.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-red-700">Missing ({keywordMatches.missing.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {keywordMatches.missing.slice(0, 20).map((kw, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-red-100 text-red-800 text-[10px] rounded">{kw}</span>
                      ))}
                      {keywordMatches.missing.length > 20 && (
                        <span className="text-[10px] text-gray-400 italic">+{keywordMatches.missing.length - 20} more...</span>
                      )}
                    </div>
                    <p className="text-[11px] text-amber-700 mt-1">
                      Consider adding these keywords to your skills, summary, or experience bullets.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Issues */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {issues.map((issue, i) => (
          <div key={i} className={`flex items-start gap-2 px-2.5 py-1.5 rounded-md border ${getIssueStyle(issue.type)}`}>
            {getIssueIcon(issue.type)}
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-medium text-gray-500 uppercase shrink-0">{issue.section}</span>
                <span className={`text-xs ${
                  issue.type === 'error' ? 'text-red-800' :
                  issue.type === 'warning' ? 'text-amber-800' :
                  issue.type === 'pass' ? 'text-green-800' :
                  'text-blue-800'
                }`}>
                  {issue.message}
                </span>
              </div>
              {issue.detail && (
                <p className="text-[11px] text-gray-500 mt-0.5">{issue.detail}</p>
              )}
            </div>
          </div>
        ))}

        {issues.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">
            No issues found. Your resume looks great!
          </p>
        )}
      </div>

      {/* Strength Summary */}
      <div className="border-t border-gray-200 pt-2">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="font-medium text-gray-700">Resume Strength:</span>
          <span className={score >= 80 ? 'text-green-600 font-medium' : score >= 60 ? 'text-amber-600 font-medium' : 'text-red-600 font-medium'}>
            {score >= 80 ? 'Strong' : score >= 60 ? 'Needs Work' : 'Needs Significant Improvement'}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-gray-400">
          {errors > 0 ? `${errors} critical issues to fix. ` : ''}
          {warnings > 0 ? `${warnings} warnings to address. ` : ''}
          {score >= 80 ? 'Your resume is well-optimized for ATS.' : 'Improvements will increase your interview chances.'}
        </div>
      </div>
    </div>
  );
}
