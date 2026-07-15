import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Message } from 'src/app/shared/types/message.type';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { options } from 'marked';

const API_URL = environment.apiUrl;

export interface HttpOptions {
  credentials?: boolean,
  context?: HttpContext
}

/* eslint-disable @typescript-eslint/no-explicit-any */
@Injectable({ providedIn: 'root' })
export class HttpRequestService {
  private http: HttpClient = inject(HttpClient);

  getData(url: string, optionsParam?: HttpOptions): Observable<Message> {
    let options = {}

    options = {
      withCredentials: true,
      ...optionsParam,
    };
    return this.http.get<Message>(API_URL + url, options ?? null);
  }

  postData(url: string, data: any, optionsParam?: HttpOptions): Observable<Message> {
    let options = {}

    options = {
      withCredentials: true,
      ...optionsParam,
    };
    return this.http.post<Message>(API_URL + url, data, options);
  }

  updateData(url: string, data: any, optionsParam?: HttpOptions): Observable<Message> {
    let options = {}

    options = {
      withCredentials: true,
      ...optionsParam,
    };
    return this.http.put<Message>(API_URL + url, data, options);
  }
  deleteData(url: string, optionsParam?: HttpOptions): Observable<Message> {
    let options = {}

    options = {
      withCredentials: true,
      ...optionsParam,
    };
    
    return this.http.delete<Message>(API_URL + url, options);
  }
  patchData(url: string, data: any, optionsParam?: HttpOptions): Observable<Message> {
    let options = {}

    options = {
      withCredentials: true,
      ...optionsParam,
    };
    return this.http.patch<Message>(API_URL + url, data, options);
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
