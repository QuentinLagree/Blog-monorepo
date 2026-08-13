import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { HeaderContentComponent } from "src/app/shared/ui/content/header-content/header-content";
import { HeaderSectionComponent } from "src/app/shared/ui/content/header-section/header-section";
import { HomeArticlesComponent } from "./home-articles/home-articles";
import { LoginModalComponent } from "src/app/shared/helpers/modal/login-modal/login-modal";

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  imports: [HeaderContentComponent, HeaderSectionComponent, HomeArticlesComponent],
})
export class HomeComponent  {
  public readonly _router = inject(Router);
  private readonly _breadCrumb = inject(BreadcrumbService)

  constructor () {
    this._breadCrumb.set([{
      label: "Acceuil",
      url: '/home'
    }])
  }

  
}