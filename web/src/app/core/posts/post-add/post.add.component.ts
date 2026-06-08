import { Component } from "@angular/core";
import { PostFormComponent } from "../post-form/post-form";

@Component({
  selector: 'app-add-post',
  template: `
    <app-form-post></app-form-post>
  `,
  imports: [
    PostFormComponent
],
})

export class PostAddComponent {}