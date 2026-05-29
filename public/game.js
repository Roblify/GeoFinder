// GeoFinder client. Two-axis picker: pick a game style (timer / movement rules)
// and a location pool, then play a round-based guessing game.

const MAX_POINTS = 5000;

// ---------- Game styles ----------
const STYLES = {
  classic: { label: "Classic",     rounds: 5, timePerRound: 120, allowMove: true  },
  nomove:  { label: "No Move",     rounds: 5, timePerRound: 120, allowMove: false },
  blitz:   { label: "Time Attack", rounds: 5, timePerRound: 30,  allowMove: true  },
};

// ---------- Location pools ----------
// Each pool resolves to a random lat/lng. `type` controls how:
//   region:  weighted lat/lng bounding boxes (good for big areas)
//   box:     single bounding box (or list of equal-weight boxes)
//   points:  curated list with small jitter, looks up nearest pano in `radius`
const WORLD_REGIONS = [
  [25, 49, -125, -67, 8],
  [49, 60, -125, -55, 2],
  [35, 71, -10, 30, 8],
  [36, 60, 20, 60, 3],
  [-35, 5, -75, -35, 4],
  [8, 33, -118, -86, 3],
  [-35, -10, 110, 155, 3],
  [-47, -34, 165, 179, 1],
  [24, 46, 122, 146, 3],
  [-35, 37, -20, 52, 3],
  [5, 28, 68, 97, 3],
  [-10, 7, 95, 141, 2],
];

const CITIES = [
  { name: "New York",      lat: 40.7128,  lng: -74.0060 },
  { name: "Los Angeles",   lat: 34.0522,  lng: -118.2437 },
  { name: "Chicago",       lat: 41.8781,  lng: -87.6298 },
  { name: "Toronto",       lat: 43.6532,  lng: -79.3832 },
  { name: "Mexico City",   lat: 19.4326,  lng: -99.1332 },
  { name: "São Paulo",     lat: -23.5505, lng: -46.6333 },
  { name: "Buenos Aires",  lat: -34.6037, lng: -58.3816 },
  { name: "London",        lat: 51.5074,  lng: -0.1278 },
  { name: "Paris",         lat: 48.8566,  lng: 2.3522 },
  { name: "Amsterdam",     lat: 52.3676,  lng: 4.9041 },
  { name: "Berlin",        lat: 52.5200,  lng: 13.4050 },
  { name: "Madrid",        lat: 40.4168,  lng: -3.7038 },
  { name: "Rome",          lat: 41.9028,  lng: 12.4964 },
  { name: "Athens",        lat: 37.9838,  lng: 23.7275 },
  { name: "Istanbul",      lat: 41.0082,  lng: 28.9784 },
  { name: "Moscow",        lat: 55.7558,  lng: 37.6173 },
  { name: "Cairo",         lat: 30.0444,  lng: 31.2357 },
  { name: "Cape Town",     lat: -33.9249, lng: 18.4241 },
  { name: "Lagos",         lat: 6.5244,   lng: 3.3792 },
  { name: "Dubai",         lat: 25.2048,  lng: 55.2708 },
  { name: "Mumbai",        lat: 19.0760,  lng: 72.8777 },
  { name: "Delhi",         lat: 28.7041,  lng: 77.1025 },
  { name: "Bangkok",       lat: 13.7563,  lng: 100.5018 },
  { name: "Singapore",     lat: 1.3521,   lng: 103.8198 },
  { name: "Jakarta",       lat: -6.2088,  lng: 106.8456 },
  { name: "Hong Kong",     lat: 22.3193,  lng: 114.1694 },
  { name: "Taipei",        lat: 25.0330,  lng: 121.5654 },
  { name: "Seoul",         lat: 37.5665,  lng: 126.9780 },
  { name: "Tokyo",         lat: 35.6762,  lng: 139.6503 },
  { name: "Osaka",         lat: 34.6937,  lng: 135.5023 },
  { name: "Sydney",        lat: -33.8688, lng: 151.2093 },
  { name: "Melbourne",     lat: -37.8136, lng: 144.9631 },
  { name: "Auckland",      lat: -36.8485, lng: 174.7633 },
  { name: "Rio de Janeiro",lat: -22.9068, lng: -43.1729 },
  { name: "Lima",          lat: -12.0464, lng: -77.0428 },
  { name: "Bogotá",        lat: 4.7110,   lng: -74.0721 },
  { name: "San Francisco", lat: 37.7749,  lng: -122.4194 },
  { name: "Vancouver",     lat: 49.2827,  lng: -123.1207 },
  { name: "Lisbon",        lat: 38.7223,  lng: -9.1393 },
  { name: "Stockholm",     lat: 59.3293,  lng: 18.0686 },
  { name: "Vienna",        lat: 48.2082,  lng: 16.3738 },
  { name: "Prague",        lat: 50.0755,  lng: 14.4378 },
  { name: "Warsaw",        lat: 52.2297,  lng: 21.0122 },
  { name: "Tel Aviv",      lat: 32.0853,  lng: 34.7818 },
];

