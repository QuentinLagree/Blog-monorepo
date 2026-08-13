import { Injectable, signal } from '@angular/core';


export type BreadcrumbItem = {
  label: string;
  url?: string;
};

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private readonly _items = signal<BreadcrumbItem[]>([]);


  private readonly homeItem: BreadcrumbItem = {
    label: 'Accueil',
    url: '/home',
  };

  private readonly articleItem: BreadcrumbItem = {
    label: 'Articles',
    url: '/',
  };

  items = this._items.asReadonly();

  set(items: BreadcrumbItem[]): void {
    this._items.set(items);
  }

  clear(): void {
    this._items.set([]);
  }

  setWithHome(items: BreadcrumbItem[]): void {
    this._items.set([
      this.homeItem,
      ...items,
    ]);
  }

  setWithArticle(items: BreadcrumbItem[]): void {
    this._items.set([
      this.homeItem,
      this.articleItem,
      ...items,
    ]);
  }
}