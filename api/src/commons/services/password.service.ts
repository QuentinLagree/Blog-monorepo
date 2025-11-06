import 'dotenv/config';
import { Injectable } from "@nestjs/common";
import argon2, { argon2id } from 'argon2';
import { PEPPER } from "../constants/pepper";

@Injectable()
export class PasswordService {

    constructor() { 

        this.getOptions()
    }

    private getOptions() {
        const memoryCost = Number(process.env['ARGON2_MEMORY_KIB']) || 64 * 1024
        const timeCost = Number(process.env["ARGON2_TIME"]) || 3
        const parallelism = Number(process.env["ARGON2_PARALLELISM"]) || 1
        const hashLength = Number(process.env["ARGON2_HASHLEN"]) || 32
        const saltLength = Number(process.env["ARGON2_SALTLEN"]) || 16
        return {
            type: argon2id,
            memoryCost,
            timeCost,
            parallelism,
            hashLength,
            saltLength,
        } as const;

    }

    async hashPassword(plainPassword: string): Promise<string> {
        console.log(PEPPER?.length)
        return argon2.hash(plainPassword + PEPPER, this.getOptions())
    }

    async verifyPassword(storedHash: string, candidate: string): Promise<boolean> {
        try {
            return await argon2.verify(storedHash, candidate + PEPPER);
        } catch {
            return false;
        }
    }

    async needsRehash(storedHash: string): Promise<boolean> {
    // note : argon2.needsRehash peut parfois réclamer un cast selon la version de la lib
    return await (argon2 as any).needsRehash(storedHash, this.getOptions());
  }

}