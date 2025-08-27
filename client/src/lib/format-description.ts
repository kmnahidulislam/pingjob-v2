// Format job description - handle JSON arrays or strings
export const formatDescription = (description: any): string => {
  if (!description) return 'No description available';
  
  // If it's an array, join with spaces and clean up
  if (Array.isArray(description)) {
    return description.join(' ').replace(/["\[\]]/g, '').trim();
  }
  
  // If it's a string that looks like JSON, try to parse and format
  if (typeof description === 'string') {
    try {
      const parsed = JSON.parse(description);
      if (Array.isArray(parsed)) {
        return parsed.join(' ').replace(/["\[\]]/g, '').trim();
      }
    } catch {
      // If parsing fails, just clean up the string
      return description.replace(/["\[\]]/g, '').trim();
    }
  }
  
  return String(description).replace(/["\[\]]/g, '').trim();
};

// Format skills array - handle JSON strings or arrays  
export const formatSkills = (skills: any): string[] => {
  if (!skills) return [];
  
  let skillsArray: string[] = [];
  
  // If it's already an array, use as is
  if (Array.isArray(skills)) {
    skillsArray = skills.map(skill => String(skill).replace(/["\[\]]/g, '').trim()).filter(Boolean);
  }
  // If it's a string that looks like JSON, try to parse it
  else if (typeof skills === 'string') {
    try {
      const parsed = JSON.parse(skills);
      if (Array.isArray(parsed)) {
        skillsArray = parsed.map(skill => String(skill).replace(/["\[\]]/g, '').trim()).filter(Boolean);
      }
    } catch {
      // If parsing fails, clean up and try to split by comma
      const cleanedSkills = skills.replace(/^\{|\}$/g, '').replace(/\\"/g, '"');
      skillsArray = cleanedSkills.split('","').map(skill => skill.replace(/^"|"$/g, '').trim()).filter(Boolean);
    }
  }
  
  // Filter out skills that look like job descriptions rather than actual skills
  return skillsArray.filter(skill => {
    // Skip empty skills
    if (!skill) return false;
    
    // Skip skills that are too long (likely description text)
    if (skill.length > 60) return false;
    
    // Skip skills that contain common description phrases
    const descriptionPhrases = [
      'proven ability', 'experience with', 'understanding of', 'familiarity with',
      'hands-on', 'strong background', 'knowledge of', 'proficiency in',
      'expertise in', 'solid experience', 'comfortable with', 'building new use cases',
      'supporting user', 'proactively engaging', 'working with', 'app testing',
      'custom builds', 'internal app access', 'network dependencies', 'tunnel configurations',
      'certificate authorities', 'onboarding unique device types', 'user acceptance testing',
      'production rollout', 'business units', 'gather requirements'
    ];
    
    const lowerSkill = skill.toLowerCase();
    if (descriptionPhrases.some(phrase => lowerSkill.includes(phrase))) return false;
    
    // Skip skills that look like job tasks/activities rather than technical skills
    const taskPatterns = [
      /testing$/i, /access$/i, /builds$/i, /cases$/i, /rollout$/i, /requirements$/i,
      /configurations$/i, /dependencies$/i, /authorities$/i, /types$/i, /units$/i
    ];
    if (taskPatterns.some(pattern => pattern.test(skill))) return false;
    
    // Skip skills that look like sentences or phrases (contain common connecting words)
    const sentenceWords = ['the', 'and', 'with', 'for', 'in', 'on', 'to', 'of', 'is', 'are', 'or'];
    const words = skill.toLowerCase().split(/\s+/);
    
    // More aggressive filtering for shorter phrases that contain connecting words
    if (words.length > 2 && words.some(word => sentenceWords.includes(word))) return false;
    
    // Skip generic phrases that don't represent specific technical skills
    const genericPhrases = ['use case', 'new use', 'user acceptance', 'business unit'];
    if (genericPhrases.some(phrase => lowerSkill.includes(phrase))) return false;
    
    return true;
  });
};