// Famous landmarks - small radius so the spawn is right at the site.
const LANDMARKS = [
  { name: "Eiffel Tower",          lat: 48.8584,  lng: 2.2945 },
  { name: "Statue of Liberty",     lat: 40.6892,  lng: -74.0445 },
  { name: "Big Ben",               lat: 51.5007,  lng: -0.1246 },
  { name: "Colosseum",             lat: 41.8902,  lng: 12.4922 },
  { name: "Sagrada Família",       lat: 41.4036,  lng: 2.1744 },
  { name: "Brandenburg Gate",      lat: 52.5163,  lng: 13.3777 },
  { name: "Acropolis",             lat: 37.9715,  lng: 23.7257 },
  { name: "Times Square",          lat: 40.7580,  lng: -73.9855 },
  { name: "Golden Gate Bridge",    lat: 37.8199,  lng: -122.4783 },
  { name: "Hollywood Sign",        lat: 34.1341,  lng: -118.3215 },
  { name: "Sydney Opera House",    lat: -33.8568, lng: 151.2153 },
  { name: "Taj Mahal",             lat: 27.1751,  lng: 78.0421 },
  { name: "Burj Khalifa",          lat: 25.1972,  lng: 55.2744 },
  { name: "Tokyo Tower",           lat: 35.6586,  lng: 139.7454 },
  { name: "Shibuya Crossing",      lat: 35.6595,  lng: 139.7005 },
  { name: "Red Square",            lat: 55.7539,  lng: 37.6208 },
  { name: "Pyramids of Giza",      lat: 29.9792,  lng: 31.1342 },
  { name: "Christ the Redeemer",   lat: -22.9519, lng: -43.2105 },
  { name: "Niagara Falls",         lat: 43.0962,  lng: -79.0377 },
  { name: "Las Vegas Strip",       lat: 36.1147,  lng: -115.1728 },
  { name: "Tower Bridge",          lat: 51.5055,  lng: -0.0754 },
  { name: "Trevi Fountain",        lat: 41.9009,  lng: 12.4833 },
  { name: "Marina Bay Sands",      lat: 1.2834,   lng: 103.8607 },
  { name: "Petronas Towers",       lat: 3.1579,   lng: 101.7116 },
  { name: "Table Mountain",        lat: -33.9628, lng: 18.4098 },
  { name: "CN Tower",              lat: 43.6426,  lng: -79.3871 },
  { name: "Space Needle",          lat: 47.6205,  lng: -122.3493 },
  { name: "Arc de Triomphe",       lat: 48.8738,  lng: 2.2950 },
  { name: "Louvre",                lat: 48.8606,  lng: 2.3376 },
  { name: "St. Peter's Square",    lat: 41.9022,  lng: 12.4574 },
];

