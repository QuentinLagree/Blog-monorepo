import { Injectable, NotFoundException } from "@nestjs/common";
import slugify from "slugify";
import { ArticleService } from "src/modules/post/posts.service";
import { Post as Articles } from "@prisma/client";
import { NumberNotCorrectFormat } from "../exceptions/NumberNotCorrectFormat.error";

const VALIDATE_SLUG = new RegExp("^[a-z0-9]+(?:-[a-z0-9]+)+-[0-9]*$")

@Injectable()
export class SlugService {


    constructor (
        private _post: ArticleService
    ) {
        
    }

    public isValidateSlug(slug: string): boolean {
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
        const slug_parts: String[] = slug.split('-');
        const id_not_checked = slug_parts[slug_parts.length - 1]
        if (!Number.isSafeInteger(Number(id_not_checked))) {
            throw new NumberNotCorrectFormat();
        }

        const id: number = Number(id_not_checked);
        console.log(id);
        const article: Articles | null = await this._post.indexOneWhere({ id });
        if (!article || !article.published_at) throw new NotFoundException();
        if (this.generateSlugFromArticleTitle(article.title, article.id) !== slug) {
            throw new NotFoundException();
        }
        return article;
    }    
}