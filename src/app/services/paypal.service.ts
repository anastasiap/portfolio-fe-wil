import { isPlatformBrowser } from '@angular/common';

export const initializePaypal = (elementId: string, platformId: object): void => {
  if (!isPlatformBrowser(platformId)) {
    return;
  }

  if (window.PayPal) {
    window.PayPal.Donation.Button({
      env: 'production',
      hosted_button_id: 'HXKYQF3ALWKZ2',
      image: {
        alt: 'Donate with PayPal button',
        src: 'https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif',
        title: 'PayPal - The safer, easier way to pay online!',
      },
    }).render(elementId);
  }
};
