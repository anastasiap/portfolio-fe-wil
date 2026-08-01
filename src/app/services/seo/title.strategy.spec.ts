import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { CustomTitleStrategy } from './title.strategy';

describe('CustomTitleStrategy', () => {
  let titleStrategy: CustomTitleStrategy;
  let titleService: jasmine.SpyObj<Title>;

  const createRouteSnapshot = (
    data: Record<string, unknown> | null,
    firstChild: ActivatedRouteSnapshot | null = null,
  ): ActivatedRouteSnapshot =>
    ({
      data,
      firstChild,
    }) as ActivatedRouteSnapshot;

  beforeEach(() => {
    const titleSpy = jasmine.createSpyObj('Title', ['setTitle']);

    TestBed.configureTestingModule({
      providers: [CustomTitleStrategy, { provide: Title, useValue: titleSpy }],
    });

    titleStrategy = TestBed.inject(CustomTitleStrategy);
    titleService = TestBed.inject(Title) as jasmine.SpyObj<Title>;
  });

  it('should create', () => {
    expect(titleStrategy).toBeTruthy();
  });

  describe('updateTitle', () => {
    it('should set title with site suffix when route has title data', () => {
      // Arrange
      const routeSnapshot = createRouteSnapshot({ title: 'About Me' });

      const routerState = {
        root: routeSnapshot,
      } as RouterStateSnapshot;

      // Act
      titleStrategy.updateTitle(routerState);

      // Assert
      expect(titleService.setTitle).toHaveBeenCalledWith('About Me | Wheel of Life');
    });

    it('should use default title when no route title is provided', () => {
      // Arrange
      const routeSnapshot = createRouteSnapshot({});

      const routerState = {
        root: routeSnapshot,
      } as RouterStateSnapshot;

      // Act
      titleStrategy.updateTitle(routerState);

      // Assert
      expect(titleService.setTitle).toHaveBeenCalledWith('Wheel of Life: free customizable online tool');
    });

    it('should find title in nested routes', () => {
      // Arrange
      const childRoute = createRouteSnapshot({ title: 'Blog Post Title' });
      const parentRoute = createRouteSnapshot({}, childRoute);

      const routerState = {
        root: parentRoute,
      } as RouterStateSnapshot;

      // Act
      titleStrategy.updateTitle(routerState);

      // Assert
      expect(titleService.setTitle).toHaveBeenCalledWith('Blog Post Title | Wheel of Life');
    });

    it('should use deepest route title when multiple routes have titles', () => {
      // Arrange
      const childRoute = createRouteSnapshot({ title: 'Child Title' });
      const parentRoute = createRouteSnapshot({ title: 'Parent Title' }, childRoute);

      const routerState = {
        root: parentRoute,
      } as RouterStateSnapshot;

      // Act
      titleStrategy.updateTitle(routerState);

      // Assert
      expect(titleService.setTitle).toHaveBeenCalledWith('Child Title | Wheel of Life');
    });

    it('should handle empty string title', () => {
      // Arrange
      const routeSnapshot = createRouteSnapshot({ title: '' });

      const routerState = {
        root: routeSnapshot,
      } as RouterStateSnapshot;

      // Act
      titleStrategy.updateTitle(routerState);

      // Assert
      expect(titleService.setTitle).toHaveBeenCalledWith('Wheel of Life: free customizable online tool');
    });

    it('should handle null route data', () => {
      // Arrange
      const routeSnapshot = createRouteSnapshot(null);

      const routerState = {
        root: routeSnapshot,
      } as RouterStateSnapshot;

      // Act
      titleStrategy.updateTitle(routerState);

      // Assert
      expect(titleService.setTitle).toHaveBeenCalledWith('Wheel of Life: free customizable online tool');
    });
  });

  describe('buildTitle', () => {
    it('should return undefined when no title is found', () => {
      // Arrange
      const routeSnapshot = createRouteSnapshot({});

      const routerState = {
        root: routeSnapshot,
      } as RouterStateSnapshot;

      // Act
      const result = titleStrategy.buildTitle(routerState);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return title from route data', () => {
      // Arrange
      const routeSnapshot = createRouteSnapshot({ title: 'Test Title' });

      const routerState = {
        root: routeSnapshot,
      } as RouterStateSnapshot;

      // Act
      const result = titleStrategy.buildTitle(routerState);

      // Assert
      expect(result).toBe('Test Title');
    });
  });
});
