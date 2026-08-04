import { config } from 'dotenv';
import { join } from 'path';

// Populates process.env *before* AppModule's ConfigModule.forRoot() reads it (dotenv never
// overwrites a variable that's already set, so this only fills in what the shell/CI didn't
// already provide - e.g. a CI runner setting DATABASE_URL directly still wins).
config({ path: join(__dirname, '../.env.test') });
