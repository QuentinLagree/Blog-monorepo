import { Injectable, NotFoundException } from "@nestjs/common";
import slugify from "slugify";
import { ArticleService } from "src/modules/post/posts.service";
import { Post as Articles } from "@prisma/client";
import { PostNotFoundException } from "src/modules/post/exceptions/post-not-found.exception";
import { PostNotFoundWithSlugException } from "src/modules/post/exceptions/post-not-found-with-slug.exception";
import { SlugInvalidNumber } from "src/modules/post/exceptions/slug-invalid-number.exception";
import { SlugInvalidFormat } from "src/modules/post/exceptions/slug-invalid-format.exception";

const VALIDATE_SLUG = new RegExp("^[a-z0-9]+(?:-[a-z0-9]+)*-[0-9]+$")

@Injectable()
export class SlugService {


    constructor (
        private _post: ArticleService
    ) {
        
    }

    private isValidateSlug(slug: string): boolean {
        return VALIDATE_SLUG.test(slug);
    }


    
    public generateSlugFromArticleTitle(article_title: string, article_id: number): string {
        return slugify(article_title, {
            lower: true,
            remove: /[*+~.()'"!:@]/g,
            locale: "fr"
        }) + "-" + article_id;
    }

    public async getPostWithSlug(slug: string): Promise<Articles | null> {

        if (this.isValidateSlug(slug)) throw new SlugInvalidFormat(slug);

        const id: number = this.getIdFromSlug(slug);
        
        const article: Articles | null = await this._post.indexOneWhere({ id });
        if (!article) throw new PostNotFoundException(article.id);
        
        if (this.generateSlugFromArticleTitle(article.title, article.id) !== slug) {
            throw new PostNotFoundWithSlugException(slug);
        }
        return article;
    }    


    private getIdFromSlug(slug: string): number {
        const slug_parts: String[] = slug.split('-');
        const id_not_checked = slug_parts[slug_parts.length - 1]
        if (!Number.isSafeInteger(Number(id_not_checked))) {
            throw new SlugInvalidNumber(Number(id_not_checked));
        }

        return Number(id_not_checked);
    }
}