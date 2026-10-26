import { DEFAULT_USERS } from "../netlify/lib/defaults";
import { scrapeCurrentReservations } from "../netlify/lib/scraper";

const result = await scrapeCurrentReservations(DEFAULT_USERS);
console.log(JSON.stringify({ today: result.today, count: result.rows.length, rows: result.rows }, null, 2));
