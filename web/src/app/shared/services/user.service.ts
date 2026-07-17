import { inject, Injectable } from '@angular/core';
import { HttpOptions, HttpRequestService } from './http-service/get-request';
import { userRegister } from '../../core/auth/models/user-register.model';
import { userLogin } from '../../core/auth/models/user-login.model';


export interface User {
  id: number,
  email: string,
  pseudo?: string
  nom?: string
  prenom?: string
  created_at: Date
  role: 'user' | 'admin'
}

export const Role = {
  user: 'Utilisateur',
  admin: 'Administrateur',
}


@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly _http: HttpRequestService = inject(HttpRequestService);

  asUser (value: unknown): User {
    return value as User;
  }
  

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
    return this._http.postData('auth/logout', {
      credentials: true,
      ...options
    });
  }

}
