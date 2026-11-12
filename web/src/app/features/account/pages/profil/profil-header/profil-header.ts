import { DatePipe } from '@angular/common';
import { Component, input, InputSignal } from '@angular/core';
import { User } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-profil-header',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './profil-header.html',
  styleUrl: './profil-header.scss'
})
export class ProfilHeaderComponent {
  readonly user: InputSignal<User | undefined> = input.required();
}
