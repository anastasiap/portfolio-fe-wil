import { Routes } from '@angular/router';
import { BlogComponent } from './blog.component';
import { PostComponent } from './post.component';
import { blogPostResolver } from '../../services/blog-post.resolver';
import { routesDataMapping } from '../../../configs/routes.config';
import { provideMarkdown } from 'ngx-markdown';

export const blogRoutes: Routes = [
  {
    path: '',
    component: BlogComponent,
    providers: [
      provideMarkdown(), // Only loaded with blog components
    ],
    data: routesDataMapping['BlogComponent'],
    children: [
      {
        path: ':id',
        component: PostComponent,
        resolve: { blogPost: blogPostResolver },
      },
    ],
  },
];
