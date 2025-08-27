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