import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PaginatorComponent } from '@src/app/shared/ui/paginator/paginator';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb';
import { PostCard } from 'src/app/shared/ui/card/post-card/post-card';
import { HeaderContentComponent } from "src/app/shared/ui/content/header-content/header-content";
import { HeaderSectionComponent } from "src/app/shared/ui/content/header-section/header-section";
import { EmptyStateComponent } from "src/app/shared/ui/content/states/empty-state/empty-state";
import { LoadingStateComponent } from "src/app/shared/ui/content/states/loading-state/loading-state";
import { HomeArticlesComponent } from "./home-articles/home-articles";

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  imports: [HeaderContentComponent, HeaderSectionComponent, HomeArticlesComponent],
})
export class HomeComponent {
  public readonly _router = inject(Router);
  private readonly _breadCrumb = inject(BreadcrumbService)

  constructor () {
    this._breadCrumb.set([{
      label: "Acceuil",
      url: '/home'
    }])
  }

  
}