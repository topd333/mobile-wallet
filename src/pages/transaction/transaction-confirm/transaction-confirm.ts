import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';

import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';

import { ArkApiProvider } from '@providers/ark-api/ark-api';
import { MarketDataProvider } from '@providers/market-data/market-data';
import { SettingsDataProvider } from '@providers/settings-data/settings-data';
import { Transaction, MarketTicker, MarketCurrency } from '@models/model';

import { Network } from 'ark-ts/model';

import lodash from 'lodash';

@IonicPage()
@Component({
  selector: 'page-transaction-confirm',
  templateUrl: 'transaction-confirm.html',
})
export class TransactionConfirmPage {

  public transaction: Transaction;
  public address: string;

  public marketCurrency: MarketCurrency;
  public ticker: MarketTicker;
  public currentNetwork: Network;

  private unsubscriber$: Subject<void> = new Subject<void>();

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private viewCtrl: ViewController,
    private arkApiProvider: ArkApiProvider,
    private marketDataProvidfer: MarketDataProvider,
    private settingsDataProvider: SettingsDataProvider,
  ) {
    let passphrases = this.navParams.get('passphrases');
    this.transaction = this.navParams.get('transaction');
    this.address = this.navParams.get('address');

    if (!this.transaction || !passphrases || !this.address) this.navCtrl.pop();

    this.currentNetwork = this.arkApiProvider.network;
  }

  broadcast() {
    this.arkApiProvider.postTransaction(this.transaction)
      .subscribe((response) => {
        this.dismiss(true);
      }, (error) => {
        this.dismiss(false, error.error);
      });
  }

  dismiss(status?: boolean, message?: string) {
    if (lodash.isUndefined(status)) return this.viewCtrl.dismiss();

    let response = { status, message };
    this.viewCtrl.dismiss(response);
  }

  private onUpdateTicker() {
    this.marketDataProvidfer.onUpdateTicker$.takeUntil(this.unsubscriber$).do((ticker) => {
      if (!ticker) return;

      this.ticker = ticker;
      this.settingsDataProvider.settings.subscribe((settings) => {
        this.marketCurrency = this.ticker.getCurrency({ code: settings.currency });
      });
    }).subscribe();
  }

  ionViewDidLoad() {
    this.onUpdateTicker();
    this.marketDataProvidfer.refreshPrice();
  }

  ngOnDestroy() {
    this.unsubscriber$.next();
    this.unsubscriber$.complete();
  }

}