// Curated spots where a national flag is hoisted on a flagpole and visible
// from Street View - government buildings, embassies, monuments, plazas.
// Small search radius so we land right at the flag.
const FLAG_SPOTS = [
  { name: "US Capitol",            lat: 38.8899,  lng: -77.0091 },
  { name: "White House (Ellipse)", lat: 38.8938,  lng: -77.0365 },
  { name: "Lincoln Memorial",      lat: 38.8893,  lng: -77.0502 },
  { name: "Iwo Jima Memorial",     lat: 38.8895,  lng: -77.0698 },
  { name: "Parliament Hill",       lat: 45.4236,  lng: -75.6996 },  // Canada
  { name: "Mexican Zócalo",        lat: 19.4326,  lng: -99.1332 },  // huge flag
  { name: "Plaza de Mayo",         lat: -34.6083, lng: -58.3712 },  // Argentina
  { name: "Palácio do Planalto",   lat: -15.7997, lng: -47.8606 },  // Brazil
  { name: "La Moneda",             lat: -33.4429, lng: -70.6536 },  // Chile
  { name: "Plaza Bolívar",         lat: 4.5981,   lng: -74.0760 },  // Colombia
  { name: "Buckingham Palace",     lat: 51.5014,  lng: -0.1419 },
  { name: "Palace of Westminster", lat: 51.4995,  lng: -0.1248 },
  { name: "Élysée Palace area",    lat: 48.8704,  lng: 2.3166 },    // France
  { name: "Reichstag",             lat: 52.5186,  lng: 13.3762 },   // Germany
  { name: "Brandenburg Gate",      lat: 52.5163,  lng: 13.3777 },
  { name: "Quirinal Palace",       lat: 41.8997,  lng: 12.4869 },   // Italy
  { name: "Royal Palace, Madrid",  lat: 40.4180,  lng: -3.7144 },   // Spain
  { name: "Belém Tower",           lat: 38.6916,  lng: -9.2160 },   // Portugal
  { name: "Royal Palace, Amsterdam", lat: 52.3731, lng: 4.8912 },   // Netherlands
  { name: "Royal Palace, Brussels",lat: 50.8420,  lng: 4.3625 },    // Belgium
  { name: "Royal Palace, Stockholm", lat: 59.3267, lng: 18.0717 },  // Sweden
  { name: "Akershus Fortress",     lat: 59.9077,  lng: 10.7363 },   // Norway
  { name: "Christiansborg",        lat: 55.6761,  lng: 12.5797 },   // Denmark
  { name: "Helsinki Senate Square",lat: 60.1699,  lng: 24.9523 },   // Finland
  { name: "Hofburg",               lat: 48.2065,  lng: 16.3651 },   // Austria
  { name: "Bundesplatz Bern",      lat: 46.9466,  lng: 7.4444 },    // Switzerland
  { name: "Wenceslas Square",      lat: 50.0814,  lng: 14.4264 },   // Czechia
  { name: "Kremlin / Red Square",  lat: 55.7539,  lng: 37.6208 },   // Russia
  { name: "Maidan Nezalezhnosti",  lat: 50.4501,  lng: 30.5234 },   // Ukraine
  { name: "Syntagma Square",       lat: 37.9755,  lng: 23.7348 },   // Greece
  { name: "Taksim Square",         lat: 41.0370,  lng: 28.9850 },   // Turkey
  { name: "Knesset",               lat: 31.7767,  lng: 35.2056 },   // Israel
  { name: "Tahrir Square",         lat: 30.0444,  lng: 31.2357 },   // Egypt
  { name: "Union Buildings",       lat: -25.7402, lng: 28.2126 },   // South Africa
  { name: "Tiananmen Square",      lat: 39.9054,  lng: 116.3914 },  // China
  { name: "Imperial Palace Plaza", lat: 35.6852,  lng: 139.7528 },  // Japan
  { name: "Gwanghwamun Plaza",     lat: 37.5720,  lng: 126.9769 },  // South Korea
  { name: "India Gate",            lat: 28.6129,  lng: 77.2295 },
  { name: "Merdeka Square, KL",    lat: 3.1478,   lng: 101.6932 },  // Malaysia, huge flag
  { name: "Merlion Park",          lat: 1.2868,   lng: 103.8545 },  // Singapore
  { name: "National Monument",     lat: -6.1754,  lng: 106.8272 },  // Indonesia
  { name: "Rizal Park",            lat: 14.5826,  lng: 120.9799 },  // Philippines
  { name: "Parliament House, Canberra", lat: -35.3081, lng: 149.1244 },
  { name: "Beehive, Wellington",   lat: -41.2784, lng: 174.7766 },  // NZ
];

// Country whitelists per continent (ISO 3166-1 alpha-2). Transcontinental
// countries (Russia, Turkey, Cyprus, Egypt) appear in both relevant lists.
const CONTINENT_COUNTRIES = {
  europe: [
    "AL","AD","AT","BY","BE","BA","BG","HR","CY","CZ","DK","EE","FI","FR","DE",
    "GR","HU","IS","IE","IT","XK","LV","LI","LT","LU","MT","MD","MC","ME","NL",
    "MK","NO","PL","PT","RO","SM","RS","SK","SI","ES","SE","CH","TR","UA","GB",
    "VA","RU",
  ],
  na: [
    "US","CA","MX","GT","BZ","SV","HN","NI","CR","PA","CU","JM","HT","DO","PR",
    "BS","TT","BB","GL","AG","DM","GD","KN","LC","VC","AI","BM","KY","MS","TC",
    "VG","VI",
  ],
  sa: ["AR","BO","BR","CL","CO","EC","GY","PY","PE","SR","UY","VE","FK","GF"],
  asia: [
    "AF","AM","AZ","BH","BD","BT","BN","KH","CN","GE","HK","IN","ID","IR","IQ",
    "IL","JP","JO","KZ","KW","KG","LA","LB","MO","MY","MV","MN","MM","NP","KP",
    "OM","PK","PS","PH","QA","SA","SG","KR","LK","SY","TW","TJ","TH","TL","TR",
    "TM","AE","UZ","VN","YE","RU","CY",
  ],
  africa: [
    "DZ","AO","BJ","BW","BF","BI","CV","CM","CF","TD","KM","CG","CD","CI","DJ",
    "EG","GQ","ER","SZ","ET","GA","GM","GH","GN","GW","KE","LS","LR","LY","MG",
    "MW","ML","MR","MU","YT","MA","MZ","NA","NE","NG","RW","RE","SH","ST","SN",
    "SC","SL","SO","ZA","SS","SD","TZ","TG","TN","UG","EH","ZM","ZW",
  ],
  oceania: [
    "AU","NZ","PG","FJ","SB","VU","NC","PF","WS","TO","KI","FM","MH","NR","PW",
    "TV","AS","CK","GU","MP","NU","NF","PN","TK","WF",
  ],
};

