import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  templateUrl: './breadcrumb.html',
  styleUrls: ['./breadcrumb.scss'],
  imports: [RouterLink],
})
export class BreadcrumbComponent {
  protected readonly breadcrumb = inject(BreadcrumbService);
}