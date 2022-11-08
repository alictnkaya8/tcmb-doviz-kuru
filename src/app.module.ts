import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config/dist';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule/dist';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Currencies, CurrenciesSchema } from './schemas/currencies.schema';
import { Currency, CurrencySchema } from './schemas/currency.schema';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017'),
    // MongooseModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: async (configService: ConfigService) => {
    //     const username = configService.get('MONGO_USERNAME');
    //     const password = configService.get('MONGO_PASSWORD');
    //     const database = configService.get('MONGO_DATABASE');
    //     const host = configService.get('MONGO_HOST');

    //     return {
    //       uri: `mongodb://${username}:${password}@${host}`,
    //       dbName: database
    //     }
    //   },
    //   inject: [ConfigService]
    // }),
    MongooseModule.forFeature([
      { name: Currencies.name, schema: CurrenciesSchema },
      { name: Currency.name, schema: CurrencySchema },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