const LOCATIONS = {
  world:      { label: "World",         icon: "🌍", desc: "Anywhere on Earth", type: "regions", regions: WORLD_REGIONS, radius: 50000 },

  // Continents — bounding box plus a whitelist of country codes so border
  // panos don't spill into the wrong continent.
  europe:     { label: "Europe",        icon: "🏰", desc: "Bordeaux to Bucharest",       countries: CONTINENT_COUNTRIES.europe,  type: "box", box: [35, 71, -10, 45], radius: 50000 },
  na:         { label: "North America", icon: "🗽", desc: "Canada · USA · Mexico",       countries: CONTINENT_COUNTRIES.na,      type: "box", box: [15, 70, -168, -52], radius: 80000 },
  sa:         { label: "South America", icon: "🌴", desc: "Patagonia to the Caribbean", countries: CONTINENT_COUNTRIES.sa,      type: "box", box: [-56, 13, -82, -34], radius: 80000 },
  asia:       { label: "Asia",          icon: "🏯", desc: "From Turkey to Japan",        countries: CONTINENT_COUNTRIES.asia,    type: "box", box: [5, 60, 25, 145], radius: 80000 },
  africa:     { label: "Africa",        icon: "🦓", desc: "Cape to Cairo",               countries: CONTINENT_COUNTRIES.africa,  type: "box", box: [-35, 37, -18, 52], radius: 100000 },
  oceania:    { label: "Oceania",       icon: "🏝️", desc: "Australia · NZ · Pacific",    countries: CONTINENT_COUNTRIES.oceania, type: "box", box: [-47, -10, 110, 179], radius: 100000 },

  // Countries (alphabetical). `country` is the ISO 3166-1 alpha-2 code used
  // to reject panos that snap across a border into a neighboring country.
  argentina:  { label: "Argentina",      icon: "🇦🇷", desc: "Pampas & Patagonia",         country: "AR", type: "box", box: [-55, -22, -73, -54], radius: 80000 },
  australia:  { label: "Australia",      icon: "🇦🇺", desc: "The whole continent",         country: "AU", type: "box", box: [-39, -11, 113, 154], radius: 100000 },
  austria:    { label: "Austria",        icon: "🇦🇹", desc: "Alps & Vienna",               country: "AT", type: "box", box: [46.4, 49, 9.5, 17], radius: 25000 },
  belgium:    { label: "Belgium",        icon: "🇧🇪", desc: "Compact & dense",             country: "BE", type: "box", box: [49.5, 51.5, 2.5, 6.4], radius: 20000 },
  brazil:     { label: "Brazil",         icon: "🇧🇷", desc: "Amazon to Atlantic",          country: "BR", type: "box", box: [-33, 5, -74, -34], radius: 80000 },
  canada:     { label: "Canada",         icon: "🇨🇦", desc: "Sea to sea",                  country: "CA", type: "box", box: [42, 70, -141, -52], radius: 80000 },
  chile:      { label: "Chile",          icon: "🇨🇱", desc: "Long & narrow",               country: "CL", type: "box", box: [-55, -17, -75, -67], radius: 60000 },
  china:      { label: "China",          icon: "🇨🇳", desc: "Coverage is limited",         country: "CN", type: "box", box: [20, 50, 75, 135], radius: 80000 },
  colombia:   { label: "Colombia",       icon: "🇨🇴", desc: "Andes to Caribbean",          country: "CO", type: "box", box: [-4, 12, -79, -67], radius: 50000 },
  czechia:    { label: "Czechia",        icon: "🇨🇿", desc: "Bohemia & Moravia",           country: "CZ", type: "box", box: [48.5, 51, 12, 19], radius: 25000 },
  denmark:    { label: "Denmark",        icon: "🇩🇰", desc: "Jutland & islands",           country: "DK", type: "box", box: [54.5, 58, 8, 13], radius: 20000 },
  finland:    { label: "Finland",        icon: "🇫🇮", desc: "Lakes & forests",             country: "FI", type: "box", box: [60, 70, 20, 32], radius: 40000 },
  france:     { label: "France",         icon: "🇫🇷", desc: "Mainland France",             country: "FR", type: "box", box: [42, 51, -5, 8], radius: 30000 },
  germany:    { label: "Germany",        icon: "🇩🇪", desc: "Alps to North Sea",           country: "DE", type: "box", box: [47, 55, 6, 15], radius: 30000 },
  greece:     { label: "Greece",         icon: "🇬🇷", desc: "Mainland & islands",          country: "GR", type: "box", box: [34.8, 41.8, 19.4, 28.3], radius: 30000 },
  india:      { label: "India",          icon: "🇮🇳", desc: "Himalaya to Kerala",          country: "IN", type: "box", box: [8, 35, 68, 97], radius: 60000 },
  indonesia:  { label: "Indonesia",      icon: "🇮🇩", desc: "17,000 islands",              country: "ID", type: "box", box: [-11, 6, 95, 141], radius: 60000 },
  ireland:    { label: "Ireland",        icon: "🇮🇪", desc: "The emerald isle",            country: "IE", type: "box", box: [51.4, 55.4, -10.5, -6], radius: 25000 },
  israel:     { label: "Israel",         icon: "🇮🇱", desc: "Dead Sea to Galilee",         country: "IL", type: "box", box: [29.5, 33.3, 34.3, 35.9], radius: 20000 },
  italy:      { label: "Italy",          icon: "🇮🇹", desc: "The boot",                    country: "IT", type: "box", box: [36, 47, 6, 19], radius: 30000 },
  japan:      { label: "Japan",          icon: "🇯🇵", desc: "Tightly packed islands",      country: "JP", type: "box", box: [30, 45, 130, 146], radius: 30000 },
  kenya:      { label: "Kenya",          icon: "🇰🇪", desc: "Savannas & coast",            country: "KE", type: "box", box: [-4.7, 5, 33.9, 41.9], radius: 50000 },
  malaysia:   { label: "Malaysia",       icon: "🇲🇾", desc: "Peninsula & Borneo",          country: "MY", type: "box", box: [1, 7.5, 99.5, 119.5], radius: 40000 },
  mexico:     { label: "Mexico",         icon: "🇲🇽", desc: "Border to border",            country: "MX", type: "box", box: [14, 32, -118, -86], radius: 50000 },
  netherlands:{ label: "Netherlands",    icon: "🇳🇱", desc: "Flat & cycled",               country: "NL", type: "box", box: [50.7, 53.5, 3.3, 7.2], radius: 20000 },
  newzealand: { label: "New Zealand",    icon: "🇳🇿", desc: "Two islands",                 country: "NZ", type: "box", box: [-47, -34, 166, 179], radius: 40000 },
  norway:     { label: "Norway",         icon: "🇳🇴", desc: "Fjords & tundra",             country: "NO", type: "box", box: [58, 71, 4, 31], radius: 50000 },
  peru:       { label: "Peru",           icon: "🇵🇪", desc: "Coast, Andes, Amazon",        country: "PE", type: "box", box: [-18.4, 0, -81.3, -68.7], radius: 60000 },
  philippines:{ label: "Philippines",    icon: "🇵🇭", desc: "Archipelago of 7,000",        country: "PH", type: "box", box: [5, 19, 117, 126.5], radius: 40000 },
  poland:     { label: "Poland",         icon: "🇵🇱", desc: "Baltic to Tatras",            country: "PL", type: "box", box: [49, 55, 14, 24], radius: 30000 },
  portugal:   { label: "Portugal",       icon: "🇵🇹", desc: "Atlantic west",               country: "PT", type: "box", box: [37, 42, -10, -6], radius: 25000 },
  russia:     { label: "Russia",         icon: "🇷🇺", desc: "Across 11 time zones",        country: "RU", type: "box", box: [44, 70, 27, 178], radius: 100000 },
  southafrica:{ label: "South Africa",   icon: "🇿🇦", desc: "Cape to Limpopo",             country: "ZA", type: "box", box: [-35, -22, 16.5, 33], radius: 50000 },
  southkorea: { label: "South Korea",    icon: "🇰🇷", desc: "Mountains & cities",          country: "KR", type: "box", box: [33, 38.6, 125.5, 130], radius: 25000 },
  spain:      { label: "Spain",          icon: "🇪🇸", desc: "Mainland Iberia",             country: "ES", type: "box", box: [36, 44, -10, 4], radius: 30000 },
  sweden:     { label: "Sweden",         icon: "🇸🇪", desc: "Long Nordic country",         country: "SE", type: "box", box: [55, 69, 11, 24], radius: 40000 },
  switzerland:{ label: "Switzerland",    icon: "🇨🇭", desc: "Alpine confederation",        country: "CH", type: "box", box: [45.8, 47.8, 5.9, 10.5], radius: 20000 },
  thailand:   { label: "Thailand",       icon: "🇹🇭", desc: "Gulf to Mekong",              country: "TH", type: "box", box: [5.6, 20.5, 97.3, 105.6], radius: 40000 },
  turkey:     { label: "Turkey",         icon: "🇹🇷", desc: "Two continents",              country: "TR", type: "box", box: [36, 42, 26, 45], radius: 40000 },
  uk:         { label: "United Kingdom", icon: "🇬🇧", desc: "Britain & N. Ireland",        country: "GB", type: "box", box: [50, 59, -8, 2], radius: 30000 },
  usa:        { label: "USA",            icon: "🇺🇸", desc: "Mainland + Alaska",           country: "US", type: "boxes", boxes: [[25, 49, -125, -67, 9], [54, 71, -167, -141, 1]], radius: 60000 },

  // Curated
  cities:     { label: "Famous Cities",     icon: "🏙️", desc: "44 major world cities",   type: "points", points: CITIES,    radius: 8000 },
  landmarks:  { label: "Famous Landmarks",  icon: "🗿", desc: "Iconic sites worldwide",   type: "points", points: LANDMARKS, radius: 2500 },
  flags:      { label: "Flags",             icon: "🚩", desc: "Spot the flag flying in view", type: "points", points: FLAG_SPOTS, radius: 400, jitter: 0 },
};

