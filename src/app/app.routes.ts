import { Routes } from "@angular/router";
import { AuthGuard } from "./core/auth/guards/auth.guard";

export const appRoutes: Routes = [
    {path: '', redirectTo: '/auth/login', pathMatch: 'full'},
    {path: 'ui', 
    loadComponent: () => import('./shared/ui/base-ui').then(m => m.UIComponent) }
];
