// Simple resume parser - no API required
// This provides basic functionality for testing without external dependencies

export interface ParsedResume {
  skills: string[];
  experience: {
    company: string;
    position: string;
    duration: string;
    responsibilities: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
  }[];
  companies: string[];
  totalExperienceYears: number;
}

export interface JobRequirements {
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: string;
  education: string;
  jobTitle: string;
  responsibilities: string[];
  companyName?: string;
}

export interface MatchingScore {
  totalScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  companyScore: number;
  breakdown: {
    skillsMatched: string[];
    experienceMatch: boolean;
    educationMatch: boolean;
    companyMatch: boolean;
    companiesMatched: string[];
  };
}

/**
 * Parse resume content using simple text analysis
 */
export async function parseResumeContent(resumeText: string): Promise<ParsedResume> {
  try {
    const text = resumeText.toLowerCase();
    
    // Extract skills using common keywords
    const skills = extractSkills(resumeText);
    
    // Extract experience information
    const experience = extractExperience(resumeText);
    
    // Extract education information
    const education = extractEducation(resumeText);
    
    // Extract company names
    const companies = extractCompanies(resumeText);
    
    // Calculate total experience years
    const totalExperienceYears = calculateExperienceYears(experience);
    
    return {
      skills,
      experience,
      education,
      companies,
      totalExperienceYears
    };
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error(`Resume parsing failed: ${(error as Error).message}`);
  }
}

/**
 * Extract job requirements from job description using simple text analysis
 */
export async function extractJobRequirements(jobData: any): Promise<JobRequirements> {
  try {
    const fullText = `${jobData.title} ${jobData.description} ${jobData.requirements}`.toLowerCase();
    
    // Extract skills from job posting
    const allSkills = extractSkills(fullText);
    
    // Determine which are required vs preferred
    const requiredSkills = allSkills.filter(skill => 
      fullText.includes(`required ${skill}`) || 
      fullText.includes(`must have ${skill}`) ||
      fullText.includes(`essential ${skill}`)
    );
    
    const preferredSkills = allSkills.filter(skill => 
      !requiredSkills.includes(skill) && (
        fullText.includes(`preferred ${skill}`) || 
        fullText.includes(`nice to have ${skill}`) ||
        fullText.includes(`plus ${skill}`)
      )
    );
    
    // If no specific required/preferred found, split skills evenly
    if (requiredSkills.length === 0 && preferredSkills.length === 0) {
      const midpoint = Math.ceil(allSkills.length / 2);
      requiredSkills.push(...allSkills.slice(0, midpoint));
      preferredSkills.push(...allSkills.slice(midpoint));
    }
    
    // Determine experience level
    let experienceLevel = 'mid';
    if (fullText.includes('entry level') || fullText.includes('junior') || fullText.includes('0-2 years')) {
      experienceLevel = 'entry';
    } else if (fullText.includes('senior') || fullText.includes('lead') || fullText.includes('5+ years')) {
      experienceLevel = 'senior';
    }
    
    // Determine education requirement
    let education = 'bachelor';
    if (fullText.includes('high school') || fullText.includes('diploma')) {
      education = 'high_school';
    } else if (fullText.includes('master') || fullText.includes('mba')) {
      education = 'master';
    } else if (fullText.includes('phd') || fullText.includes('doctorate')) {
      education = 'phd';
    }
    
    return {
      requiredSkills,
      preferredSkills,
      experienceLevel,
      education,
      jobTitle: jobData.title,
      responsibilities: extractResponsibilities(fullText),
      companyName: jobData.companyName || jobData.company || '' // Add company name for matching
    };
  } catch (error) {
    console.error('Error extracting job requirements:', error);
    throw new Error(`Job requirements extraction failed: ${(error as Error).message}`);
  }
}

/**
 * Calculate matching score between resume and job requirements
 */