const LOCATION_SECTIONS = {
  "loc-grid-world":      ["world"],
  "loc-grid-continents": ["europe", "na", "sa", "asia", "africa", "oceania"],
  // Top 7 countries by land area.
  "loc-grid-countries":  ["russia", "canada", "usa", "china", "brazil", "australia", "india"],
  "loc-grid-curated":    ["cities", "landmarks", "flags"],
};

// ---------- State ----------
const state = {
  styleKey: "classic",
  locKey: null,
  config: null,        // merged style + location for the active game
  round: 0,
  totalScore: 0,
  actual: null,
  guess: null,
  guessMarker: null,
  panorama: null,
  guessMap: null,
  resultMap: null,
  timerId: null,
  timeLeft: 0,
  roundActive: false,
  usedPanoIds: new Set(),  // pano IDs already used this game; reset each new game
};

// ---------- Bootstrap Google Maps ----------
function loadGoogleMaps() {
  return new Promise((resolve, reject) => {
    if (!window.__GOOGLE_MAPS_KEY__) return reject(new Error("Maps key missing"));
    window.__gmReady = resolve;
    const s = document.createElement("script");
    s.src =
      "https://maps.googleapis.com/maps/api/js?key=" +
      encodeURIComponent(window.__GOOGLE_MAPS_KEY__) +
      "&libraries=geometry&callback=__gmReady";
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
}

// ---------- Random point picker ----------
function randomInBox(box) {
  return {
    lat: box[0] + Math.random() * (box[1] - box[0]),
    lng: box[2] + Math.random() * (box[3] - box[2]),
  };
}
function pickWeighted(items, weightFn) {
  const total = items.reduce((s, it) => s + weightFn(it), 0);
  let n = Math.random() * total;
  for (const it of items) if ((n -= weightFn(it)) <= 0) return it;
  return items[0];
}
function samplePoint(loc) {
  if (loc.type === "regions") {
    const r = pickWeighted(loc.regions, (r) => r[4]);
    return randomInBox(r);
  }
  if (loc.type === "box") return randomInBox(loc.box);
  if (loc.type === "boxes") {
    const b = pickWeighted(loc.boxes, (b) => b[4]);
    return randomInBox(b);
  }
  if (loc.type === "points") {
    const p = loc.points[Math.floor(Math.random() * loc.points.length)];
    const j = loc.jitter == null ? 0.04 : loc.jitter;
    return {
      lat: p.lat + (Math.random() - 0.5) * j,
      lng: p.lng + (Math.random() - 0.5) * j,
    };
  }
  throw new Error("Unknown location type: " + loc.type);
}

function getPanoramaAt(svc, location, radius) {
  return new Promise((resolve) => {
    svc.getPanorama(
      {
        location,
        radius,
        source: google.maps.StreetViewSource.OUTDOOR,
        preference: google.maps.StreetViewPreference.NEAREST,
      },
      (data, status) => {
        if (status === "OK" && data && data.location) {
          resolve({
            panoId: data.location.pano,
            latLng: {
              lat: data.location.latLng.lat(),
              lng: data.location.latLng.lng(),
            },
          });
        } else {
          resolve(null);
        }
      }
    );
  });
}

function isInAllowedCountries(geocoder, latLng, allowed) {
  return new Promise((resolve) => {
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status !== "OK" || !results) return resolve(false);
      for (const r of results) {
        for (const c of r.address_components || []) {
          if (c.types.includes("country") && allowed.has(c.short_name)) {
            return resolve(true);
          }
        }
      }
      resolve(false);
    });
  });
}

