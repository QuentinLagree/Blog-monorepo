import { inject, Injectable } from '@angular/core';
import { HttpOptions, HttpRequestService } from '../../../shared/services/http-service/get-request';


export interface EmailDto {
  email: string,
}

export interface TokenEmailDto {
  email: string,
  token: string,
}

export interface ChangePasswordDto {
  email: string,
  password: string,
  confirm_password: string,
  token: string,
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _http: HttpRequestService = inject(HttpRequestService);

  getEmailForgetPassword (dto: EmailDto, options?: HttpOptions) {
    console.log("dsde")
    return this._http.postData('password/forgot', dto, {
      credentials: true,
      ...options
    });
  }

  checkResetToken(dto: TokenEmailDto, options?: HttpOptions) {
    return this._http.getData(`password/reset?token=${dto.token}&email=${dto.email}`, {
      credentials: true,
      ...options
    })
  }

  changePassword(dto: ChangePasswordDto, options?: HttpOptions) {
    return this._http.postData(`password/reset`, dto, {
      credentials: true,  
      ...options
    })
  }
}
