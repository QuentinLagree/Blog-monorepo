import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/commons/prisma/prisma.service';
import { UpdateUserPreferenceDto } from '../user-preferences/dto/update-preferences.user.dto';
import { USER_PREFERENCE_FIELDS, UserPreferenceField } from './helper/user.preferences.fields';
import { InvalidPreferenceFieldException } from './exceptions/invalid-preference-field.exception';

@Injectable()
export class UserPreferenceService {
    constructor(
        private readonly _prisma: PrismaService,
    ) { }

    async getPreferences(
        userId: number,
        fields?: string,
    ): Promise<Record<string, unknown>> {
        const select = this.buildSelect(fields);

        return this._prisma.userPreference.upsert({
            where: {
                userId,
            },
            create: {
                userId,
            },
            update: {},
            select,
        });
    }

    async updatePreferences(
        userId: number,
        payload: UpdateUserPreferenceDto,
    ) {
        return this._prisma.userPreference.upsert({
            where: {
                userId,
            },
            create: {
                userId,
                ...payload,
            },
            update: payload,
        });
    }

    private buildSelect(
        fields?: string,
    ): Prisma.UserPreferenceSelect {
        if (!fields) {
            return {
                theme: true,
                language: true,
                fontSize: true,
                reduceAnimations: true,
                showReadingTime: true,
                showAuthorDetails: true,
                hideReadPosts: true,
                notifyOnLike: true,
                notifyOnContribution: true,
                emailNotifications: true,
                newsletter: true,
                profileVisible: true,
                showLikedPosts: true,
                showContributions: true,
            };
        }

        const requestedFields = fields
            .split(',')
            .map((field) => field.trim())
            .filter(Boolean);

        const invalidFields = requestedFields.filter(
            (field) =>
                !USER_PREFERENCE_FIELDS.includes(
                    field as UserPreferenceField,
                ),
        );

        if (invalidFields.length > 0) {
            throw new InvalidPreferenceFieldException(
                invalidFields,
            );
        }

        return requestedFields.reduce<Prisma.UserPreferenceSelect>(
            (select, field) => {
                select[field as UserPreferenceField] = true;

                return select;
            },
            {},
        );
    }

    async isProfileVisible(
        userId: number,
    ): Promise<boolean> {
        const preference =
            await this._prisma.userPreference.findUnique({
                where: {
                    userId,
                },
                select: {
                    profileVisible: true,
                },
            });
        return preference?.profileVisible ?? true;
    }
}