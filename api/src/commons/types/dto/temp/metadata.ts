import {
    getMetadataStorage,
    ValidationArguments,
} from 'class-validator';


type DtoClass = new (...args: any[]) => object;

type SelectedValidator = {
    validator: string;
    message?: string | ((args: ValidationArguments) => string);
    constraints?: unknown[];
};

const primaryValidatorPriority = [
    'isEmail',
    'minLength',
    'maxLength',
    'isNotEmpty',
];

const secondaryValidatorPriority = [
    'isString',
    'isNumber',
    'isBoolean',
];


/**
 * Récupère les validateurs class-validator d'un DTO
 * et les groupe par propriété.
 *
 * Exemple :
 * {
 *   title: ['isLength', 'isString'],
 *   email: ['isEmail', 'isString']
 * }
 */
export const getDtoMetaData = (
    dto: DtoClass,
): Record<string, string[]> => {
    const metadataStorage = getMetadataStorage();

    const metadatas = metadataStorage.getTargetValidationMetadatas(
        dto,
        '',
        false,
        false,
    );

    const groupedValidators: Record<string, string[]> = {};

    metadatas.forEach((metadata) => {
        const propertyName = metadata.propertyName;
        const validatorName = metadata.name;

        if (!validatorName) {
            return;
        }

        if (!groupedValidators[propertyName]) {
            groupedValidators[propertyName] = [];
        }

        groupedValidators[propertyName].push(validatorName);
    });

    return groupedValidators;
};

/**
 * Sélectionne un validateur représentatif pour chaque propriété
 * selon notre ordre de priorité documentaire.
 *
 * Retourne également le message et les contraintes
 * de la ValidationMetadata correspondante.
 */
export const getDtoPropertyPriority = (
    dto: DtoClass,
): Record<string, SelectedValidator> => {
    const metadataStorage = getMetadataStorage();

    const metadatas = metadataStorage.getTargetValidationMetadatas(
        dto,
        '',
        false,
        false,
    );

    const properties = getDtoMetaData(dto);

    const result: Record<string, SelectedValidator> = {};

    Object.entries(properties).forEach(([propertyName, validators]) => {
        const selectedValidator =
            primaryValidatorPriority.find((validator) =>
                validators.includes(validator),
            ) ??
            secondaryValidatorPriority.find((validator) =>
                validators.includes(validator),
            );

        if (!selectedValidator) {
            return;
        }

        const validatorMetadata = metadatas.find(
            (metadata) =>
                metadata.propertyName === propertyName &&
                metadata.name === selectedValidator,
        );

        if (!validatorMetadata) {
            return;
        }

        result[propertyName] = {
            validator: selectedValidator,
            message: validatorMetadata.message,
            constraints: validatorMetadata.constraints,
        };
    });

    return result;
};
