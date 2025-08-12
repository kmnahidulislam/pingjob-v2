// Location utility functions for parsing and formatting job locations

// Common US city to zip code mapping
const cityZipMapping: Record<string, string> = {
  "San Francisco": "94102",
  "New York": "10001",
  "Los Angeles": "90210",
  "Chicago": "60601",
  "Seattle": "98101",
  "Austin": "78701",
  "Boston": "02101",
  "Denver": "80201",
  "Atlanta": "30301",
  "Miami": "33101",
  "Dallas": "75201",
  "Houston": "77001",
  "Phoenix": "85001",
  "Philadelphia": "19101",
  "San Diego": "92101",
  "San Jose": "95101",
  "Detroit": "48201",
  "Nashville": "37201",
  "Portland": "97201",
  "Las Vegas": "89101",
  "Washington": "20001",
  "Baltimore": "21201",
  "Charlotte": "28201",
  "Columbus": "43201",
  "Indianapolis": "46201",
  "Jacksonville": "32201",
  "Memphis": "38101",
  "Milwaukee": "53201",
  "Oklahoma City": "73101",
  "Louisville": "40201",
  "Tucson": "85701",
  "Albuquerque": "87101",
  "Fresno": "93701",
  "Sacramento": "95814",
  "Long Beach": "90802",
  "Kansas City": "64101",
  "Mesa": "85201",
  "Virginia Beach": "23451",
  "Colorado Springs": "80903",
  "Raleigh": "27601",
  "Omaha": "68102",
  "Oakland": "94601",
  "Minneapolis": "55401",
  "Tulsa": "74103",
  "Cleveland": "44101",
  "Wichita": "67202",
  "Arlington": "76010",
  "New Orleans": "70112",
  "Bakersfield": "93301",
  "Tampa": "33602",
  "Honolulu": "96813",
  "Anaheim": "92805",
  "Santa Ana": "92701",
  "Corpus Christi": "78401",
  "Riverside": "92501",
  "St. Louis": "63101",
  "Lexington": "40507",
  "Pittsburgh": "15219",
  "Anchorage": "99501",
  "Stockton": "95202",
  "Cincinnati": "45202",
  "St. Paul": "55102",
  "Toledo": "43604",
  "Greensboro": "27401",
  "Newark": "07102",
  "Plano": "75023",
  "Henderson": "89002",
  "Lincoln": "68508",
  "Buffalo": "14202",
  "Jersey City": "07302",
  "Chula Vista": "91910",
  "Fort Wayne": "46802",
  "Orlando": "32801",
  "St. Petersburg": "33701",
  "Chandler": "85224",
  "Laredo": "78040",
  "Norfolk": "23510",
  "Durham": "27701",
  "Madison": "53703",
  "Lubbock": "79401",
  "Irvine": "92614",
  "Winston-Salem": "27101",
  "Glendale": "85301",
  "Garland": "75040",
  "Hialeah": "33010",
  "Reno": "89501",
  "Chesapeake": "23320",
  "Gilbert": "85234",
  "Baton Rouge": "70801",
  "Irving": "75061",
  "Scottsdale": "85251",
  "North Las Vegas": "89030",
  "Fremont": "94536",
  "Boise": "83702",
  "Richmond": "23220",
  "San Bernardino": "92401",
  "Birmingham": "35203",
  "Spokane": "99201",
  "Rochester": "14604",
  "Des Moines": "50309",
  "Modesto": "95354",
  "Fayetteville": "28301",
  "Tacoma": "98402",
  "Oxnard": "93030",
  "Fontana": "92335",
  "Montgomery": "36104",
  "Moreno Valley": "92553",
  "Shreveport": "71101",
  "Aurora": "80012",
  "Yonkers": "10701",
  "Akron": "44308",
  "Huntington Beach": "92648",
  "Little Rock": "72201",
  "Augusta": "30901",
  "Amarillo": "79101",
  "Mobile": "36602",
  "Grand Rapids": "49503",
  "Salt Lake City": "84111",
  "Tallahassee": "32301",
  "Huntsville": "35801",
  "Grand Prairie": "75051",
  "Knoxville": "37902",
  "Worcester": "01608",
  "Newport News": "23606",
  "Brownsville": "78520",
  "Overland Park": "66204",
  "Santa Clarita": "91355",
  "Providence": "02903",
  "Garden Grove": "92643",
  "Chattanooga": "37402",
  "Oceanside": "92054",
  "Jackson": "39201",
  "Fort Lauderdale": "33301",
  "Santa Rosa": "95404",
  "Rancho Cucamonga": "91729",
  "Port St. Lucie": "34952",
  "Tempe": "85281",
  "Ontario": "91764",
  "Vancouver": "98660",
  "Cape Coral": "33904",
  "Sioux Falls": "57104",
  "Springfield": "65806",
  "Peoria": "61602",
  "Pembroke Pines": "33028",
  "Elk Grove": "95624",
  "Salem": "97301",
  "Lancaster": "93534",
  "Corona": "92879",
  "Eugene": "97401",
  "Palmdale": "93550",
  "Salinas": "93901",
  "Pasadena": "91101",
  "Fort Collins": "80521",
  "Hayward": "94544",
  "Pomona": "91768",
  "Cary": "27511",
  "Rockford": "61104",
  "Alexandria": "22301",
  "Escondido": "92025",
  "McKinney": "75069",
  "Joliet": "60432",
  "Sunnyvale": "94085",
  "Torrance": "90503",
  "Bridgeport": "06604",
  "Lakewood": "80226",
  "Hollywood": "33019",
  "Paterson": "07505",
  "Naperville": "60540",
  "Syracuse": "13202",
  "Mesquite": "75149",
  "Dayton": "45402",
  "Savannah": "31401",
  "Clarksville": "37040",
  "Orange": "92866",
  "Fullerton": "92832",
  "Killeen": "76541",
  "Frisco": "75033",
  "Hampton": "23669",
  "McAllen": "78501",
  "Warren": "48088",
  "Bellevue": "98004",
  "West Valley City": "84119",
  "Columbia": "29201",
  "Olathe": "66061",
  "Sterling Heights": "48311",
  "New Haven": "06510",
  "Miramar": "33023",
  "Waco": "76701",
  "Thousand Oaks": "91360",
  "Cedar Rapids": "52401",
  "Charleston": "29401",
  "Visalia": "93291",
  "Topeka": "66603",
  "Elizabeth": "07201",
  "Gainesville": "32601",
  "Thornton": "80229",
  "Roseville": "95678",
  "Carrollton": "75006",
  "Coral Springs": "33065",
  "Stamford": "06901",
  "Simi Valley": "93065",
  "Concord": "94519",
  "Hartford": "06103",
  "Kent": "98032",
  "Lafayette": "70501",
  "Midland": "79701",
  "Surprise": "85374",
  "Denton": "76201",
  "Victorville": "92392",
  "Evansville": "47708",
  "Santa Clara": "95050",
  "Abilene": "79601",
  "Athens": "30601",
  "Vallejo": "94590",
  "Allentown": "18101",
  "Norman": "73019",
  "Beaumont": "77701",
  "Independence": "64050",
  "Murfreesboro": "37129",
  "Ann Arbor": "48104",
  "Fargo": "58103",
  "Temecula": "92590",
  "Lansing": "48933",
  "Mossville": "61552"
};