async function findStreetView(loc) {
  const svc = new google.maps.StreetViewService();
  const allowedList = loc.country ? [loc.country] : loc.countries;
  const allowed = allowedList ? new Set(allowedList) : null;
  const geocoder = allowed ? new google.maps.Geocoder() : null;
  const max = loc.type === "points" ? 30 : 150;

  for (let attempts = 0; attempts < max; attempts++) {
    const pano = await getPanoramaAt(svc, samplePoint(loc), loc.radius || 50000);
    if (!pano) continue;
    if (state.usedPanoIds.has(pano.panoId)) continue;  // no repeats within a game
    if (geocoder) {
      const ok = await isInAllowedCountries(geocoder, pano.latLng, allowed);
      if (!ok) continue;
    }
    state.usedPanoIds.add(pano.panoId);
    return pano;
  }
  throw new Error("Could not find Street View");
}

// ---------- Scoring ----------
function scoreFromDistanceKm(km) {
  const pts = Math.round(MAX_POINTS * Math.exp(-km / 2000));
  return Math.max(0, Math.min(MAX_POINTS, pts));
}
function distanceKm(a, b) {
  const p1 = new google.maps.LatLng(a.lat, a.lng);
  const p2 = new google.maps.LatLng(b.lat, b.lng);
  return google.maps.geometry.spherical.computeDistanceBetween(p1, p2) / 1000;
}

