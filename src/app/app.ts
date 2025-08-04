import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from 'src/environments/environment';
import { HeaderComponent } from './core/layouts/templates/header/header';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [RouterOutlet, HeaderComponent],
  styleUrls: ['./app.scss'],
  standalone: true
})
export class AppComponent {
  prod: boolean = environment.production;
}
