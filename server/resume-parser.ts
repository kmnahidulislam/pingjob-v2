import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY environment variable must be set");
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// The newest Anthropic model is "claude-sonnet-4-20250514"
const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";

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
}

export interface MatchingScore {
  totalScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  breakdown: {
    skillsMatched: string[];
    experienceMatch: boolean;
    educationMatch: boolean;
  };
}

/**
 * Parse resume content using Claude AI
 */
export async function parseResumeContent(resumeText: string): Promise<ParsedResume> {
  try {
    const prompt = `
Please analyze this resume and extract structured information. Return ONLY a valid JSON object with this exact structure:

{
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "duration": "2020-2023",
      "responsibilities": ["responsibility1", "responsibility2"]
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University Name",
      "year": "2020",
      "gpa": "3.8"
    }
  ],
  "companies": ["Company1", "Company2"],
  "totalExperienceYears": 5
}

Resume content:
${resumeText}

Important: 
- Extract all technical skills, programming languages, frameworks, tools
- Calculate total experience years from all positions
- Include all companies worked at
- Return only valid JSON, no additional text or explanations
`;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL_STR,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const jsonText = response.content[0].text;
    const parsed = JSON.parse(jsonText);
    
    // Validate and sanitize the response
    return {
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      companies: Array.isArray(parsed.companies) ? parsed.companies : [],
      totalExperienceYears: typeof parsed.totalExperienceYears === 'number' ? parsed.totalExperienceYears : 0
    };
  } catch (error) {
    console.error('Error parsing resume with Claude:', error);
    throw new Error(`Resume parsing failed: ${error.message}`);
  }
}

/**
 * Extract job requirements from job description
 */
export async function extractJobRequirements(jobData: any): Promise<JobRequirements> {
  try {
    const prompt = `
Analyze this job posting and extract requirements. Return ONLY a valid JSON object:

{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill1", "skill2"],
  "experienceLevel": "entry|mid|senior",
  "education": "high_school|bachelor|master|phd",
  "jobTitle": "Job Title",
  "responsibilities": ["responsibility1", "responsibility2"]
}

Job Data:
Title: ${jobData.title}
Description: ${jobData.description}
Requirements: ${jobData.requirements}
Experience Level: ${jobData.experienceLevel}

Extract:
- Required skills (must-have technical skills)
- Preferred skills (nice-to-have skills) 
- Experience level (entry/mid/senior)
- Education requirement
- Key responsibilities

Return only valid JSON.
`;

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL_STR,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const jsonText = response.content[0].text;
    const parsed = JSON.parse(jsonText);

    return {
      requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills : [],
      preferredSkills: Array.isArray(parsed.preferredSkills) ? parsed.preferredSkills : [],
      experienceLevel: parsed.experienceLevel || 'mid',
      education: parsed.education || 'bachelor',
      jobTitle: parsed.jobTitle || jobData.title,
      responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : []
    };
  } catch (error) {
    console.error('Error extracting job requirements:', error);
    throw new Error(`Job requirements extraction failed: ${error.message}`);
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

  // Skills matching (40% of total score = 4 points)
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
      skillsScore += isRequired ? 0.3 : 0.2;
    }
  }
  skillsScore = Math.min(skillsScore, 4); // Cap at 4 points

  // Experience matching (30% of total score = 3 points)
  const experienceMatch = checkExperienceMatch(resume, jobReqs);
  if (experienceMatch) {
    experienceScore = 3;
  } else {
    // Partial credit based on experience years
    const experienceRatio = Math.min(resume.totalExperienceYears / getRequiredExperienceYears(jobReqs.experienceLevel), 1);
    experienceScore = experienceRatio * 3;
  }

  // Education matching (30% of total score = 3 points)
  const educationMatch = checkEducationMatch(resume, jobReqs);
  if (educationMatch) {
    educationScore = 3;
  } else {
    // Partial credit for higher education
    educationScore = getEducationPartialScore(resume, jobReqs);
  }

  const totalScore = Math.round(skillsScore + experienceScore + educationScore);

  return {
    totalScore: Math.min(totalScore, 10), // Cap at 10
    skillsScore: Math.round(skillsScore),
    experienceScore: Math.round(experienceScore),
    educationScore: Math.round(educationScore),
    breakdown: {
      skillsMatched,
      experienceMatch,
      educationMatch
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

function checkEducationMatch(resume: ParsedResume, jobReqs: JobRequirements): boolean {
  const educationLevels = {
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
  const educationLevels = {
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
      // In production, you might want to use a more sophisticated PDF parser
      const pdfParse = await import('pdf-parse');
      const pdfBuffer = fs.readFileSync(filePath);
      const data = await pdfParse.default(pdfBuffer);
      return data.text;
    } else {
      // For other formats, try reading as text
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (error) {
    throw new Error(`Failed to read resume file: ${error.message}`);
  }
}