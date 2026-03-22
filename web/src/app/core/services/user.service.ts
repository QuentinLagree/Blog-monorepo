import { inject, Injectable } from '@angular/core';
import { HttpOptions, HttpRequestService } from '../../shared/services/http-service/get-request';
import { userRegister } from '../auth/models/user-register.model';
import { userLogin } from '../auth/models/user-login.model';


export interface User {
  id: number,
  email: string,
  pseudo?: string
  nom?: string
  prenom?: string
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly _http: HttpRequestService = inject(HttpRequestService);

  getAllUsers(options?: HttpOptions) {
    return this._http.getData('user', options);
  }

  findUserWithId(id: number, options?: HttpOptions) {
    return this._http.getData(`user/${id}`, options)
  }

  registerUser(dto: userRegister, options?: HttpOptions) {
    return this._http.postData('auth/register', dto);
  }

  loginUser(dto: userLogin, options?: HttpOptions) {
    return this._http.postData('auth/login', dto, {
      credentials: true,
      ...options
    });
  }

  checkSessionActive(options?: HttpOptions) {
    return this._http.getData('auth/session', {
      credentials: true,
      ...options
    });
  }

  logout(options?: HttpOptions) {
    return this._http.getData('auth/logout', {
      credentials: true,
      ...options
    });
  }
}
