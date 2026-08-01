import { setEmail } from './set-email.util';

describe('setEmail', () => {
  const browserPlatformId = 'browser' as unknown as object;
  const serverPlatformId = 'server' as unknown as object;
  let testHost: HTMLDivElement;

  beforeEach(() => {
    testHost = document.createElement('div');
    document.body.appendChild(testHost);
  });

  afterEach(() => {
    testHost.remove();
  });

  const setTestHtml = (html: string): void => {
    testHost.innerHTML = html;
  };

  it('should set the email href and text when the link container exists in the browser', () => {
    setTestHtml('<a id="linkContainer"></a>');

    setEmail(browserPlatformId);

    const linkContainer = document.getElementById('linkContainer');
    expect(linkContainer?.getAttribute('href')).toBe('mailto:john@test.com');
    expect(linkContainer?.innerHTML).toBe('test@example.com');
  });

  it('should append the email text to existing link container content', () => {
    setTestHtml('<a id="linkContainer">Contact: </a>');

    setEmail(browserPlatformId);

    const linkContainer = document.getElementById('linkContainer');
    expect(linkContainer?.getAttribute('href')).toBe('mailto:john@test.com');
    expect(linkContainer?.innerHTML).toBe('Contact: test@example.com');
  });

  it('should not update the link container outside the browser', () => {
    setTestHtml('<a id="linkContainer"></a>');

    setEmail(serverPlatformId);

    const linkContainer = document.getElementById('linkContainer');
    expect(linkContainer?.hasAttribute('href')).toBeFalse();
    expect(linkContainer?.innerHTML).toBe('');
  });

  it('should not throw when the link container is missing', () => {
    setTestHtml('<div></div>');

    expect(() => setEmail(browserPlatformId)).not.toThrow();
  });

  it('should not overwrite an existing href or append the email again', () => {
    setTestHtml('<a id="linkContainer" href="mailto:existing@example.com">Existing</a>');

    setEmail(browserPlatformId);

    const linkContainer = document.getElementById('linkContainer');
    expect(linkContainer?.getAttribute('href')).toBe('mailto:existing@example.com');
    expect(linkContainer?.innerHTML).toBe('Existing');
  });
});
