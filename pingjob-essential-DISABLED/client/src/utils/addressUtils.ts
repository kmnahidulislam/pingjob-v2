// Utility functions for parsing and formatting address information

export interface AddressComponents {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export function parseLocationString(location: string): AddressComponents {
  if (!location) return {};
  
  const result: AddressComponents = {};
  
  // Common state abbreviations
  const stateAbbreviations = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  
  // Extract ZIP code (5 digits or 5+4 format)
  const zipMatch = location.match(/\b\d{5}(-\d{4})?\b/);
  if (zipMatch) {
    result.zipCode = zipMatch[0];
  }
  
  // Extract state abbreviation
  const stateMatch = location.match(new RegExp(`\\b(${stateAbbreviations.join('|')})\\b`, 'i'));
  if (stateMatch) {
    result.state = stateMatch[1].toUpperCase();
  }
  
  // For "31700 w 13 Mile Road" type addresses, extract meaningful components
  const parts = location.split(',').map(p => p.trim());
  
  if (parts.length === 1) {
    // Single part address - likely a street address
    result.street = location;
  } else {
    // Multiple parts - try to identify components
    result.street = parts[0];
    
    // Look for city in remaining parts (typically before state/zip)
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      
      // Skip if it's a state abbreviation or ZIP code
      if (stateAbbreviations.includes(part.toUpperCase()) || /^\d{5}(-\d{4})?$/.test(part)) {
        continue;
      }
      
      // Skip if it contains digits at the start (likely another address component)
      if (!/^\d/.test(part) && part.length > 2) {
        result.city = part;
        break;
      }
    }
  }
  
  return result;
}

export function formatCompanyAddress(company: any): string {
  const components: string[] = [];
  
  // If we have individual address components, use them
  if (company.city || company.state || company.zipCode || company.country) {
    if (company.location && !company.city) {
      // If we have location but no city, try to parse it
      const parsed = parseLocationString(company.location);
      components.push(company.location);
      if (parsed.city && !company.city) components.push(parsed.city);
      if (parsed.state && !company.state) components.push(parsed.state);
      if (parsed.zipCode && !company.zipCode) components.push(parsed.zipCode);
    } else {
      // Use individual components
      if (company.location) components.push(company.location);
      if (company.city) components.push(company.city);
      if (company.state) components.push(company.state);
      if (company.zipCode || company.zip_code) components.push(company.zipCode || company.zip_code);
    }
    if (company.country) components.push(company.country);
  } else if (company.location) {
    // Only location field available - parse and format
    const parsed = parseLocationString(company.location);
    components.push(company.location);
    
    // Add inferred city and state if detected
    if (parsed.city) components.push(parsed.city);
    if (parsed.state) components.push(parsed.state);
    if (parsed.zipCode) components.push(parsed.zipCode);
  }
  
  return components.filter(Boolean).join(', ');
}

export function getDisplayAddress(company: any): string {
  return formatCompanyAddress(company) || 'Address not available';
}