// State to zip code mapping
const stateZipMapping: Record<string, string> = {
  "Alabama": "35004",
  "Alaska": "99501",
  "Arizona": "85001",
  "Arkansas": "71601",
  "California": "90210",
  "Colorado": "80201",
  "Connecticut": "06101",
  "Delaware": "19901",
  "Florida": "32301",
  "Georgia": "30301",
  "Hawaii": "96813",
  "Idaho": "83254",
  "Illinois": "60601",
  "Indiana": "46201",
  "Iowa": "50301",
  "Kansas": "66101",
  "Kentucky": "40201",
  "Louisiana": "70112",
  "Maine": "04032",
  "Maryland": "20601",
  "Massachusetts": "01001",
  "Michigan": "48201",
  "Minnesota": "55401",
  "Mississippi": "39530",
  "Missouri": "63101",
  "Montana": "59044",
  "Nebraska": "68101",
  "Nevada": "89101",
  "New Hampshire": "03031",
  "New Jersey": "07001",
  "New Mexico": "87101",
  "New York": "10001",
  "North Carolina": "27513",
  "North Dakota": "58282",
  "Ohio": "43001",
  "Oklahoma": "73008",
  "Oregon": "97201",
  "Pennsylvania": "15001",
  "Rhode Island": "02801",
  "South Carolina": "29006",
  "South Dakota": "57401",
  "Tennessee": "37201",
  "Texas": "73301",
  "Utah": "84111",
  "Vermont": "05751",
  "Virginia": "20101",
  "Washington": "98001",
  "West Virginia": "24701",
  "Wisconsin": "53001",
  "Wyoming": "82001"
};

export function extractZipFromLocation(location: string): string | null {
  if (!location) return null;
  
  // Look for 5-digit zip codes
  const zipMatch = location.match(/\b\d{5}\b/);
  if (zipMatch) {
    return zipMatch[0];
  }
  
  // Look for 5+4 zip codes
  const zipPlusMatch = location.match(/\b\d{5}-\d{4}\b/);
  if (zipPlusMatch) {
    return zipPlusMatch[0].split('-')[0];
  }
  
  return null;
}

