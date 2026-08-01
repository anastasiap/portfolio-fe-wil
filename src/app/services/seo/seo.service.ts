import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

export interface SeoConfig {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT) as Document;
  private readonly siteSuffix = ' | Wheel of Life';
  
  private readonly defaultConfig: SeoConfig = {
    description: 'A free interactive customizable Wheel of Life generator, online tool for coaches and self-reflection. No login required.',
    image: 'https://resourcesof.life/assets/preview.jpg',
    type: 'website'
  };

  updateSeoTags(config: SeoConfig): void {
    const seoConfig = { ...this.defaultConfig, ...config };

    if (seoConfig.title) {
      this.title.setTitle(seoConfig.title.endsWith(this.siteSuffix) ? seoConfig.title : `${seoConfig.title}${this.siteSuffix}`);
    }
    
    // Set canonical URL
    this.updateCanonicalUrl(seoConfig.url);
    
    // Set meta description
    if (seoConfig.description) {
      this.updateMetaTag('description', seoConfig.description);
    }
    
    // Set Open Graph tags
    this.updateMetaTag('og:title', seoConfig.title || 'Wheel of Life: Customizable Tool for Coaches');
    this.updateMetaTag('og:description', seoConfig.description!);
    this.updateMetaTag('og:image', seoConfig.image!);
    this.updateMetaTag('og:url', seoConfig.url || this.getCurrentUrl());
    this.updateMetaTag('og:type', seoConfig.type!);
    
    // Set Twitter tags
    this.updateMetaTag('twitter:title', seoConfig.title || 'Wheel of Life: Customizable Tool for Coaches');
    this.updateMetaTag('twitter:description', seoConfig.description!);
    this.updateMetaTag('twitter:image', seoConfig.image!);
    this.updateMetaTag('twitter:card', 'summary_large_image');
  }

  private updateMetaTag(property: string, content: string): void {
    // Handle both property and name attributes
    const isProperty = property.startsWith('og:') || property.startsWith('twitter:');
    const attribute = isProperty ? 'property' : 'name';
    
    if (this.meta.getTag(`${attribute}="${property}"`)) {
      this.meta.updateTag({ [attribute]: property, content });
    } else {
      this.meta.addTag({ [attribute]: property, content });
    }
  }

  private updateCanonicalUrl(url?: string): void {
    const canonicalUrl = url || this.getCurrentUrl();
    
    // Remove existing canonical tag
    const existingCanonical = this.document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }
    
    // Add new canonical tag
    const link = this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', canonicalUrl);
    this.document.head.appendChild(link);
  }

  private getCurrentUrl(): string {
    const baseUrl = 'https://resourcesof.life';
    const currentRoute = this.router.url;
    return baseUrl + currentRoute;
  }

  // Helper method to generate safe fallback meta content
  generateSafeFallback(routePath: string): SeoConfig {
    const routeSegments = routePath.split('/').filter(segment => segment);
    
    let title = 'Wheel of Life';
    let description = this.defaultConfig.description!;
    
    if (routeSegments.length > 0) {
      const segment = routeSegments[routeSegments.length - 1];
      title = this.humanizeSegment(segment);
      description = `${title} - ${this.defaultConfig.description}`;
    }
    
    return {
      title,
      description,
      url: this.getCurrentUrl()
    };
  }

  private humanizeSegment(segment: string): string {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
