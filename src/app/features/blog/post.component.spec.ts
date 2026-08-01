import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Data } from '@angular/router';
import { By } from '@angular/platform-browser';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MarkdownComponent, provideMarkdown } from 'ngx-markdown';
import { BehaviorSubject } from 'rxjs';

import { PostComponent } from './post.component';
import { SeoService } from '../../services/seo/seo.service';
import { BlogPostMeta } from '../../services/blog-post.resolver';

describe('PostComponent', () => {
  let fixture: ComponentFixture<PostComponent>;
  let component: PostComponent;
  let routeData$: BehaviorSubject<Data>;
  let seoService: jasmine.SpyObj<SeoService>;

  const blogPost: BlogPostMeta = {
    id: 'test-post',
    title: 'Test Post',
    description: 'Test post description',
    content: '# Test Post\n\nRendered markdown content.',
    image: 'https://resourcesof.life/assets/test-preview.jpg',
  };

  const createComponent = (routeData: Data = { blogPost }): void => {
    routeData$.next(routeData);

    fixture = TestBed.createComponent(PostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    const seoServiceSpy = jasmine.createSpyObj<SeoService>('SeoService', ['updateSeoTags']);
    routeData$ = new BehaviorSubject<Data>({});

    await TestBed.configureTestingModule({
      imports: [PostComponent, HttpClientTestingModule],
      providers: [
        provideMarkdown(),
        { provide: ActivatedRoute, useValue: { data: routeData$.asObservable() } },
        { provide: SeoService, useValue: seoServiceSpy },
      ],
    }).compileComponents();

    seoService = TestBed.inject(SeoService) as jasmine.SpyObj<SeoService>;
  });

  describe('Resolved Post Content', () => {
    it('should expose resolved post data through signals', () => {
      // Arrange & Act
      createComponent();

      // Assert
      expect(component.postId()).toBe(blogPost.id);
      expect(component.content()).toBe(blogPost.content);
    });

    it('should render markdown content when route data contains post content', () => {
      // Arrange & Act
      createComponent();

      // Assert
      const markdownElement = fixture.debugElement.query(By.directive(MarkdownComponent));
      const markdownComponent = markdownElement.componentInstance as MarkdownComponent;

      expect(markdownElement).toBeTruthy();
      expect(markdownComponent.data).toBe(blogPost.content);
      expect(fixture.nativeElement.textContent).not.toContain('Loading post...');
    });

    it('should show loading text when no post content is resolved', () => {
      // Arrange & Act
      createComponent({});

      // Assert
      const markdownElement = fixture.debugElement.query(By.css('markdown'));
      const loadingElement = fixture.debugElement.query(By.css('p'));

      expect(markdownElement).toBeFalsy();
      expect(loadingElement).toBeTruthy();
      expect(loadingElement.nativeElement.textContent.trim()).toBe('Loading post...');
      expect(seoService.updateSeoTags).not.toHaveBeenCalled();
    });
  });

  describe('SEO Updates', () => {
    it('should update SEO tags from resolved route data', () => {
      // Arrange & Act
      createComponent();

      // Assert
      expect(seoService.updateSeoTags).toHaveBeenCalledWith({
        title: blogPost.title,
        description: blogPost.description,
        image: blogPost.image,
      });
    });

    it('should update signals and SEO when route data changes', () => {
      // Arrange
      createComponent();
      seoService.updateSeoTags.calls.reset();

      const updatedBlogPost: BlogPostMeta = {
        id: 'updated-post',
        title: 'Updated Post',
        description: 'Updated post description',
        content: '# Updated Post',
        image: 'https://resourcesof.life/assets/updated-preview.jpg',
      };

      // Act
      routeData$.next({ blogPost: updatedBlogPost });
      fixture.detectChanges();

      // Assert
      expect(component.postId()).toBe(updatedBlogPost.id);
      expect(component.content()).toBe(updatedBlogPost.content);
      expect(seoService.updateSeoTags).toHaveBeenCalledWith({
        title: updatedBlogPost.title,
        description: updatedBlogPost.description,
        image: updatedBlogPost.image,
      });
    });
  });
});
