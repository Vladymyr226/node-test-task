import { Inject, Injectable } from '@nestjs/common'
import { Knex } from 'knex'

@Injectable()
export class DatabaseService {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}

  getKnex(): Knex {
    return this.knex
  }

  async migrate(): Promise<void> {
    await this.knex.migrate.latest()
  }
}
