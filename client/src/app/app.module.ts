import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChatModule } from './chat/chat.module';
import { SharedModule } from './shared/shared.module';
import {DialogSelectComponent} from "./chat/dialog-select/dialog-select.component";

@NgModule({
  declarations: [
    AppComponent,
    DialogSelectComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ChatModule,
    SharedModule
  ],
  providers: [],
  bootstrap: [
    AppComponent,
    DialogSelectComponent
  ]
})
export class AppModule { }
