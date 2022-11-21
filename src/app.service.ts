import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
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

  readAll() {
    return this.currenciesModel.find();
  }
  async getCurrencies(date: string) {
    let parsedDate;

    if (date && typeof date !== 'string') return;

    if (
      date &&
      typeof date === 'string' &&
      date.length !== 10 &&
      date.toLowerCase() !== 'today'
    )
      return;

    if (date && typeof date === 'string' && date.length === 10)
      parsedDate = this.dateParser(date);

    const fetchedData = await this.currenciesModel.findOne({
      day: `${parsedDate[2]}/${parsedDate[1]}/${parsedDate[0]}`,
    });

    if (!fetchedData)
      throw new NotFoundException('currencies for this day not found!');

    return fetchedData;
  }

  @Cron('* * 17 * * *')
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

  @Cron(CronExpression.EVERY_10_SECONDS)
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
          'Dönen tarihe ait kayit db de olduğu için geçmiş datalari dönen cronjob durdurulmali!!!',
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
    const currencies = await tcmb(null, date)
      .then((data) => {
        arr = Object.values(data);
        return Promise.resolve(arr);
      })
      .catch((error) => {
        return Promise.reject(error);
      });
    return currencies;
  }

  private dateMatch(date) {
    // if it is string and format is correct, for returned array: array[1] is day 'DD', array[2] is month 'MM', array[3] is year 'YYYY'
    // if the format is 'dd-mm-yyyy' accept 2 digits, dash (-), 2 digits, dash(-) and 4 digits.
    if (date.indexOf('-') !== -1) return date.match(/(\d{2})-(\d{2})-(\d{4})/);
    return;
  }

  private dateControl(matchedDate, currentDate, minYear) {
    if (!matchedDate || !Array.isArray(matchedDate)) return;

    if (matchedDate && Array.isArray(matchedDate) && matchedDate.length !== 4)
      return;

    // Year check: Check if the year is smaller than 4 digits or smaller than minimum year or it is greater than current year.
    if (
      matchedDate[3].length < 4 ||
      matchedDate[3] < minYear ||
      matchedDate[3] > currentDate[2]
    )
      return;

    // Month check: Check if the month is smaller than 2 digits or it's a value like 0, -1 etc. or it is greater than 12.
    if (matchedDate[2].length < 2 || matchedDate[2] < 1 || matchedDate[2] > 12)
      return;

    // Day check: Check if the day is smaller than 2 digits or it's a value like 0, -1 etc. or its value is greater than 31 or greater than 30 on april, june, september, november.
    if (
      matchedDate[1].length < 2 ||
      matchedDate[1] < 1 ||
      matchedDate[1] > 31 ||
      (['04', '06', '09', '11'].indexOf(matchedDate[2]) > -1 &&
        matchedDate[1] > 30)
    )
      return;

    // February check: Check if it is february and its value is greater than 29 or check if the year is dividable by for and its value is greater than 28.
    if (
      (matchedDate[2] === '02' && matchedDate[1] > 29) ||
      (matchedDate[2] === '02' &&
        matchedDate[1] > 28 &&
        matchedDate[3] % 4 !== 0)
    )
      return;

    // Current day check: If the day, month, year match return 'today'.
    if (
      matchedDate[1] === currentDate[0] &&
      matchedDate[2] === currentDate[1] &&
      matchedDate[3] === currentDate[2].toString()
    )
      return 'today';

    // return [DD, MM, YY]
    return [matchedDate[1], matchedDate[2], matchedDate[3]];
  }

  private dateParser(date) {
    // Get current day.
    const todayNumber = new Date().getDate();
    // Make the day string and if it is smaller than 10, make it two digits.
    const today =
      todayNumber < 10 ? '0' + todayNumber.toString() : todayNumber.toString();

    // Get current month. January is 0 with getMonth(), thus we added 1.
    const thisMonthNumber = new Date().getMonth() + 1;

    const thisMonth =
      thisMonthNumber < 10
        ? '0' + thisMonthNumber.toString()
        : thisMonthNumber.toString();
    // Get current year.
    const thisYear = new Date().getFullYear();
    // TCMB api have no data before 1996.
    const minYear = 1996;

    const matchedDate = this.dateMatch(date);

    const validDate = this.dateControl(
      matchedDate,
      [today, thisMonth, thisYear],
      minYear,
    );

    return validDate;
  }
}
