import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map, catchError, of } from 'rxjs';

export interface BlogPostMeta {
  id: string;
  title: string;
  description: string;
  content: string;
  image?: string;
}

// Static blog post metadata - in a real app this might come from a CMS or API
const BLOG_POST_METADATA: Record<string, Omit<BlogPostMeta, 'id' | 'content'>> = {
  'what-is-the-wheel-of-life': {
    title: 'What Is the Wheel of Life?',
    description: 'The Wheel of Life is a circular chart divided into segments, each representing a key area of a person\'s life. Learn why coaches use it and clients love it.',
    image: 'https://resourcesof.life/assets/preview.jpg'
  },
  'why-do-i-feel-stuck': {
    title: 'Feeling Stuck? Try This 10-Minute Self-Reflection Tool That Actually Shows You Why',
    description: 'Discover why you feel stuck with this proven 10-minute self-reflection tool. Gain clarity and actionable insights for personal growth.',
    image: 'https://resourcesof.life/assets/preview.jpg'
  },
  'wheel-of-life-categories-for-teamleads': {
    title: 'Wheel of Life: 5 Sets of Categories for Coaching, Teams, and Projects',
    description: 'Explore 5 different category sets for the Wheel of Life tool, specifically designed for coaching, team development, and project management.',
    image: 'https://resourcesof.life/assets/preview.jpg'
  },
  'adhd-in-5-minutes': {
    title: 'ADHD in 5 Minutes',
    description: 'A quick guide to understanding ADHD, its symptoms, and practical strategies for managing it in daily life.',
    image: 'https://resourcesof.life/assets/preview.jpg'
  }
};

export const blogPostResolver: ResolveFn<BlogPostMeta | null> = (route) => {
  const http = inject(HttpClient);
  const postId = route.paramMap.get('id');
  
  if (!postId) {
    return of(null);
  }

  const metadata = BLOG_POST_METADATA[postId];
  
  if (!metadata) {
    // Return safe fallback for unknown posts
    return of({
      id: postId,
      title: postId.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      description: 'A blog post about personal development and coaching tools.',
      content: '',
      image: 'https://resourcesof.life/assets/preview.jpg'
    });
  }

  // Load the markdown content
  return http.get(`/assets/blog/${postId}.md`, { responseType: 'text' }).pipe(
    map(content => ({
      id: postId,
      ...metadata,
      content
    })),
    catchError(() => of({
      id: postId,
      ...metadata,
      content: ''
    }))
  );
};