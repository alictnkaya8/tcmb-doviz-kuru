import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { Currencies, CurrenciesDocument } from './schemas/currencies.schema';
import { Currency, CurrencyDocument } from './schemas/currency.schema';
const moment = require('moment');
const tcmb = require('tcmb-exchange-rates');

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Currencies.name)
    private currenciesModel: Model<CurrenciesDocument>,
    @InjectModel(Currency.name)
    private currencyModel: Model<CurrencyDocument>,
  ) {}

  async readAll() {
    return this.currenciesModel.find();
  }

  // @Cron('* * 17 * * *')
  async saveCurrentCurrencies() {
    let currentDate = new Date().getDate();
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let date = moment(new Date(currentYear, currentMonth, currentDate));
    date = date.format('DD/MM/YYYY');
    let fetchedData;

    try {
      fetchedData = await this.getCurrenciesWithDate(date);
    } catch (err) {
      if (err.errorCode != '703') {
        return;
      }
    }
    let currencyArr = await this.modifyCurrencyData(fetchedData);

    const newCurrencies = new this.currenciesModel({
      day: date,
      currencies: currencyArr,
    });
    newCurrencies.save();
  }

  @Cron('*/10 * * * * *')
  async saveCurrenciesWithDate() {
    let fetchedData;
    let dateString = '1996/04/16';
    let date = moment(new Date(dateString));

    if ((await this.currenciesModel.count()) != 0) {
      fetchedData = await this.currenciesModel
        .find()
        .sort({ _id: -1 })
        .limit(1)
        .then((data) => {
          date = moment(new Date(data[0].day));
          date.add(1, 'd');
          return Promise.resolve(date);
        });

      let foundData = await this.currenciesModel.findOne({
        day: date.format('YYYY/MM/DD'),
      });
      if (foundData) {
        console.log(
          'Dönen tarihe ait kayıt db de olduğu için geçmiş dataları dönen cronjob durdurulmalı!!!',
          date.format('YYYY/MM/DD'),
        );
        return;
      }
    }

    for (let j = 0; j < 10; j++) {
      let formattedDate = date.format('DD/MM/YYYY');
      try {
        fetchedData = await this.getCurrenciesWithDate(formattedDate);
      } catch (err) {
        if (err.errorCode != '703') {
          break;
        }
      }
      let currencyArr = await this.modifyCurrencyData(fetchedData);

      const newCurrencies = new this.currenciesModel({
        day: date.format('YYYY/MM/DD'),
        currencies: currencyArr,
      });

      newCurrencies.save();
      date.add(1, 'd');
    }
  }

  private async modifyCurrencyData(fetchedData) {
    let arr = [];
    for (let i = 0; i < fetchedData.length; i++) {
      arr.push(
        new this.currencyModel({
          symbol: fetchedData[i]['$']['CurrencyCode'],
          unit: fetchedData[i]['Unit'],
          name: fetchedData[i]['CurrencyName'],
          forex_buying: fetchedData[i]['ForexBuying'],
          forex_selling: fetchedData[i]['ForexSelling'],
          banknote_buying: fetchedData[i]['BanknoteBuying'],
          banknote_selling: fetchedData[i]['BanknoteSelling'],
          cross_rate_usd: fetchedData[i]['CrossRateUSD'],
          cross_rate_other: fetchedData[i]['CrossRateOther'],
        }),
      );
    }

    return Promise.resolve(arr);
  }

  private async getCurrenciesWithDate(date) {
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
}
