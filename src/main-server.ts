import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { FlexLayoutServerModule } from '@angular/flex-layout/server';
import { createSharedAppConfig } from './configs/app.config';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(), FlexLayoutServerModule],
};

const config = mergeApplicationConfig(createSharedAppConfig(), serverConfig);

const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;
