import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CurrencyDocument = Currency & Document;

@Schema()
export class Currency {
  @Prop()
  Day: string;

  @Prop()
  Unit: number;

  @Prop()
  Isim: string;

  @Prop()
  CurrencyName: string;

  @Prop()
  ForexBuying: number;

  @Prop()
  ForexSelling: number;

  @Prop()
  BanknoteBuying: number;

  @Prop()
  BanknoteSelling: number;

  @Prop()
  CrossRateUSD: number;

  @Prop()
  CrossRateOther: number;
}

export const CurrencySchema = SchemaFactory.createForClass(Currency);
