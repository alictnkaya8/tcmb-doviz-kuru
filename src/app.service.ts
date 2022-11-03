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
    @InjectModel(Currency.name)
    private currencyModel: Model<CurrencyDocument>,
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

  async saveCurrenciesWithDate(date) {
    let arr = [];
    let currencies = await tcmb(null, date)
      .then(function (data) {
        arr = Object.values(data);
        return Promise.resolve(arr);
      })
      .catch(function (error) {
        return Promise.reject(error);
      });
    return currencies;
  }

  // @Cron('30 * * * * *')
  async save(date) {
    let counter = 1;
    let fetchedData;
    date = moment(new Date(date));

    for (let j = new Date(date).getTime(); j <= Date.now(); j += 24 * 60 * 60) {
      let formattedDate = date.format('DD/MM/YYYY');
      if (counter % 10 !== 0) {
        try {
          fetchedData = await this.saveCurrenciesWithDate(formattedDate);
        } catch (err) {
          if (err.errorCode === '703') continue;
        }
      } else {
        this.sleep('5000');
      }

      console.log(formattedDate);
      // console.log(fetchedData);

      // for (let i = 0; i < fetchedData.length; i++) {
      //   const newCurrency = new this.currencyModel({
      //     Day: date,
      //     Unit: fetchedData[i]['Unit'],
      //     Isim: fetchedData[i]['Isim'],
      //     CurrencyName: fetchedData[i]['CurrencyName'],
      //     ForexBuying: fetchedData[i]['ForexBuying'],
      //     ForexSelling: fetchedData[i]['ForexSelling'],
      //     BanknoteBuying: fetchedData[i]['BanknoteBuying'],
      //     BanknoteSelling: fetchedData[i]['BanknoteSelling'],
      //     CrossRateUSD: fetchedData[i]['CrossRateUSD'],
      //     CrossRateOther: fetchedData[i]['CrossRateOther'],
      //   });
      //   newCurrency.save();
      // }
      date = date.add(1, 'd');
      counter++;
    }
  }
  private sleep(timeOut) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), timeOut);
    });
  }
}