export function calculateMatchingScore(resume: ParsedResume, jobReqs: JobRequirements): MatchingScore {
  let skillsScore = 0;
  let experienceScore = 0;
  let educationScore = 0;
  const skillsMatched: string[] = [];

  // Skills matching (60% of total score = 6 points) - DOMINANT FACTOR
  const allJobSkills = [...jobReqs.requiredSkills, ...jobReqs.preferredSkills];
  const normalizedResumeSkills = resume.skills.map(s => s.toLowerCase());
  
  for (const skill of allJobSkills) {
    const normalizedSkill = skill.toLowerCase();
    if (normalizedResumeSkills.some(resumeSkill => 
        resumeSkill.includes(normalizedSkill) || normalizedSkill.includes(resumeSkill)
    )) {
      skillsMatched.push(skill);
      // Required skills worth more than preferred
      const isRequired = jobReqs.requiredSkills.some(req => req.toLowerCase() === normalizedSkill);
      skillsScore += isRequired ? 0.5 : 0.3;
    }
  }
  skillsScore = Math.min(skillsScore, 6); // Cap at 6 points

  // Experience matching (20% of total score = 2 points)
  const experienceMatch = checkExperienceMatch(resume, jobReqs);
  if (experienceMatch) {
    experienceScore = 2;
  } else {
    // Partial credit based on experience years
    const experienceRatio = Math.min(resume.totalExperienceYears / getRequiredExperienceYears(jobReqs.experienceLevel), 1);
    experienceScore = experienceRatio * 2;
  }

  // Education matching (20% of total score = 2 points)
  const educationMatch = checkEducationMatch(resume, jobReqs);
  if (educationMatch) {
    educationScore = 2;
  } else {
    // Partial credit for higher education - reduced from 3 to proportional
    const partialScore = getEducationPartialScore(resume, jobReqs);
    educationScore = Math.min(partialScore * (2/3), 2); // Scale down to new max
  }

  // Company matching (bonus points for same company experience)
  let companyScore = 0;
  const companiesMatched: string[] = [];
  const companyMatch = checkCompanyMatch(resume, jobReqs);
  if (companyMatch) {
    companyScore = 2; // 2 bonus points for company match
    companiesMatched.push(...getMatchedCompanies(resume, jobReqs));
  }

  const totalScore = Math.round(skillsScore + experienceScore + educationScore + companyScore);

  return {
    totalScore: Math.min(totalScore, 12), // Cap at 12 (10 base + 2 company bonus)
    skillsScore: Math.round(skillsScore),
    experienceScore: Math.round(experienceScore),
    educationScore: Math.round(educationScore),
    companyScore: Math.round(companyScore),
    breakdown: {
      skillsMatched,
      experienceMatch,
      educationMatch,
      companyMatch,
      companiesMatched
    }
  };
}

function checkExperienceMatch(resume: ParsedResume, jobReqs: JobRequirements): boolean {
  const requiredYears = getRequiredExperienceYears(jobReqs.experienceLevel);
  return resume.totalExperienceYears >= requiredYears;
}

function getRequiredExperienceYears(level: string): number {
  switch (level.toLowerCase()) {
    case 'entry': return 0;
    case 'mid': return 3;
    case 'senior': return 7;
    default: return 3;
  }
}

// Helper functions for simple text parsing

function extractSkills(text: string): string[] {
  const commonSkills = [
    'javascript', 'python', 'java', 'react', 'nodejs', 'typescript', 'html', 'css',
    'sql', 'postgresql', 'mysql', 'mongodb', 'aws', 'docker', 'kubernetes', 'git',
    'angular', 'vue', 'express', 'spring', 'django', 'flask', 'bootstrap', 'tailwind',
    'redux', 'graphql', 'rest api', 'microservices', 'agile', 'scrum', 'ci/cd',
    'linux', 'windows', 'macos', 'azure', 'gcp', 'firebase', 'redis', 'elasticsearch',
    'jenkins', 'terraform', 'ansible', 'webpack', 'babel', 'jest', 'cypress',
    'figma', 'photoshop', 'sketch', 'adobe', 'ui/ux', 'responsive design',
    'machine learning', 'data science', 'pandas', 'numpy', 'tensorflow', 'pytorch',
    'php', 'laravel', 'symfony', 'wordpress', 'drupal', 'magento', 'shopify',
    'c++', 'c#', '.net', 'unity', 'unreal', 'ios', 'android', 'swift', 'kotlin',
    'flutter', 'dart', 'go', 'rust', 'scala', 'ruby', 'rails', 'perl'
  ];
  
  const foundSkills: string[] = [];
  const lowerText = text.toLowerCase();
  
  commonSkills.forEach(skill => {
    if (lowerText.includes(skill)) {
      foundSkills.push(skill);
    }
  });
  
  return [...new Set(foundSkills)]; // Remove duplicates
}

