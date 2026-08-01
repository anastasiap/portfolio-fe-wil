import { TestBed } from '@angular/core/testing';
import { TokenMemoryService } from './token-memory.service';

describe('TokenMemoryService', () => {
  let service: TokenMemoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenMemoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Token Storage', () => {
    it('should initialize with no token (token is null by default)', () => {
      // Assert
      expect(service.getAccessToken()).toBeNull();
      expect(service.hasToken()).toBe(false);
    });

    it('should store access token in memory (set/get works)', () => {
      // Arrange
      const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';

      // Act
      service.setAccessToken(testToken);

      // Assert
      expect(service.getAccessToken()).toBe(testToken);
      expect(service.hasToken()).toBe(true);
    });

    it('should update token when set multiple times', () => {
      // Arrange
      const firstToken = 'token1';
      const secondToken = 'token2';

      // Act
      service.setAccessToken(firstToken);
      service.setAccessToken(secondToken);

      // Assert
      expect(service.getAccessToken()).toBe(secondToken);
    });

    it('should clear access token using clear() method (clear resets)', () => {
      // Arrange
      service.setAccessToken('test-token');

      // Act
      service.clear();

      // Assert
      expect(service.getAccessToken()).toBeNull();
      expect(service.hasToken()).toBe(false);
    });

    it('should accept null in setAccessToken to clear token', () => {
      // Arrange
      service.setAccessToken('test-token');
      expect(service.getAccessToken()).toBe('test-token');

      // Act
      service.setAccessToken(null);

      // Assert
      expect(service.getAccessToken()).toBeNull();
      expect(service.hasToken()).toBe(false);
    });

    it('should handle hasToken() correctly for empty string', () => {
      // Act
      service.setAccessToken('');

      // Assert
      expect(service.getAccessToken()).toBe('');
      expect(service.hasToken()).toBe(false); // Empty string should return false
    });

    it('should emit token changes via observable', (done) => {
      // Arrange
      const testToken = 'test-token';
      const emissions: (string | null)[] = [];

      // Act
      service.accessToken$.subscribe((token) => {
        emissions.push(token);

        if (emissions.length === 3) {
          // Assert
          expect(emissions[0]).toBeNull(); // Initial value
          expect(emissions[1]).toBe(testToken); // After set
          expect(emissions[2]).toBeNull(); // After clear
          done();
        }
      });

      service.setAccessToken(testToken);
      service.clear();
    });
  });

  describe('Storage Security', () => {
    it('should not write to localStorage', () => {
      // Arrange
      spyOn(localStorage, 'setItem');
      spyOn(localStorage, 'getItem');

      // Act
      service.setAccessToken('test-token');
      service.getAccessToken();

      // Assert
      expect(localStorage.setItem).not.toHaveBeenCalled();
      expect(localStorage.getItem).not.toHaveBeenCalled();
    });

    it('should not write to sessionStorage', () => {
      // Arrange
      spyOn(sessionStorage, 'setItem');
      spyOn(sessionStorage, 'getItem');

      // Act
      service.setAccessToken('test-token');
      service.getAccessToken();

      // Assert
      expect(sessionStorage.setItem).not.toHaveBeenCalled();
      expect(sessionStorage.getItem).not.toHaveBeenCalled();
    });

    it('should keep token only in memory', () => {
      // Arrange
      const testToken = 'secret-token';

      // Act
      service.setAccessToken(testToken);

      // Assert
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(sessionStorage.getItem('accessToken')).toBeNull();
      expect(service.getAccessToken()).toBe(testToken);
    });
  });

  describe('Token Lifecycle', () => {
    it('should handle rapid token updates', () => {
      // Act
      for (let i = 0; i < 10; i++) {
        service.setAccessToken(`token-${i}`);
      }

      // Assert
      expect(service.getAccessToken()).toBe('token-9');
    });

    it('should handle clear without prior set', () => {
      // Act
      service.clear();

      // Assert
      expect(service.getAccessToken()).toBeNull();
    });

    it('should handle multiple consecutive clear calls', () => {
      // Arrange
      service.setAccessToken('test-token');

      // Act
      service.clear();
      service.clear();
      service.clear();

      // Assert
      expect(service.getAccessToken()).toBeNull();
      expect(service.hasToken()).toBe(false);
    });

    it('should handle whitespace-only token', () => {
      // Act
      service.setAccessToken('   ');

      // Assert
      expect(service.getAccessToken()).toBe('   ');
      expect(service.hasToken()).toBe(true); // Whitespace string has length > 0
    });
  });

  describe('Backward Compatibility', () => {
    it('should support clear method as replacement for deprecated clearAccessToken', () => {
      // Arrange
      service.setAccessToken('test-token');

      // Act
      service.clear();

      // Assert
      expect(service.getAccessToken()).toBeNull();
    });

    it('should support hasToken method as replacement for deprecated hasAccessToken', () => {
      // Arrange
      service.setAccessToken('test-token');

      // Act & Assert
      expect(service.hasToken()).toBe(true);

      // Act
      service.clear();

      // Assert
      expect(service.hasToken()).toBe(false);
    });
  });
});
