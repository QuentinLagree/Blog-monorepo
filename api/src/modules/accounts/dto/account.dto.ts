import { User } from "@prisma/client";
import { AccountEntity } from "../entities/account.entities";
import { IsNotEmpty, IsNumber, IsString, IsUrl } from "class-validator";

export class AccountDto extends AccountEntity {
    
    
    user_id: number;
    user: User
    @IsUrl()
    @IsString()
    avatar_profil: string | null;
    @IsNumber()
    @IsNotEmpty()
    followees_count: number;
    @IsNumber()
    @IsNotEmpty()
    followers_count: number;

    
}