import { AppComponent } from './app/app';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { appRoutes } from './app/app.routes';
import { authRoutes } from './app/core/auth/auth.routes';
import { provideAnimations } from '@angular/platform-browser/animations';



bootstrapApplication(AppComponent, {
  providers: [
    provideRouter([...appRoutes, ...authRoutes]),
    provideAnimations(),
    provideHttpClient(),  
  ]
});