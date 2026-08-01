import { isPlatformBrowser } from '@angular/common';

export const setEmail = (platformId: object): void => {
  if (!isPlatformBrowser(platformId)) {
    return;
  }

  const linkContainer = document.getElementById('linkContainer');

  if (linkContainer && !linkContainer.hasAttribute('href')) {
    linkContainer.setAttribute('href', `mailto:john@test.com`);
    linkContainer.innerHTML += 'test@example.com';
  }
};