function extractExperience(text: string): any[] {
  const experience: any[] = [];
  const lines = text.split('\n');
  
  // Look for company patterns
  const companyPatterns = [
    /at\s+([A-Z][a-zA-Z\s&,.]+)/g,
    /worked\s+at\s+([A-Z][a-zA-Z\s&,.]+)/g,
    /employed\s+by\s+([A-Z][a-zA-Z\s&,.]+)/g
  ];
  
  // Look for date patterns
  const datePatterns = [
    /(\d{4})\s*-\s*(\d{4})/g,
    /(\d{4})\s*to\s*(\d{4})/g,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}/gi
  ];
  
  lines.forEach(line => {
    companyPatterns.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        const company = matches[0].replace(/at\s+|worked\s+at\s+|employed\s+by\s+/i, '').trim();
        
        // Look for position in the same or nearby lines
        const position = extractPosition(line) || 'Software Developer';
        
        // Look for duration
        const duration = extractDuration(line) || '1-2 years';
        
        experience.push({
          company,
          position,
          duration,
          responsibilities: ['Software development', 'Project collaboration']
        });
      }
    });
  });
  
  // If no experience found, create a basic entry
  if (experience.length === 0) {
    experience.push({
      company: 'Previous Company',
      position: 'Software Developer',
      duration: '2-3 years',
      responsibilities: ['Software development', 'Team collaboration']
    });
  }
  
  return experience;
}

function extractEducation(text: string): any[] {
  const education: any[] = [];
  const lowerText = text.toLowerCase();
  
  const degreePatterns = [
    { pattern: /bachelor.*computer science/i, degree: 'Bachelor of Science in Computer Science' },
    { pattern: /master.*computer science/i, degree: 'Master of Science in Computer Science' },
    { pattern: /bachelor.*engineering/i, degree: 'Bachelor of Engineering' },
    { pattern: /master.*engineering/i, degree: 'Master of Engineering' },
    { pattern: /bachelor.*information technology/i, degree: 'Bachelor of Information Technology' },
    { pattern: /bachelor.*software/i, degree: 'Bachelor of Software Engineering' },
    { pattern: /phd/i, degree: 'Doctor of Philosophy' },
    { pattern: /bachelor/i, degree: 'Bachelor Degree' },
    { pattern: /master/i, degree: 'Master Degree' }
  ];
  
  degreePatterns.forEach(({ pattern, degree }) => {
    if (pattern.test(text)) {
      education.push({
        degree,
        institution: 'University',
        year: '2020',
        gpa: '3.5'
      });
    }
  });
  
  // If no education found, add a default
  if (education.length === 0) {
    education.push({
      degree: 'Bachelor of Computer Science',
      institution: 'University',
      year: '2020',
      gpa: '3.5'
    });
  }
  
  return education;
}

function extractCompanies(text: string): string[] {
  const companies: string[] = [];
  const lines = text.split('\n');
  
  // Enhanced patterns to catch more company formats including PayPal, Google, etc.
  const companyPatterns = [
    /(?:at|@)\s+([A-Z][a-zA-Z\s&,.]+(?:Inc|LLC|Corp|Corporation|Ltd|Limited|Company|Co\.|Technologies|Tech|Systems|Solutions)?)/gi,
    /worked\s+(?:at|for)\s+([A-Z][a-zA-Z\s&,.]+(?:Inc|LLC|Corp|Corporation|Ltd|Limited|Company|Co\.|Technologies|Tech|Systems|Solutions)?)/gi,
    /employed\s+(?:at|by)\s+([A-Z][a-zA-Z\s&,.]+(?:Inc|LLC|Corp|Corporation|Ltd|Limited|Company|Co\.|Technologies|Tech|Systems|Solutions)?)/gi,
    /(?:^|\s)([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]*)*)\s*[-–—]\s*(?:Software|Engineer|Developer|Analyst|Manager|Lead|Senior|Junior)/gm,
    // Specific patterns for well-known companies
    /\b(PayPal|Google|Microsoft|Amazon|Apple|Facebook|Netflix|Tesla|Adobe|Oracle|IBM|Intel|Cisco|VMware)\b/gi,
    /\b([A-Z][a-zA-Z]+)\s*(?:Inc|LLC|Corp|Corporation|Ltd|Limited|Company|Co\.|Technologies|Tech|Systems|Solutions)\b/gi
  ];
  
  lines.forEach(line => {
    companyPatterns.forEach(pattern => {
      const matches = Array.from(line.matchAll(pattern));
      matches.forEach(match => {
        if (match[1] && match[1].trim().length > 2) {
          const company = match[1].trim()
            .replace(/[,.\-–—]+$/, '') // Remove trailing punctuation
            .replace(/^\s*[-–—]+\s*/, ''); // Remove leading dashes
          
          if (company.length >= 3 && !company.match(/^\d+$/)) {
            companies.push(company);
          }
        }
      });
    });
  });
  
  return [...new Set(companies)]; // Remove duplicates
}

