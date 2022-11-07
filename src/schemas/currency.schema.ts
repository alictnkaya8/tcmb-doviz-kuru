import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CurrencyDocument = Currency & Document;

@Schema()
export class Currency {
  @Prop()
  symbol: string;

  @Prop()
  unit: string;

  @Prop()
  name: string;

  @Prop()
  forex_buying: number;

  @Prop()
  forex_selling: number;

  @Prop()
  banknote_buying: number;

  @Prop()
  banknote_selling: number;

  @Prop()
  cross_rate_usd: number;

  @Prop()
  cross_rate_other: number;
}

export const CurrencySchema = SchemaFactory.createForClass(Currency);