// ---------- UI helpers ----------
const $ = (id) => document.getElementById(id);
const show = (el) => el.classList.remove("hidden");
const hide = (el) => el.classList.add("hidden");
function setLoading(on) { on ? show($("loading")) : hide($("loading")); }
function fmtTime(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

// ---------- Timer ----------
function startTimer(seconds) {
  stopTimer();
  state.timeLeft = seconds;
  updateTimerUi();
  state.timerId = setInterval(() => {
    state.timeLeft--;
    updateTimerUi();
    if (state.timeLeft <= 0) {
      stopTimer();
      onTimeUp();
    }
  }, 1000);
}
function stopTimer() {
  if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
}
function updateTimerUi() {
  const wrap = $("timer-wrap");
  $("timer-text").textContent = fmtTime(state.timeLeft);
  const total = state.config.timePerRound;
  const pct = Math.max(0, (state.timeLeft / total) * 100);
  $("timer-fill").style.width = pct + "%";
  wrap.classList.toggle("warn",   state.timeLeft <= total * 0.33 && state.timeLeft > total * 0.15);
  wrap.classList.toggle("danger", state.timeLeft <= total * 0.15);
}
function onTimeUp() {
  if (state.roundActive) submitGuess(true);
}

// ---------- Game flow ----------
function chooseLocation(locKey) {
  state.locKey = locKey;
  const style = STYLES[state.styleKey];
  const loc = LOCATIONS[locKey];
  state.config = { ...style, location: loc };
  $("mode-label").textContent = `${style.label} · ${loc.label}`;
  $("round-total").textContent = style.rounds;
  hide($("mode-overlay"));
  startGame();
}

async function startGame() {
  state.round = 0;
  state.totalScore = 0;
  state.usedPanoIds.clear();
  $("total-score").textContent = "0";
  hide($("final-overlay"));
  hide($("result-overlay"));
  await startRound();
}

async function startRound() {
  state.round++;
  state.guess = null;
  state.roundActive = false;
  if (state.guessMarker) { state.guessMarker.setMap(null); state.guessMarker = null; }
  if (state.guessMap) { state.guessMap.setCenter({ lat: 20, lng: 0 }); state.guessMap.setZoom(1); }

  $("round-num").textContent = state.round;
  $("guess-btn").disabled = true;
  $("guess-btn").textContent = "Place a pin to guess";

  setLoading(true);
  try {
    const loc = await findStreetView(state.config.location);
    state.actual = loc.latLng;
    state.panorama.setOptions({
      linksControl: state.config.allowMove,
      clickToGo:    state.config.allowMove,
      panControl:   true,
    });
    state.panorama.setPano(loc.panoId);
    state.panorama.setPov({ heading: Math.random() * 360, pitch: 0 });
    state.panorama.setVisible(true);
  } catch (e) {
    console.error(e);
    alert("Failed to load a location. Try a different mode.");
    return;
  } finally {
    setLoading(false);
  }

  state.roundActive = true;
  startTimer(state.config.timePerRound);
}

function placeGuess(latLng) {
  if (!state.roundActive) return;
  state.guess = { lat: latLng.lat(), lng: latLng.lng() };
  if (state.guessMarker) {
    state.guessMarker.setPosition(latLng);
  } else {
    state.guessMarker = new google.maps.Marker({
      position: latLng,
      map: state.guessMap,
      animation: google.maps.Animation.DROP,
    });
  }
  $("guess-btn").disabled = false;
  $("guess-btn").textContent = "Make guess";
}

function submitGuess(timedOut = false) {
  if (!state.roundActive) return;
  state.roundActive = false;
  stopTimer();

  let km, pts;
  if (state.guess) {
    km = distanceKm(state.guess, state.actual);
    pts = scoreFromDistanceKm(km);
  } else {
    km = null;
    pts = 0;
  }
  state.totalScore += pts;
  $("total-score").textContent = state.totalScore;

  $("result-title").textContent = timedOut
    ? (state.guess ? "Time's up!" : "Time's up - no guess")
    : "Round Result";

  if (km === null) {
    $("result-distance").textContent = "—";
  } else {
    const miles = km * 0.621371;
    if (miles < 0.1) {
      $("result-distance").textContent = `${Math.round(km * 3280.84).toLocaleString()} ft`;
    } else if (miles < 100) {
      $("result-distance").textContent = `${miles.toFixed(1)} mi`;
    } else {
      $("result-distance").textContent = `${Math.round(miles).toLocaleString()} mi`;
    }
  }
  $("result-points").textContent = `+${pts.toLocaleString()}`;

  show($("result-overlay"));
  setTimeout(renderResultMap, 50);

  $("next-btn").textContent =
    state.round >= state.config.rounds ? "See final score" : "Next round";
}

function renderResultMap() {
  state.resultMap = new google.maps.Map($("result-map"), {
    center: state.actual,
    zoom: 2,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    backgroundColor: "#0b0d12",
  });

  new google.maps.Marker({
    position: state.actual,
    map: state.resultMap,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 9, fillColor: "#4ade80", fillOpacity: 1,
      strokeColor: "#fff", strokeWeight: 2,
    },
    title: "Actual",
  });

  if (state.guess) {
    new google.maps.Marker({
      position: state.guess,
      map: state.resultMap,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 9, fillColor: "#f87171", fillOpacity: 1,
        strokeColor: "#fff", strokeWeight: 2,
      },
      title: "Guess",
    });
    new google.maps.Polyline({
      path: [state.actual, state.guess],
      map: state.resultMap,
      geodesic: true,
      strokeColor: "#fff", strokeOpacity: 0.7, strokeWeight: 2,
    });
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(state.actual);
    bounds.extend(state.guess);
    state.resultMap.fitBounds(bounds, 64);
  } else {
    state.resultMap.setZoom(4);
  }
}

