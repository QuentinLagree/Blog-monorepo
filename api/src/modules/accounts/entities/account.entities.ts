import { ApiProperty } from "@nestjs/swagger";
import { Account, User } from "@prisma/client";

export class AccountEntity implements Account {
    @ApiProperty()
    id: number;
    @ApiProperty()
    user_id: number;
    @ApiProperty()
    user: User
    @ApiProperty()
    followees_count: number;
    @ApiProperty()
    followers_count: number;
    @ApiProperty()
    avatar_profil: string | null;
    @ApiProperty()
    theme: string;
    @ApiProperty()
    language: string;
    //TODO Followers et Followees - Object de Follows
    @ApiProperty()
    created_at: Date;
    @ApiProperty()
    updated_at: Date;

    constructor (partial: Partial<AccountEntity>) {
        Object.assign(this, partial)
    }

}