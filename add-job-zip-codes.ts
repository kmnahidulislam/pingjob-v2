import { db } from "./db";
import { jobs } from "./shared/schema";
import { eq, or, isNull } from "drizzle-orm";

// Common US city to zip code mapping for major cities
const cityZipMapping: Record<string, string> = {
  // Major tech cities
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
  
  // Other major cities
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
  "Miami": "33101",
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
  "Columbus": "31901",
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
  "Glendale": "91205",
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
  "Springfield": "01103",
  "Pasadena": "91101",
  "Fort Collins": "80521",
  "Hayward": "94544",
  "Pomona": "91768",
  "Cary": "27511",
  "Rockford": "61104",
  "Alexandria": "22301",
  "Escondido": "92025",
  "McKinney": "75069",
  "Kansas City": "66101",
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
  "Pasadena": "77505",
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

// State to zip code mapping for when only state is available
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

function extractZipFromLocation(location: string): string | null {
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

function parseLocationString(location: string): { city?: string; state?: string; zipCode?: string } {
  if (!location) return {};
  
  // Remove "United States" if present
  const cleanLocation = location.replace(/,?\s*United States\s*$/i, '').trim();
  
  // Extract zip code first
  const zipCode = extractZipFromLocation(cleanLocation);
  
  // Remove zip code from location string for further parsing
  const locationWithoutZip = cleanLocation.replace(/\b\d{5}(-\d{4})?\b/, '').replace(/,\s*$/, '').trim();
  
  // Split by commas
  const parts = locationWithoutZip.split(',').map(part => part.trim()).filter(Boolean);
  
  if (parts.length >= 2) {
    // Format: "City, State" or "City, State, Country"
    return {
      city: parts[0],
      state: parts[1],
      zipCode: zipCode || undefined
    };
  } else if (parts.length === 1) {
    // Could be just city or just state
    const part = parts[0];
    if (stateZipMapping[part]) {
      return {
        state: part,
        zipCode: zipCode || stateZipMapping[part]
      };
    } else {
      return {
        city: part,
        zipCode: zipCode || cityZipMapping[part] || undefined
      };
    }
  }
  
  return { zipCode: zipCode || undefined };
}

function getZipCodeForCityState(city?: string, state?: string): string | null {
  if (city && cityZipMapping[city]) {
    return cityZipMapping[city];
  }
  
  if (state && stateZipMapping[state]) {
    return stateZipMapping[state];
  }
  
  return null;
}

async function addZipCodesToJobs() {
  console.log("🔍 Starting zip code population for jobs...");
  
  try {
    // Get all jobs that don't have zip codes
    const jobsWithoutZip = await db
      .select()
      .from(jobs)
      .where(
        or(
          isNull(jobs.zipCode),
          eq(jobs.zipCode, '')
        )
      );
    
    console.log(`📊 Found ${jobsWithoutZip.length} jobs without zip codes`);
    
    let updated = 0;
    let processed = 0;
    
    for (const job of jobsWithoutZip) {
      processed++;
      
      let zipCode: string | null = null;
      let city = job.city;
      let state = job.state;
      
      // Try to get zip from existing city/state
      if (city || state) {
        zipCode = getZipCodeForCityState(city, state);
      }
      
      // If no zip and we have location string, parse it
      if (!zipCode && job.location) {
        const parsed = parseLocationString(job.location);
        zipCode = parsed.zipCode || null;
        
        // Also update city/state if they weren't set
        if (!city && parsed.city) city = parsed.city;
        if (!state && parsed.state) state = parsed.state;
        
        // Try again with parsed city/state
        if (!zipCode) {
          zipCode = getZipCodeForCityState(city, state);
        }
      }
      
      // Update the job if we found a zip code or updated city/state
      if (zipCode || (city !== job.city) || (state !== job.state)) {
        await db
          .update(jobs)
          .set({
            zipCode: zipCode || job.zipCode,
            city: city || job.city,
            state: state || job.state,
            updatedAt: new Date()
          })
          .where(eq(jobs.id, job.id));
        
        updated++;
        
        console.log(`✅ Updated job ${job.id} (${job.title}): ${city}, ${state} ${zipCode}`);
      }
      
      // Progress indicator
      if (processed % 100 === 0) {
        console.log(`⏳ Processed ${processed}/${jobsWithoutZip.length} jobs...`);
      }
    }
    
    console.log(`🎉 Complete! Updated ${updated} out of ${processed} jobs with zip codes`);
    
  } catch (error) {
    console.error("❌ Error adding zip codes to jobs:", error);
    throw error;
  }
}

// Run the script
addZipCodesToJobs()
  .then(() => {
    console.log("✅ Zip code population completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed to populate zip codes:", error);
    process.exit(1);
  });

export { addZipCodesToJobs };