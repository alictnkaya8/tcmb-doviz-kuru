import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @Get()
  // saveCurrencies() {
  //   return this.appService.saveCurrenciesWithDate();
  // }

  @Get(':date')
  getCurrencies(@Param('date') date: string) {
    return this.appService.getCurrencies(date);
  }

  // @Get()
  // saveCurrentCurrencies() {
  //   return this.appService.saveCurrentCurrencies();
  // }
}
