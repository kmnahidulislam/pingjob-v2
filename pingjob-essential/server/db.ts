// REDIRECT ALL DATABASE CONNECTIONS TO CLEAN NEON.TECH
import { cleanPool as pool, cleanDb as db } from './clean-neon';

export { pool, db };