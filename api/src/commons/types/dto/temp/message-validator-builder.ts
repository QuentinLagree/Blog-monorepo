import { MessageValidationError } from "../message/validation-error-message";

type ValidatorConstraint = string | number | boolean;

type SelectedValidator = {
    validator: string;
    message?: string;
    constraints?: ValidatorConstraint[];
};

const replaceMessageConstraints = (
    message: string,
    constraints: ValidatorConstraint[] = [],
): string => {
    let formattedMessage = message;

    constraints.forEach((constraint, index) => {
        formattedMessage = formattedMessage.replaceAll(
            `$constraint${index + 1}`,
            String(constraint),
        );
    });

    return formattedMessage;
};

export const buildValidationMessages = (
    properties: Record  <string, SelectedValidator>,
): MessageValidationError[] => {
    return Object.entries(properties).map(([property, metadata]) => {
        const message = metadata.message
            ? replaceMessageConstraints(
                metadata.message,
                metadata.constraints,
            )
            : 'La propriété ne respecte pas les règles de validation.';

        return {
            property,
            constraints: {
                [metadata.validator]: message,
            },
        };
    });
};