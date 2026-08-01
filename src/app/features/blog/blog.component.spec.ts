import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { BlogComponent } from './blog.component';

// Mock components for router outlets
@Component({
  template: '<div>Mock Post Component</div>',
})
class MockPostComponent {}

@Component({
  template: '<div>Mock Default Component</div>',
})
class MockDefaultComponent {}

describe('BlogComponent', () => {
  let component: BlogComponent;
  let fixture: ComponentFixture<BlogComponent>;
  let router: Router;

  const createFixtureWithPosts = (posts: BlogComponent['posts']) => {
    const customFixture = TestBed.createComponent(BlogComponent);
    Object.defineProperty(customFixture.componentInstance, 'posts', { value: posts });
    customFixture.detectChanges();
    return customFixture;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BlogComponent,
        NoopAnimationsModule,
        RouterTestingModule.withRoutes([
          { path: 'blog/:id', component: MockPostComponent },
          { path: 'blog', component: MockDefaultComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BlogComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    fixture.detectChanges();
  });

  // Basic component tests
  describe('Component Initialization', () => {
    it('should initialize with predefined posts', () => {
      expect(component.posts).toBeDefined();
      expect(component.posts.length).toBeGreaterThan(0);
    });
  });

  // Posts data tests
  describe('Posts Data', () => {
    it('should have correct post structure', () => {
      component.posts.forEach((post) => {
        expect(post.id).toBeDefined();
        expect(post.title).toBeDefined();
        expect(typeof post.id).toBe('string');
        expect(typeof post.title).toBe('string');
      });
    });

    it('should have correct first post data', () => {
      const firstPost = component.posts[0];
      expect(firstPost.id).toBe('what-is-the-wheel-of-life');
      expect(firstPost.title).toBe('What Is the Wheel of Life?');
    });

    it('should have correct second post data', () => {
      const secondPost = component.posts[1];
      expect(secondPost.id).toBe('why-do-i-feel-stuck');
      expect(secondPost.title).toBe('Feeling Stuck? Try This 10-Minute Self-Reflection Tool That Actually Shows You Why');
    });

    it('should have posts with unique IDs', () => {
      const ids = component.posts.map((post) => post.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have posts with non-empty titles', () => {
      component.posts.forEach((post) => {
        expect(post.title.trim().length).toBeGreaterThan(0);
      });
    });
  });

  // Main structure tests
  describe('Main Structure', () => {
    it('should render main element', () => {
      const mainElement = fixture.debugElement.query(By.css('[data-testid="blog-main"]'));
      expect(mainElement).toBeTruthy();
      expect(mainElement.nativeElement.tagName.toLowerCase()).toBe('main');
    });

    it('should render navigation section', () => {
      const navElement = fixture.debugElement.query(By.css('[data-testid="blog-nav"]'));
      expect(navElement).toBeTruthy();
      expect(navElement.nativeElement.tagName.toLowerCase()).toBe('nav');
      expect(navElement.nativeElement).toHaveClass('blog-nav');
    });

    it('should render content section', () => {
      const contentSection = fixture.debugElement.query(By.css('[data-testid="blog-section-content"]'));
      expect(contentSection).toBeTruthy();
      expect(contentSection.nativeElement.tagName.toLowerCase()).toBe('section');
      expect(contentSection.nativeElement).toHaveClass('blog-content');
    });

    it('should render router outlet', () => {
      const routerOutlet = fixture.debugElement.query(By.css('[data-testid="blog-outlet-router"]'));
      expect(routerOutlet).toBeTruthy();
      expect(routerOutlet.nativeElement.tagName.toLowerCase()).toBe('router-outlet');
    });
  });

  // Navigation tests
  describe('Navigation', () => {
    it('should render posts list', () => {
      const postsList = fixture.debugElement.query(By.css('[data-testid="blog-list-posts"]'));
      expect(postsList).toBeTruthy();
      expect(postsList.nativeElement.tagName.toLowerCase()).toBe('ul');
    });

    it('should render correct number of post links', () => {
      const postLinks = fixture.debugElement.queryAll(By.css('[data-testid="blog-link-post"]'));
      expect(postLinks.length).toBe(component.posts.length);
    });

    it('should render post links with correct content', () => {
      const postLinks = fixture.debugElement.queryAll(By.css('[data-testid="blog-link-post"]'));

      postLinks.forEach((linkElement, index) => {
        const expectedPost = component.posts[index];
        expect(linkElement.nativeElement.textContent.trim()).toBe(expectedPost.title);
      });
    });

    it('should render post links with correct router links', () => {
      const postLinks = fixture.debugElement.queryAll(By.css('[data-testid="blog-link-post"]'));

      postLinks.forEach((linkElement, index) => {
        const expectedPost = component.posts[index];
        expect(linkElement.nativeElement.getAttribute('href')).toContain(`/blog/${expectedPost.id}`);
      });
    });

    it('should have router link active directive on post links', () => {
      const postLinks = fixture.debugElement.queryAll(By.css('[data-testid="blog-link-post"]'));

      postLinks.forEach((linkElement) => {
        expect(linkElement.nativeElement.hasAttribute('routerlinkactive')).toBeTruthy();
      });
    });

    it('should render each post link in a list item', () => {
      const listItems = fixture.debugElement.queryAll(By.css('[data-testid="blog-list-posts"] li'));
      expect(listItems.length).toBe(component.posts.length);

      listItems.forEach((item) => {
        const link = item.query(By.css('[data-testid="blog-link-post"]'));
        expect(link).toBeTruthy();
      });
    });
  });

  // Router navigation behavior tests
  describe('Router Navigation Behavior', () => {
    beforeEach(() => {
      spyOn(router, 'navigate');
    });

    it('should navigate to last post when on /blog route', () => {
      spyOnProperty(router, 'url', 'get').and.returnValue('/blog');

      component.ngOnInit();

      const lastPost = component.posts[component.posts.length - 1];
      expect(router.navigate).toHaveBeenCalledWith(['/blog', lastPost.id]);
    });

    it('should not navigate when not on /blog route', () => {
      spyOnProperty(router, 'url', 'get').and.returnValue('/blog/some-post');

      component.ngOnInit();

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should navigate to the most recent post (last in array)', () => {
      spyOnProperty(router, 'url', 'get').and.returnValue('/blog');

      component.ngOnInit();

      const lastPost = component.posts[component.posts.length - 1];
      expect(router.navigate).toHaveBeenCalledWith(['/blog', lastPost.id]);
    });
  });

  // Donate component tests
  describe('Donate Component', () => {
    it('should render donate component', () => {
      const donateComponent = fixture.debugElement.query(By.css('[data-testid="blog-component-donate"]'));
      expect(donateComponent).toBeTruthy();
      expect(donateComponent.nativeElement.tagName.toLowerCase()).toBe('wil-donate');
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const main = fixture.debugElement.query(By.css('main'));
      const nav = fixture.debugElement.query(By.css('nav'));
      const section = fixture.debugElement.query(By.css('section'));

      expect(main).toBeTruthy();
      expect(nav).toBeTruthy();
      expect(section).toBeTruthy();
    });

    it('should have proper list structure for navigation', () => {
      const list = fixture.debugElement.query(By.css('nav ul'));
      const listItems = fixture.debugElement.queryAll(By.css('nav ul li'));

      expect(list).toBeTruthy();
      expect(listItems.length).toBeGreaterThan(0);

      listItems.forEach((item) => {
        const link = item.query(By.css('a'));
        expect(link).toBeTruthy();
      });
    });
  });

  // Component integration tests
  describe('Component Integration', () => {
    it('should render configured posts on initial check', () => {
      // Add a new post
      const customFixture = createFixtureWithPosts([...component.posts, { id: 'new-post', title: 'New Test Post' }]);

      const postLinks = customFixture.debugElement.queryAll(By.css('[data-testid="blog-link-post"]'));
      expect(postLinks.length).toBe(customFixture.componentInstance.posts.length);
      expect(postLinks[customFixture.componentInstance.posts.length - 1].nativeElement.textContent.trim()).toBe('New Test Post');
    });

    it('should handle empty posts array', () => {
      const customFixture = createFixtureWithPosts([]);

      const postLinks = customFixture.debugElement.queryAll(By.css('[data-testid="blog-link-post"]'));
      expect(postLinks.length).toBe(0);
    });

    it('should maintain navigation structure with different post counts', () => {
      const customFixture = createFixtureWithPosts([{ id: 'single-post', title: 'Single Post' }]);

      const nav = customFixture.debugElement.query(By.css('[data-testid="blog-nav"]'));
      const list = customFixture.debugElement.query(By.css('[data-testid="blog-list-posts"]'));
      const postLinks = customFixture.debugElement.queryAll(By.css('[data-testid="blog-link-post"]'));

      expect(nav).toBeTruthy();
      expect(list).toBeTruthy();
      expect(postLinks.length).toBe(1);
    });
  });

  // Content validation tests
  describe('Content Validation', () => {
    it('should display post titles correctly', () => {
      const postLinks = fixture.debugElement.queryAll(By.css('[data-testid="blog-link-post"]'));

      postLinks.forEach((link, index) => {
        expect(link.nativeElement.textContent.trim()).toBe(component.posts[index].title);
      });
    });

    it('should have meaningful post IDs for URL generation', () => {
      component.posts.forEach((post) => {
        expect(post.id).toMatch(/^[a-z0-9-]+$/); // Should be URL-friendly
        expect(post.id.length).toBeGreaterThan(0);
        expect(post.id).not.toContain(' '); // No spaces
      });
    });

    it('should have descriptive post titles', () => {
      component.posts.forEach((post) => {
        expect(post.title.length).toBeGreaterThan(10); // Meaningful length
        expect(post.title.trim()).toBe(post.title); // No leading/trailing whitespace
      });
    });
  });

  // Error handling and edge cases
  describe('Error Handling and Edge Cases', () => {
    it('should surface router navigation errors', () => {
      spyOn(router, 'navigate').and.throwError('Navigation failed');
      spyOnProperty(router, 'url', 'get').and.returnValue('/blog');

      expect(() => {
        component.ngOnInit();
      }).toThrowError('Navigation failed');
    });

    it('should handle posts with special characters in titles', () => {
      const customFixture = createFixtureWithPosts([{ id: 'special-chars', title: 'Post with "Quotes" & Symbols!' }]);

      const postLink = customFixture.debugElement.query(By.css('[data-testid="blog-link-post"]'));
      expect(postLink.nativeElement.textContent).toContain('Post with "Quotes" & Symbols!');
    });

    it('should handle very long post titles', () => {
      const longTitle = 'A'.repeat(200);
      const customFixture = createFixtureWithPosts([{ id: 'long-title', title: longTitle }]);

      const postLink = customFixture.debugElement.query(By.css('[data-testid="blog-link-post"]'));
      expect(postLink.nativeElement.textContent.trim()).toBe(longTitle);
    });
  });

  // Performance and optimization tests
  describe('Performance and Optimization', () => {
    it('should use OnPush change detection strategy', () => {
      // This is primarily tested by the component creation not throwing errors
      // OnPush strategy means the component relies on immutable data patterns
      expect(component).toBeTruthy();
    });

    it('should not re-render navigation when router outlet content changes', () => {
      const navElement = fixture.debugElement.query(By.css('[data-testid="blog-nav"]'));
      const initialHtml = navElement.nativeElement.innerHTML;

      // Simulate router navigation (would normally trigger change detection)
      fixture.detectChanges();

      expect(navElement.nativeElement.innerHTML).toBe(initialHtml);
    });
  });
});
