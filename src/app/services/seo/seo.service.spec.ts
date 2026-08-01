import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { SeoConfig, SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let metaService: jasmine.SpyObj<Meta>;
  let document: jasmine.SpyObj<Document>;

  beforeEach(() => {
    const metaSpy = jasmine.createSpyObj('Meta', ['getTag', 'updateTag', 'addTag']);
    const routerSpy = jasmine.createSpyObj('Router', [], { url: '/test' });
    const documentSpy = jasmine.createSpyObj('Document', ['querySelector', 'createElement', 'querySelectorAll']);
    const headSpy = jasmine.createSpyObj('HTMLHeadElement', ['appendChild']);

    documentSpy.head = headSpy;
    documentSpy.querySelectorAll.and.returnValue([]);
    documentSpy.querySelector.and.returnValue(null);

    TestBed.configureTestingModule({
      providers: [
        SeoService,
        { provide: Meta, useValue: metaSpy },
        { provide: Router, useValue: routerSpy },
        { provide: DOCUMENT, useValue: documentSpy },
      ],
    });

    service = TestBed.inject(SeoService);
    metaService = TestBed.inject(Meta) as jasmine.SpyObj<Meta>;
    document = TestBed.inject(DOCUMENT) as jasmine.SpyObj<Document>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('updateSeoTags', () => {
    beforeEach(() => {
      metaService.getTag.and.returnValue(null);
      document.querySelector.and.returnValue(null);
      document.createElement.and.returnValue({
        setAttribute: jasmine.createSpy('setAttribute'),
      } as never);
    });

    it('should update meta description tag', () => {
      // Arrange
      const config: SeoConfig = {
        title: 'Test Title',
        description: 'Test description',
      };

      // Act
      service.updateSeoTags(config);

      // Assert
      expect(metaService.addTag).toHaveBeenCalledWith({
        name: 'description',
        content: 'Test description',
      });
    });

    it('should update Open Graph tags', () => {
      // Arrange
      const config: SeoConfig = {
        title: 'Test Title',
        description: 'Test description',
        image: 'https://example.com/image.jpg',
        url: 'https://example.com/page',
      };

      // Act
      service.updateSeoTags(config);

      // Assert
      expect(metaService.addTag).toHaveBeenCalledWith({
        property: 'og:title',
        content: 'Test Title',
      });
      expect(metaService.addTag).toHaveBeenCalledWith({
        property: 'og:description',
        content: 'Test description',
      });
      expect(metaService.addTag).toHaveBeenCalledWith({
        property: 'og:image',
        content: 'https://example.com/image.jpg',
      });
      expect(metaService.addTag).toHaveBeenCalledWith({
        property: 'og:url',
        content: 'https://example.com/page',
      });
    });

    it('should update Twitter tags', () => {
      // Arrange
      const config: SeoConfig = {
        title: 'Test Title',
        description: 'Test description',
        image: 'https://example.com/image.jpg',
      };

      // Act
      service.updateSeoTags(config);

      // Assert
      expect(metaService.addTag).toHaveBeenCalledWith({
        property: 'twitter:title',
        content: 'Test Title',
      });
      expect(metaService.addTag).toHaveBeenCalledWith({
        property: 'twitter:description',
        content: 'Test description',
      });
      expect(metaService.addTag).toHaveBeenCalledWith({
        property: 'twitter:image',
        content: 'https://example.com/image.jpg',
      });
      expect(metaService.addTag).toHaveBeenCalledWith({
        property: 'twitter:card',
        content: 'summary_large_image',
      });
    });

    it('should use default values when not provided', () => {
      // Arrange
      const config: SeoConfig = {};

      // Act
      service.updateSeoTags(config);

      // Assert
      expect(metaService.addTag).toHaveBeenCalledWith({
        name: 'description',
        content: 'A free interactive customizable Wheel of Life generator, online tool for coaches and self-reflection. No login required.',
      });
      expect(metaService.addTag).toHaveBeenCalledWith({
        property: 'og:image',
        content: 'https://resourcesof.life/assets/preview.jpg',
      });
    });

    it('should update existing meta tags instead of adding new ones', () => {
      // Arrange
      metaService.getTag.and.returnValue({ content: 'existing' } as never);
      const config: SeoConfig = {
        description: 'New description',
      };

      // Act
      service.updateSeoTags(config);

      // Assert
      expect(metaService.updateTag).toHaveBeenCalledWith({
        name: 'description',
        content: 'New description',
      });
      expect(metaService.addTag).not.toHaveBeenCalledWith({
        name: 'description',
        content: 'New description',
      });
    });

    it('should add canonical link', () => {
      // Arrange
      const config: SeoConfig = {
        url: 'https://example.com/page',
      };
      const linkElement = {
        setAttribute: jasmine.createSpy('setAttribute'),
      };
      document.createElement.and.returnValue(linkElement as never);

      // Act
      service.updateSeoTags(config);

      // Assert
      expect(document.createElement).toHaveBeenCalledWith('link');
      expect(linkElement.setAttribute).toHaveBeenCalledWith('rel', 'canonical');
      expect(linkElement.setAttribute).toHaveBeenCalledWith('href', 'https://example.com/page');
      expect(document.head.appendChild).toHaveBeenCalledWith(linkElement as never);
    });

    it('should remove existing canonical link before adding new one', () => {
      // Arrange
      const existingCanonical = {
        remove: jasmine.createSpy('remove'),
      };
      document.querySelector.and.returnValue(existingCanonical as never);
      const config: SeoConfig = {};

      // Act
      service.updateSeoTags(config);

      // Assert
      expect(document.querySelector).toHaveBeenCalledWith('link[rel="canonical"]');
      expect(existingCanonical.remove).toHaveBeenCalled();
    });
  });

  describe('generateSafeFallback', () => {
    it('should generate fallback for simple route path', () => {
      // Act
      const result = service.generateSafeFallback('/about');

      // Assert
      expect(result.title).toBe('About');
      expect(result.description).toBe(
        'About - A free interactive customizable Wheel of Life generator, online tool for coaches and self-reflection. No login required.'
      );
    });

    it('should generate fallback for nested route path', () => {
      // Act
      const result = service.generateSafeFallback('/blog/test-post');

      // Assert
      expect(result.title).toBe('Test Post');
      expect(result.description).toBe(
        'Test Post - A free interactive customizable Wheel of Life generator, online tool for coaches and self-reflection. No login required.'
      );
    });

    it('should handle route with dashes', () => {
      // Act
      const result = service.generateSafeFallback('/wheel-of-life-categories');

      // Assert
      expect(result.title).toBe('Wheel Of Life Categories');
    });

    it('should handle root path', () => {
      // Act
      const result = service.generateSafeFallback('/');

      // Assert
      expect(result.title).toBe('Wheel of Life');
      expect(result.description).toBe(
        'A free interactive customizable Wheel of Life generator, online tool for coaches and self-reflection. No login required.'
      );
    });

    it('should include current URL in result', () => {
      // Act
      const result = service.generateSafeFallback('/test');

      // Assert
      expect(result.url).toBe('https://resourcesof.life/test');
    });
  });
});
