import { Injectable } from "@angular/core";
import { HttpRequestService } from "../../shared/services/http-service/get_request.service";
import { BehaviorSubject, catchError, filter, map, Observable, of, take } from "rxjs";
import { Message } from "../models/message.model";
import { userRegister } from "../auth/models/user-register.model";
import { userLogin } from "../auth/models/user-login.model";



@Injectable({ providedIn: 'root' })
export class UserService {

    constructor(private readonly _http: HttpRequestService) {}

    getAllUsers() {
            return this._http.getData("user");
    }

    registerUser(dto: userRegister) {
        return this._http.postData("auth/register", dto);
    }

    loginUser(dto: userLogin) {
        return this._http.postData("auth/login", dto, true);
    }

    checkSessionActive() {
        return this._http.getData("auth/session", true);
    }

    logout() {
        return this._http.getData('auth/logout', true);
    }
}