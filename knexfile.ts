import { Knex } from 'knex'
import 'dotenv/config'

const { DATABASE_URL } = process.env

const config: Knex.Config = {
  client: 'postgresql',
  connection: {
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: './src/database/migrations',
    tableName: 'knex_migrations',
  },
}

export default config