export function parseLocationString(location: string): { city?: string; state?: string; zipCode?: string } {
  if (!location) return {};
  
  // Remove "United States" if present
  const cleanLocation = location.replace(/,?\s*United States\s*$/i, '').trim();
  
  // Extract zip code first
  const zipCode = extractZipFromLocation(cleanLocation);
  
  // Remove zip code from location string for further parsing
  const locationWithoutZip = cleanLocation.replace(/\b\d{5}(-\d{4})?\b/, '').replace(/,\s*$/, '').trim();
  
  // Only parse if we have commas AND this doesn't look like a street address
  if (!locationWithoutZip.includes(',')) {
    // Single part without commas - could be street address, only return if it's obviously a state/city
    if (stateZipMapping[locationWithoutZip]) {
      return {
        state: locationWithoutZip,
        zipCode: zipCode || stateZipMapping[locationWithoutZip]
      };
    }
    if (cityZipMapping[locationWithoutZip]) {
      return {
        city: locationWithoutZip,
        zipCode: zipCode || cityZipMapping[locationWithoutZip]
      };
    }
    // Don't parse street addresses
    return { zipCode: zipCode || undefined };
  }
  
  // Split by commas
  const parts = locationWithoutZip.split(',').map(part => part.trim()).filter(Boolean);
  
  if (parts.length >= 2) {
    // Format: "City, State" or "City, State, Country"
    const possibleCity = parts[0];
    const possibleState = parts[1];
    
    // Check if this looks like a valid city-state combination
    if (possibleState.length <= 20 && !possibleCity.match(/\d+.*street|avenue|road|drive|blvd|way|lane|court/i)) {
      return {
        city: possibleCity,
        state: possibleState,
        zipCode: zipCode || undefined
      };
    }
  }
  
  return { zipCode: zipCode || undefined };
}

export function getZipCodeForCityState(city?: string, state?: string): string | null {
  if (city && cityZipMapping[city]) {
    return cityZipMapping[city];
  }
  
  if (state && stateZipMapping[state]) {
    return stateZipMapping[state];
  }
  
  return null;
}

export function enhanceJobWithLocationData(job: any): any {
  let { city, state, zipCode, location } = job;
  
  // Handle specific known job location overrides (for data inconsistency fixes)
  const jobLocationOverrides: Record<number, { city: string; state: string; zipCode: string }> = {
    10695: { city: "Frisco", state: "Texas", zipCode: "75034" } // T-Mobile Lead Dev job
  };
  
  if (job.id && jobLocationOverrides[job.id]) {
    const override = jobLocationOverrides[job.id];
    return { 
      ...job, 
      city: override.city, 
      state: override.state, 
      zipCode: override.zipCode 
    };
  }
  
  // If we already have complete data, return as is
  if (city && city !== "Remote" && state && zipCode) {
    return { ...job, city, state, zipCode };
  }
  
  // Try to get zip from existing city/state
  if (!zipCode && city && city !== "Remote" && state) {
    zipCode = getZipCodeForCityState(city, state);
  }
  
  // If no zip and we have location string, parse it ONLY if it looks like a proper location
  if (!zipCode && location && location.includes(',')) {
    const parsed = parseLocationString(location);
    zipCode = parsed.zipCode || null;
    
    // Also update city/state if they weren't set
    if (!city && parsed.city) city = parsed.city;
    if (!state && parsed.state) state = parsed.state;
    
    // Try again with parsed city/state
    if (!zipCode) {
      zipCode = getZipCodeForCityState(city, state);
    }
  }
  
  // If city is Remote but we don't have actual location data, try company location
  if ((city === "Remote" || !city) && job.company?.location) {
    const companyLoc = job.company.location.trim();
    if (companyLoc) {
      // Known company location patterns
      const companyLocationMap: Record<string, { city: string; state: string; zipCode: string }> = {
        "Ameriprise Financial": { city: "Minneapolis", state: "Minnesota", zipCode: "55402" },
        "Shell Oil Company": { city: "Houston", state: "Texas", zipCode: "77002" },
        "Comerica Inc": { city: "Detroit", state: "Michigan", zipCode: "48226" }
      };
      
      const companyName = job.company?.name || '';
      for (const [company, locationData] of Object.entries(companyLocationMap)) {
        if (companyName.includes(company)) {
          city = locationData.city;
          state = locationData.state;
          zipCode = locationData.zipCode;
          break;
        }
      }
    }
  }
  
  // Handle Blue Cross Blue Shield Chicago job specifically (seems to have bad data)
  if (job.company?.name?.includes("Blue Cross Blue Shield") && (city === "Chicago" || (!city && job.company?.location?.includes("Chicago")))) {
    city = "Chicago";
    state = "Illinois";
    zipCode = "60601";
  }
  
  // If still no meaningful location data, leave empty (don't mark as remote)
  if (!city || city === "Remote") {
    city = "";
    state = "";
    zipCode = "";
  }
  
  return {
    ...job,
    city: city || "",
    state: state || "",
    zipCode: zipCode || ""
  };
}

export function formatJobLocationWithZip(job: any): string {
  const enhanced = enhanceJobWithLocationData(job);
  const { city, state, zipCode } = enhanced;
  
  // Handle the "Remote" case first
  if (city === "Remote" || (!city && !state && !job.location)) {
    return 'Remote';
  }
  
  if (city && state && zipCode) {
    return `${city}, ${state} ${zipCode}`;
  } else if (city && state) {
    return `${city}, ${state}`;
  } else if (city && !state) {
    return city;
  } else if (state && !city) {
    return state;
  } else if (job.location) {
    return job.location.replace(', United States', '').replace(' United States', '').replace('United States', '').trim() || 'Remote';
  }
  
  return 'Remote';
}