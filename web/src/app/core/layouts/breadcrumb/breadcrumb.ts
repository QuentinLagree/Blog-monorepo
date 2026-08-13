import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { IconLoaderService } from 'src/app/shared/services/icons-loader';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  templateUrl: './breadcrumb.html',
  styleUrls: ['./breadcrumb.scss'],
  imports: [RouterLink],
})
export class BreadcrumbComponent {
  protected readonly breadcrumb = inject(BreadcrumbService);
  readonly _location = inject(Location)
  private readonly _iconLoader: IconLoaderService = inject(IconLoaderService);

  goBack() {
    this._location.back()
  }
}