function nextRound() {
  hide($("result-overlay"));
  if (state.round >= state.config.rounds) {
    const max = state.config.rounds * MAX_POINTS;
    $("final-score").textContent = `${state.totalScore.toLocaleString()} / ${max.toLocaleString()}`;
    $("final-grade").textContent = gradeFor(state.totalScore / max);
    show($("final-overlay"));
    return;
  }
  startRound();
}

function gradeFor(frac) {
  if (frac >= 0.9)  return "World traveler — incredible";
  if (frac >= 0.75) return "Globetrotter";
  if (frac >= 0.55) return "Seasoned explorer";
  if (frac >= 0.35) return "Casual wanderer";
  if (frac >= 0.15) return "Lost tourist";
  return "Hopelessly lost";
}

function openModeSelect() {
  stopTimer();
  hide($("result-overlay"));
  hide($("final-overlay"));
  show($("mode-overlay"));
}

// ---------- Mode select rendering ----------
function buildLocationTile(key) {
  const loc = LOCATIONS[key];
  const btn = document.createElement("button");
  btn.className = "mode-tile";
  btn.dataset.loc = key;
  btn.innerHTML = `
    <div class="mode-icon">${loc.icon}</div>
    <div class="mode-title">${loc.label}</div>
    <div class="mode-desc">${loc.desc}</div>
  `;
  btn.addEventListener("click", () => chooseLocation(key));
  btn.addEventListener("mousemove", (e) => {
    const r = btn.getBoundingClientRect();
    btn.style.setProperty("--mx", `${e.clientX - r.left}px`);
    btn.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
  return btn;
}
function renderModeSelect() {
  for (const [gridId, keys] of Object.entries(LOCATION_SECTIONS)) {
    const grid = $(gridId);
    grid.innerHTML = "";
    for (const k of keys) grid.appendChild(buildLocationTile(k));
  }
  document.querySelectorAll("#style-segmented .seg").forEach((seg) => {
    seg.addEventListener("click", () => {
      document.querySelectorAll("#style-segmented .seg").forEach((s) => s.classList.remove("active"));
      seg.classList.add("active");
      state.styleKey = seg.dataset.style;
    });
  });
}

// ---------- Init ----------
async function init() {
  try {
    await loadGoogleMaps();
  } catch (e) {
    document.body.innerHTML =
      "<div style='padding:2rem;color:#fff;font-family:sans-serif'>" +
      "Failed to load Google Maps. Check your API key.</div>";
    return;
  }

  state.panorama = new google.maps.StreetViewPanorama($("street-view"), {
    addressControl: false,
    showRoadLabels: false,
    fullscreenControl: false,
    motionTracking: false,
    motionTrackingControl: false,
    zoomControl: true,
  });

  state.guessMap = new google.maps.Map($("guess-map"), {
    center: { lat: 20, lng: 0 },
    zoom: 1,
    disableDefaultUI: true,
    zoomControl: true,
    gestureHandling: "greedy",
    minZoom: 1,
    backgroundColor: "#0b0d12",
  });
  state.guessMap.addListener("click", (e) => placeGuess(e.latLng));

  renderModeSelect();

  $("guess-btn").addEventListener("click", () => submitGuess(false));
  $("next-btn").addEventListener("click", nextRound);
  $("play-again-btn").addEventListener("click", startGame);
  $("change-mode-btn").addEventListener("click", openModeSelect);
  $("menu-btn").addEventListener("click", () => {
    if (confirm("Return to mode select? Current game will be lost.")) openModeSelect();
  });
}

init();
