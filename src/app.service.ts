import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { Currency, CurrencyDocument } from './schemas/currency.schema';
const moment = require('moment');
const tcmb = require('tcmb-exchange-rates');

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Currency.name)
    private currencyModel: Model<CurrencyDocument>,
  ) {}

  async saveDailyCurrencies(date) {
    let arr = [];
    let currencies = await tcmb(null, date)
      .then((data) => {
        arr = Object.values(data);
        return Promise.resolve(arr);
      })
      .catch((error) => {
        return Promise.reject(error);
      });
    return currencies;
  }

  @Cron('*/5 * * * * *')
  async save() {
    let date;
    let fetchedData;
    date = moment(new Date('1996/04/16'));

    fetchedData = await this.currencyModel
      .find()
      .sort({ _id: -1 })
      .limit(1)
      .then((data) => {
        date = moment(new Date(data['Day'] || '1996/04/15'));
        date.add(1, 'd');
        return Promise.resolve(date);
      });

    for (let j = new Date(date).getTime(); j <= Date.now(); j += 24 * 60 * 60) {
      let formattedDate = date.format('DD/MM/YYYY');
      try {
        fetchedData = await this.saveDailyCurrencies(formattedDate);
      } catch (err) {
        if (err.errorCode === '703') continue;
        else if (err) break;
      }

      for (let i = 0; i < fetchedData.length; i++) {
        const newCurrency = new this.currencyModel({
          Day: date.format('YYYY/MM/DD'),
          Unit: fetchedData[i]['Unit'],
          Isim: fetchedData[i]['Isim'],
          CurrencyName: fetchedData[i]['CurrencyName'],
          ForexBuying: fetchedData[i]['ForexBuying'],
          ForexSelling: fetchedData[i]['ForexSelling'],
          BanknoteBuying: fetchedData[i]['BanknoteBuying'],
          BanknoteSelling: fetchedData[i]['BanknoteSelling'],
          CrossRateUSD: fetchedData[i]['CrossRateUSD'],
          CrossRateOther: fetchedData[i]['CrossRateOther'],
        });
        newCurrency.save();
      }
      date = date.add(1, 'd');
    }
  }

  // private sleep(timeOut) {
  //   return new Promise((resolve) => {
  //     setTimeout(() => resolve(true), timeOut);
  //   });
  // }
}
