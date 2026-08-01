import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FlexModule } from '@angular/flex-layout';
import { DonateComponent } from '../../ui/donate/donate.component';
import { SeoService } from '../../services/seo/seo.service';

type BlogPostLink = Readonly<{
  id: string;
  title: string;
}>;

@Component({
  selector: 'wil-blog',
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, FlexModule, DonateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);

  public readonly posts: readonly BlogPostLink[] = [
    { id: 'what-is-the-wheel-of-life', title: 'What Is the Wheel of Life?' },
    {
      id: 'why-do-i-feel-stuck',
      title: 'Feeling Stuck? Try This 10-Minute Self-Reflection Tool That Actually Shows You Why',
    },
    {
      id: 'wheel-of-life-categories-for-teamleads',
      title: 'Wheel of Life: 5 Sets of Categories for Coaching, Teams, and Projects',
    },
    {
      id: 'adhd-in-5-minutes',
      title: 'How to Know in 5 Minutes If You Should Explore ADHD With a Specialist',
    },
  ];

  public ngOnInit(): void {
    const routeData = this.route.snapshot.data;

    this.seoService.updateSeoTags({
      title: routeData['title'],
      description: routeData['description'],
    });

    const lastPost = this.posts.at(-1);

    if (this.router.url === '/blog' && lastPost) {
      this.router.navigate(['/blog', lastPost.id]);
    }
  }
}
