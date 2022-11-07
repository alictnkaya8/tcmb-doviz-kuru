import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CurrenciesDocument = Currencies & Document;

@Schema()
export class Currencies {
  @Prop()
  day: string;

  @Prop()
  currencies: object[];
}

export const CurrenciesSchema = SchemaFactory.createForClass(Currencies);