function extractPosition(text: string): string | null {
  const positionPatterns = [
    /software\s+engineer/i,
    /software\s+developer/i,
    /full\s+stack\s+developer/i,
    /frontend\s+developer/i,
    /backend\s+developer/i,
    /web\s+developer/i,
    /senior\s+developer/i,
    /junior\s+developer/i,
    /team\s+lead/i,
    /technical\s+lead/i
  ];
  
  for (const pattern of positionPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

function extractDuration(text: string): string | null {
  const durationPatterns = [
    /(\d+)\s*years?/i,
    /(\d{4})\s*-\s*(\d{4})/,
    /(\d{4})\s*to\s*(\d{4})/i
  ];
  
  for (const pattern of durationPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

function calculateExperienceYears(experience: any[]): number {
  let totalYears = 0;
  
  experience.forEach(exp => {
    const duration = exp.duration.toLowerCase();
    
    if (duration.includes('year')) {
      const yearMatch = duration.match(/(\d+)\s*years?/);
      if (yearMatch) {
        totalYears += parseInt(yearMatch[1]);
      }
    } else if (duration.includes('-')) {
      const dates = duration.match(/(\d{4})\s*-\s*(\d{4})/);
      if (dates) {
        totalYears += parseInt(dates[2]) - parseInt(dates[1]);
      }
    } else {
      // Default to 2 years if unclear
      totalYears += 2;
    }
  });
  
  return totalYears;
}

function extractResponsibilities(text: string): string[] {
  const responsibilities = [];
  
  if (text.includes('develop')) responsibilities.push('Software development');
  if (text.includes('design')) responsibilities.push('System design');
  if (text.includes('test')) responsibilities.push('Testing and QA');
  if (text.includes('manage')) responsibilities.push('Project management');
  if (text.includes('lead')) responsibilities.push('Team leadership');
  if (text.includes('collaborate')) responsibilities.push('Team collaboration');
  
  return responsibilities.length > 0 ? responsibilities : ['Software development', 'Team collaboration'];
}

function checkEducationMatch(resume: ParsedResume, jobReqs: JobRequirements): boolean {
  const educationLevels: Record<string, number> = {
    'high_school': 1,
    'bachelor': 2,
    'master': 3,
    'phd': 4
  };

  const requiredLevel = educationLevels[jobReqs.education] || 2;
  const hasMatchingEducation = resume.education.some(edu => {
    const degree = edu.degree.toLowerCase();
    if (degree.includes('phd') || degree.includes('doctorate')) return 4 >= requiredLevel;
    if (degree.includes('master') || degree.includes('mba')) return 3 >= requiredLevel;
    if (degree.includes('bachelor')) return 2 >= requiredLevel;
    if (degree.includes('high school') || degree.includes('diploma')) return 1 >= requiredLevel;
    return false;
  });

  return hasMatchingEducation;
}

function getEducationPartialScore(resume: ParsedResume, jobReqs: JobRequirements): number {
  const educationLevels: Record<string, number> = {
    'high_school': 1,
    'bachelor': 2,
    'master': 3,
    'phd': 4
  };

  const requiredLevel = educationLevels[jobReqs.education] || 2;
  let maxResumeLevel = 0;

  resume.education.forEach(edu => {
    const degree = edu.degree.toLowerCase();
    if (degree.includes('phd') || degree.includes('doctorate')) maxResumeLevel = Math.max(maxResumeLevel, 4);
    else if (degree.includes('master') || degree.includes('mba')) maxResumeLevel = Math.max(maxResumeLevel, 3);
    else if (degree.includes('bachelor')) maxResumeLevel = Math.max(maxResumeLevel, 2);
    else if (degree.includes('high school') || degree.includes('diploma')) maxResumeLevel = Math.max(maxResumeLevel, 1);
  });

  // Give partial credit if education level is close but not exact match
  if (maxResumeLevel >= requiredLevel) return 3;
  if (maxResumeLevel === requiredLevel - 1) return 1.5;
  return 0;
}

function checkCompanyMatch(resume: ParsedResume, jobReqs: JobRequirements): boolean {
  // Extract company name from job requirements (assuming it's passed in jobReqs)
  const jobCompany = (jobReqs as any).companyName?.toLowerCase() || '';
  
  if (!jobCompany) return false;
  
  // Normalize company names by removing common suffixes
  const normalizeCompanyName = (name: string): string => {
    return name.toLowerCase()
      .replace(/\s*(inc|llc|corp|corporation|ltd|limited|company|co\.|technologies|tech|systems|solutions)\b/gi, '')
      .replace(/[.,\-–—]/g, '')
      .trim();
  };
  
  const normalizedJobCompany = normalizeCompanyName(jobCompany);
  
  // Check if any of the resume companies match the job company
  return resume.companies.some(company => {
    const normalizedResumeCompany = normalizeCompanyName(company);
    
    // Direct match after normalization
    if (normalizedResumeCompany === normalizedJobCompany) return true;
    
    // Check if one contains the other
    if (normalizedResumeCompany.includes(normalizedJobCompany) || 
        normalizedJobCompany.includes(normalizedResumeCompany)) return true;
    
    // Check for partial matches for longer company names
    if (normalizedResumeCompany.length >= 4 && normalizedJobCompany.length >= 4) {
      const resumeWords = normalizedResumeCompany.split(/\s+/);
      const jobWords = normalizedJobCompany.split(/\s+/);
      
      // Check if any significant word matches (length >= 4)
      return resumeWords.some(resumeWord => 
        resumeWord.length >= 4 && jobWords.some(jobWord => 
          jobWord.length >= 4 && (resumeWord === jobWord || 
          resumeWord.includes(jobWord) || jobWord.includes(resumeWord))
        )
      );
    }
    
    return false;
  });
}

function getMatchedCompanies(resume: ParsedResume, jobReqs: JobRequirements): string[] {
  const jobCompany = (jobReqs as any).companyName?.toLowerCase() || '';
  
  if (!jobCompany) return [];
  
  // Use the same normalization logic as checkCompanyMatch
  const normalizeCompanyName = (name: string): string => {
    return name.toLowerCase()
      .replace(/\s*(inc|llc|corp|corporation|ltd|limited|company|co\.|technologies|tech|systems|solutions)\b/gi, '')
      .replace(/[.,\-–—]/g, '')
      .trim();
  };
  
  const normalizedJobCompany = normalizeCompanyName(jobCompany);
  
  return resume.companies.filter(company => {
    const normalizedResumeCompany = normalizeCompanyName(company);
    
    // Direct match after normalization
    if (normalizedResumeCompany === normalizedJobCompany) return true;
    
    // Check if one contains the other
    if (normalizedResumeCompany.includes(normalizedJobCompany) || 
        normalizedJobCompany.includes(normalizedResumeCompany)) return true;
    
    // Check for partial matches for longer company names
    if (normalizedResumeCompany.length >= 4 && normalizedJobCompany.length >= 4) {
      const resumeWords = normalizedResumeCompany.split(/\s+/);
      const jobWords = normalizedJobCompany.split(/\s+/);
      
      // Check if any significant word matches (length >= 4)
      return resumeWords.some(resumeWord => 
        resumeWord.length >= 4 && jobWords.some(jobWord => 
          jobWord.length >= 4 && (resumeWord === jobWord || 
          resumeWord.includes(jobWord) || jobWord.includes(resumeWord))
        )
      );
    }
    
    return false;
  });
}

/**
 * Read resume file content (supports text and PDF parsing)
 */
export async function readResumeFile(filePath: string): Promise<string> {
  const fs = await import('fs');
  const path = await import('path');
  
  const fileExtension = path.extname(filePath).toLowerCase();
  
  try {
    if (fileExtension === '.txt') {
      return fs.readFileSync(filePath, 'utf-8');
    } else if (fileExtension === '.pdf') {
      // For PDF parsing, we'll use a basic text extraction
      try {
        const pdfParse = await import('pdf-parse');
        const pdfBuffer = fs.readFileSync(filePath);
        const data = await pdfParse.default(pdfBuffer);
        return data.text;
      } catch (pdfError) {
        console.error('PDF parsing failed, treating as text:', pdfError);
        // Fallback to treating as text file
        return fs.readFileSync(filePath, 'utf-8');
      }
    } else {
      // For other formats, try reading as text
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (error) {
    throw new Error(`Failed to read resume file: ${(error as Error).message}`);
  }
}