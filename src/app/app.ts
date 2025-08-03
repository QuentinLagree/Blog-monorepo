import { Component, signal, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from 'src/environments/environment';
import { HeaderComponent } from "./core/layouts/templates/header/header";

@Component({
    selector: 'app-root',
    templateUrl: './app.html',
    imports: [RouterOutlet, HeaderComponent],
    styleUrls: ['./app.scss'],
    standalone: true
})
export class AppComponent {
  constructor (){}

  model = {
    firstname : ""
  }


  users: WritableSignal<any[]> = signal<any[]>([]);

  prod: boolean = environment.production

}
