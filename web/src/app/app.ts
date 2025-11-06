import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from 'src/environments/environment';
import { HeaderComponent } from './core/layouts/templates/header/header';
import { ToastContainerComponent } from "./shared/ui/toast/toast";

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [RouterOutlet, HeaderComponent, ToastContainerComponent],
  styleUrls: ['./app.scss'],
  standalone: true
})
export class AppComponent {
  prod: boolean = environment.production;
}
