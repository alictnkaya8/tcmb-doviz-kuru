import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule/dist';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Currencies, CurrenciesSchema } from './schemas/currencies.schema';
import { Currency, CurrencySchema } from './schemas/currency.schema';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017'),
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
