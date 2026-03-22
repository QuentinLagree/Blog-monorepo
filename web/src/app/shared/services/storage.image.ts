// local-image.store.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalImageStore {
  private map = new Map<string, string>(); // id -> blobUrl

  add(id: string, blobUrl: string) {
    this.map.set(id, blobUrl);
  }

  get(id: string) {
    return this.map.get(id);
  }

  // important pour éviter les leaks
  revokeAll() {
    for (const url of this.map.values()) URL.revokeObjectURL(url);
    this.map.clear();
  }
}
