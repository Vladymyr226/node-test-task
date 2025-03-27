import { Module } from '@nestjs/common'
import { DatabaseService } from './database.service'
import { ConfigModule } from '@nestjs/config'
import knexfile from '../../knexfile'

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [
    DatabaseService,
    {
      provide: 'KnexConnection',
      useFactory: () => {
        return require('knex')(knexfile)
      },
    },
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
