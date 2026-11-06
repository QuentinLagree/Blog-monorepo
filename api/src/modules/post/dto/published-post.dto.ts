import { IsDateString, IsNotEmpty } from "class-validator";

export class PublishedPostDto {

    @IsDateString({}, {
        message: "La date de publication doit être valide."
    })
    @IsNotEmpty({
        message: "La date de publication doit être définie."
    })
    published_at: Date;
}