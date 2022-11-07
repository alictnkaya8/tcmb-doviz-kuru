import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CurrencyDocument = Currency & Document;

@Schema()
export class Currency {
  @Prop()
  Day: string;

  @Prop()
  Currencies: object[];
}

export const CurrencySchema = SchemaFactory.createForClass(Currency);
