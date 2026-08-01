import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Data } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { SeoService } from '../../services/seo/seo.service';
import { BlogPostMeta } from '../../services/blog-post.resolver';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'wil-blog-post',
  templateUrl: './post.component.html',
  standalone: true,
  imports: [MarkdownModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);
  private readonly routeData = toSignal(this.route.data, { initialValue: {} as Data });
  private readonly blogPost = computed<BlogPostMeta | null>(
    () => (this.routeData()['blogPost'] as BlogPostMeta | null | undefined) ?? null
  );

  public readonly postId = computed(() => this.blogPost()?.id ?? null);
  public readonly content = computed(() => this.blogPost()?.content ?? '');

  constructor() {
    effect(() => {
      const blogPost = this.blogPost();

      if (!blogPost) {
        return;
      }

      this.seoService.updateSeoTags({
        title: blogPost.title,
        description: blogPost.description,
        image: blogPost.image,
      });
    });
  }
}
