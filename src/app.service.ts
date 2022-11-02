import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { SchedulerRegistry } from '@nestjs/schedule/dist';
import { Model } from 'mongoose';
import { Currency, CurrencyDocument } from './schemas/currency.schema';
const moment = require('moment');
const tcmbDovizKuru = require('tcmb-doviz-kuru');
const tcmb = require('tcmb-exchange-rates');

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Currency.name) private currencyModel: Model<CurrencyDocument>,
    private scheduleRegistry: SchedulerRegistry,
  ) {}

  async getCurrency() {
    let arr = [];
    await new Promise((resolve, reject) => {
      function cb(error, data) {
        if (error) {
          console.log('error', error);
        }
        arr = data.tarihDate.currency;
        resolve('aqaq');
      }
      tcmbDovizKuru(cb);
    });
    return arr;
  }

  // @Cron('30 * * * * *')
  async save() {
    let fetchedData = await this.getCurrency();
    console.log(fetchedData);

    for (let i = 0; i < fetchedData.length; i++) {
      const newCurrency = new this.currencyModel({
        unit: fetchedData[i]['unit'],
        isim: fetchedData[i]['isim'],
        currencyName: fetchedData[i]['currencyName'],
        forexBuying: fetchedData[i]['forexBuying'],
        forexSelling: fetchedData[i]['forexSelling'],
        banknoteBuying: fetchedData[i]['banknoteBuying'],
        banknoteSelling: fetchedData[i]['banknoteSelling'],
        crossRateUSD: fetchedData[i]['crossRateUSD'],
        crossRateOther: fetchedData[i]['crossRateOther'],
      });
      newCurrency.save();
    }
  }

  get() {
    let startDate = moment(new Date('1996/04/16'));
    startDate.add(1, 'd');
    startDate = startDate.format('DD/MM/YYYY');
    const today = Date.now();
    console.log(startDate);
    console.log();

    tcmb(null, startDate)
      .then(function (data) {
        console.log(data);
      })
      .catch(function (error) {
        console.log(error);
      });
  }
}
