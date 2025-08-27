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
  
  // If it's already an array, return as is
  if (Array.isArray(skills)) {
    return skills.map(skill => String(skill).replace(/["\[\]]/g, '').trim()).filter(Boolean);
  }
  
  // If it's a string that looks like JSON, try to parse it
  if (typeof skills === 'string') {
    try {
      const parsed = JSON.parse(skills);
      if (Array.isArray(parsed)) {
        return parsed.map(skill => String(skill).replace(/["\[\]]/g, '').trim()).filter(Boolean);
      }
    } catch {
      // If parsing fails, clean up and try to split by comma
      const cleanedSkills = skills.replace(/^\{|\}$/g, '').replace(/\\"/g, '"');
      return cleanedSkills.split('","').map(skill => skill.replace(/^"|"$/g, '').trim()).filter(Boolean);
    }
  }
  
  return [];
};