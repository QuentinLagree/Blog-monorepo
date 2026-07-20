import { Component, inject } from "@angular/core";
import { PostFormComponent } from "../post-form/post-form";
import { BreadcrumbService } from "src/app/shared/services/breadcrumb";

@Component({
  selector: 'app-add-post',
  template: `
    <app-form-post></app-form-post>
  `,
  imports: [
    PostFormComponent
],
})

export class PostAddComponent {
  
}