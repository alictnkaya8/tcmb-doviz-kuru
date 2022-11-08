import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { exit } from 'process';
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
        exit();
      }
    }

    let currencyArr = await this.modifyCurrencyData(fetchedData);

    const newCurrencies = new this.currenciesModel({
      day: date,
      currencies: currencyArr,
    });
    console.log(newCurrencies);
  }

  @Cron('*/30 * * * * *')
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
    }

    for (let i = 0; i < 5; i++) {
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
    for (let j = 0; j < fetchedData.length; j++) {
      arr.push(
        new this.currencyModel({
          symbol: fetchedData[j]['$']['CurrencyCode'],
          unit: fetchedData[j]['Unit'],
          name: fetchedData[j]['CurrencyName'],
          forex_buying: fetchedData[j]['ForexBuying'],
          forex_selling: fetchedData[j]['ForexSelling'],
          banknote_buying: fetchedData[j]['BanknoteBuying'],
          banknote_selling: fetchedData[j]['BanknoteSelling'],
          cross_rate_usd: fetchedData[j]['CrossRateUSD'],
          cross_rate_other: fetchedData[j]['CrossRateOther'],
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
