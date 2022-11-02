import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CurrencyDocument = Currency & Document;

@Schema()
export class Currency {
  @Prop()
  unit: number;

  @Prop()
  isim: string;

  @Prop()
  currencyName: string;

  @Prop()
  forexBuying: number;

  @Prop()
  forexSelling: number;

  @Prop()
  banknoteBuying: number;

  @Prop()
  banknoteSelling: number;

  @Prop()
  crossRateUSD: number;

  @Prop()
  crossRateOther: number;
}

export const CurrencySchema = SchemaFactory.createForClass(Currency);
