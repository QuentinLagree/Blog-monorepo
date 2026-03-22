import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Message } from 'src/app/core/models/message.model';

const API_URL = 'http://localhost:3000/';

export interface HttpOptions {
  credentials?: boolean,
  context?: HttpContext
}

/* eslint-disable @typescript-eslint/no-explicit-any */
@Injectable({ providedIn: 'root' })
export class HttpRequestService {
  private http: HttpClient = inject(HttpClient);

  getData(url: string, optionsParam?: HttpOptions): Observable<Message> {
    let options = {};

    if (optionsParam) {
      options = {
        ...optionsParam,
        withCredentials: true
      };
    }
    return this.http.get<Message>(API_URL + url, options ?? null);
  }

  postData(url: string, data: any, optionsParam?: HttpOptions): Observable<Message> {
    let options = {};

    if (optionsParam) {
      options = {
        ...options,
        withCredentials: true
      };
    }
    return this.http.post<Message>(API_URL + url, data, options);
  }

  updateData(url: string, data: any): Observable<Message> {
    return this.http.put<Message>(API_URL + url, data);
  }
  deleteData(url: string): Observable<Message> {
    return this.http.delete<Message>(API_URL + url);
  }
  patchData(url: string, data: any): Observable<Message> {
    return this.http.patch<Message>(API_URL + url, data);
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
