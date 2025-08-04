import { InputConfig } from "../../models/input-config.model";
import { InputPasswordType } from "./input-password-type";

export interface InputPasswordConfig extends InputConfig {
    type: InputPasswordType,
    showPassword?: boolean
    displayStrenghMeterPassword?: boolean
}