import { DEFAULT_USERS } from "../netlify/lib/defaults";
import { scrapeCurrentReservations } from "../netlify/lib/scraper";
import { ALL_COURTS } from "../netlify/lib/settings";

const result = await scrapeCurrentReservations(DEFAULT_USERS, ALL_COURTS);
console.log(JSON.stringify({ today: result.today, count: result.rows.length, rows: result.rows }, null, 2));
