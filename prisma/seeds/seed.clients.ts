// prisma/seeds/seedClients.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Minimal real-world locations (country → state → city → sample ZIP)
// Names match what you'd find in countriesnow (en-US names).
const LOCATIONS = [
  {
    country: "Indonesia",
    cc: "+62",
    states: [
      { name: "DKI Jakarta", cities: [{ name: "Jakarta", zips: ["10110", "10210", "10310"] }] },
      { name: "West Java", cities: [{ name: "Bandung", zips: ["40111", "40112"] }] },
      { name: "East Java", cities: [{ name: "Surabaya", zips: ["60111", "60231"] }] },
      { name: "Bali", cities: [{ name: "Denpasar", zips: ["80113", "80227"] }] },
    ],
  },
  {
    country: "Philippines",
    cc: "+63",
    states: [
      {
        name: "Metro Manila",
        cities: [
          { name: "Manila", zips: ["1000", "1001"] },
          { name: "Quezon City", zips: ["1101", "1102"] },
        ],
      },
      { name: "Cebu", cities: [{ name: "Cebu City", zips: ["6000", "6001"] }] },
    ],
  },
  {
    country: "United States",
    cc: "+1",
    states: [
      {
        name: "California",
        cities: [
          { name: "San Diego", zips: ["92101", "92103"] },
          { name: "San Francisco", zips: ["94103", "94107"] },
          { name: "Los Angeles", zips: ["90012", "90017"] },
        ],
      },
      { name: "New York", cities: [{ name: "New York", zips: ["10001", "10003"] }] },
      {
        name: "Texas",
        cities: [
          { name: "Austin", zips: ["78701", "78702"] },
          { name: "Houston", zips: ["77002", "77003"] },
          { name: "Dallas", zips: ["75201", "75202"] },
        ],
      },
    ],
  },
  {
    country: "Germany",
    cc: "+49",
    states: [
      { name: "Berlin", cities: [{ name: "Berlin", zips: ["10115", "10117"] }] },
      { name: "Bavaria", cities: [{ name: "Munich", zips: ["80331", "80333"] }] },
    ],
  },
  {
    country: "Netherlands",
    cc: "+31",
    states: [
      { name: "North Holland", cities: [{ name: "Amsterdam", zips: ["1012", "1017"] }] },
      { name: "South Holland", cities: [{ name: "Rotterdam", zips: ["3011", "3012"] }] },
    ],
  },
  {
    country: "Australia",
    cc: "+61",
    states: [
      { name: "New South Wales", cities: [{ name: "Sydney", zips: ["2000", "2007"] }] },
      { name: "Victoria", cities: [{ name: "Melbourne", zips: ["3000", "3004"] }] },
      { name: "Queensland", cities: [{ name: "Brisbane", zips: ["4000", "4006"] }] },
      { name: "Western Australia", cities: [{ name: "Perth", zips: ["6000", "6005"] }] },
    ],
  },
  {
    country: "Canada",
    cc: "+1",
    states: [
      { name: "Ontario", cities: [{ name: "Toronto", zips: ["M5H", "M4B"] }] },
      { name: "British Columbia", cities: [{ name: "Vancouver", zips: ["V6B", "V5K"] }] },
      { name: "Quebec", cities: [{ name: "Montreal", zips: ["H2Y", "H3B"] }] },
      { name: "Alberta", cities: [{ name: "Calgary", zips: ["T2P", "T2G"] }] },
    ],
  },
  {
    country: "United Kingdom",
    cc: "+44",
    states: [
      {
        name: "England",
        cities: [
          { name: "London", zips: ["SW1A 1AA", "EC1A 1BB"] },
          { name: "Manchester", zips: ["M1 1AA", "M2 5DB"] },
        ],
      },
      { name: "Scotland", cities: [{ name: "Edinburgh", zips: ["EH1 1YZ", "EH2 2YY"] }] },
      { name: "Wales", cities: [{ name: "Cardiff", zips: ["CF10 1AA", "CF11 6AB"] }] },
      { name: "Northern Ireland", cities: [{ name: "Belfast", zips: ["BT1 5GS", "BT2 8BG"] }] },
    ],
  },
];

const FIRST_NAMES = [
  "John",
  "Jane",
  "Michael",
  "Sarah",
  "David",
  "Emily",
  "Daniel",
  "Olivia",
  "James",
  "Sophia",
  "Liam",
  "Emma",
  "Noah",
  "Ava",
  "Ethan",
  "Mia",
  "Lucas",
  "Isabella",
  "Mason",
  "Amelia",
];
const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randDigits(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
}
function randomPhone(cc: string): string {
  const coreLen = cc === "+1" ? 10 : 11;
  return `${cc}${randDigits(coreLen)}`;
}
function randomPersonName(): string {
  return `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`;
}

export const seedClients = async () => {
  const count = 30;
  const createdPhones = new Set<string>();

  for (let i = 0; i < count; i++) {
    const country = rand(LOCATIONS);
    const state = rand(country.states);
    const city = rand(state.cities);
    const zipcode = rand(city.zips);
    const name = randomPersonName();

    let phone = randomPhone(country.cc);
    while (createdPhones.has(phone)) phone = randomPhone(country.cc);
    createdPhones.add(phone);

    const data = {
      photo: "",
      name,
      country: country.country,
      state: state.name,
      city: city.name,
      zipcode,
      phone,
      address: `${city.name}, ${state.name}, ${country.country}`,
    };

    await prisma.clients.upsert({
      where: { phone: data.phone },
      update: data,
      create: data,
    });
  }

  console.log(`✅ Clients seeded: ${createdPhones.size}`);
};

if (require.main === module) {
  seedClients()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
