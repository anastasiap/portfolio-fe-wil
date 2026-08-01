import { TestBed } from '@angular/core/testing';
import { FileUploadService, FileUploadOptions } from './file-upload.service';

describe('FileUploadService', () => {
  let service: FileUploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileUploadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateDroppedFiles', () => {
    const mockOptions: FileUploadOptions = {
      maxSizeBytes: 1024 * 1024, // 1MB
      allowedTypes: ['image/png', 'image/jpeg'],
    };

    it('should validate file type correctly', () => {
      // Arrange
      const validFile = new File(['content'], 'test.png', { type: 'image/png' });
      const invalidFile = new File(['content'], 'test.gif', { type: 'image/gif' });

      // Act & Assert
      expect(service.validateDroppedFiles([validFile] as never, mockOptions)).toBeNull();

      const error = service.validateDroppedFiles([invalidFile] as never, mockOptions);
      expect(error).toBeTruthy();
      expect(error?.type).toBe('invalid-type');
    });

    it('should validate file size correctly', () => {
      // Arrange - Create a file larger than the limit
      const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
      const largeFile = new File([largeContent], 'large.png', { type: 'image/png' });

      // Act
      const error = service.validateDroppedFiles([largeFile] as never, mockOptions);

      // Assert
      expect(error).toBeTruthy();
      expect(error?.type).toBe('too-large');
    });

    it('should reject multiple files', () => {
      // Arrange
      const file1 = new File(['content'], 'test1.png', { type: 'image/png' });
      const file2 = new File(['content'], 'test2.png', { type: 'image/png' });

      // Act
      const error = service.validateDroppedFiles([file1, file2] as never, mockOptions);

      // Assert
      expect(error).toBeTruthy();
      expect(error?.type).toBe('invalid-file');
      expect(error?.message).toBe('Please drop only one file at a time.');
    });

    it('should reject empty file list', () => {
      // Act
      const error = service.validateDroppedFiles([] as never, mockOptions);

      // Assert
      expect(error).toBeTruthy();
      expect(error?.type).toBe('invalid-file');
      expect(error?.message).toBe('No files were dropped.');
    });

    it('should reject null file lists as no dropped files', () => {
      // Act
      const error = service.validateDroppedFiles(null, mockOptions);

      // Assert
      expect(error).toEqual({
        type: 'invalid-file',
        message: 'No files were dropped.',
      });
    });

    it('should accept a valid file exactly at the configured max size', () => {
      // Arrange
      const file = new File(['x'.repeat(1024)], 'exact.png', { type: 'image/png' });
      const options: FileUploadOptions = {
        maxSizeBytes: 1024,
        allowedTypes: ['image/png'],
      };

      // Act
      const error = service.validateDroppedFiles([file] as never, options);

      // Assert
      expect(error).toBeNull();
    });

    it('should reject a valid file one byte over the configured max size', () => {
      // Arrange
      const file = new File(['x'.repeat(1025)], 'too-large.png', { type: 'image/png' });
      const options: FileUploadOptions = {
        maxSizeBytes: 1024,
        allowedTypes: ['image/png'],
      };

      // Act
      const error = service.validateDroppedFiles([file] as never, options);

      // Assert
      expect(error?.type).toBe('too-large');
    });

    it('should accept only zero-byte valid files when max size is zero', () => {
      // Arrange
      const emptyFile = new File([''], 'empty.png', { type: 'image/png' });
      const nonEmptyFile = new File(['x'], 'non-empty.png', { type: 'image/png' });
      const options: FileUploadOptions = {
        maxSizeBytes: 0,
        allowedTypes: ['image/png'],
      };

      // Act
      const emptyError = service.validateDroppedFiles([emptyFile] as never, options);
      const nonEmptyError = service.validateDroppedFiles([nonEmptyFile] as never, options);

      // Assert
      expect(emptyError).toBeNull();
      expect(nonEmptyError?.type).toBe('too-large');
    });

    it('should reject valid files when max size is negative', () => {
      // Arrange
      const file = new File([''], 'empty.png', { type: 'image/png' });
      const options: FileUploadOptions = {
        maxSizeBytes: -1,
        allowedTypes: ['image/png'],
      };

      // Act
      const error = service.validateDroppedFiles([file] as never, options);

      // Assert
      expect(error?.type).toBe('too-large');
    });

    it('should reject every file when no allowed types are configured', () => {
      // Arrange
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const options: FileUploadOptions = {
        maxSizeBytes: 1024,
        allowedTypes: [],
      };

      // Act
      const error = service.validateDroppedFiles([file] as never, options);

      // Assert
      expect(error?.type).toBe('invalid-type');
    });

    it('should return invalid type for a malformed single file without a type', () => {
      // Arrange
      const malformedFile = {
        size: 0,
      };

      // Act
      const error = service.validateDroppedFiles([malformedFile] as never, mockOptions);

      // Assert
      expect(error?.type).toBe('invalid-type');
      expect(error?.message).toContain('File type "undefined" is not supported.');
    });
  });

  describe('processLogoFile', () => {
    it('should process valid PNG file', async () => {
      // Arrange
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx?.fillRect(0, 0, 100, 100);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      const file = new File([blob], 'test.png', { type: 'image/png' });

      // Act
      const result = await service.processLogoFile(file);

      // Assert
      expect(result.success).toBe(true);
      expect(result.base64).toBeTruthy();
      expect(result.base64!).toMatch(/^data:image\/png;base64,/);
    });

    it('should handle invalid file type', async () => {
      // Arrange
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      // Act
      const result = await service.processLogoFile(file);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('invalid-type');
    });

    it('should handle file too large', async () => {
      // Arrange - Create a file larger than 2MB
      const largeContent = 'x'.repeat(3 * 1024 * 1024); // 3MB
      const file = new File([largeContent], 'large.png', { type: 'image/png' });

      // Act
      const result = await service.processLogoFile(file);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('too-large');
    });

    it('should process SVG logos through the file reader path', async () => {
      // Arrange
      const file = new File(['<svg xmlns="http://www.w3.org/2000/svg"></svg>'], 'logo.svg', { type: 'image/svg+xml' });

      // Act
      const result = await service.processLogoFile(file);

      // Assert
      expect(result.success).toBeTrue();
      expect(result.base64).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('should accept a logo exactly at the 2MB limit', async () => {
      // Arrange
      const svgContent = '<svg>' + 'x'.repeat(2 * 1024 * 1024 - 11) + '</svg>';
      const file = new File([svgContent], 'exact-limit.svg', { type: 'image/svg+xml' });

      // Act
      const result = await service.processLogoFile(file);

      // Assert
      expect(file.size).toBe(2 * 1024 * 1024);
      expect(result.success).toBeTrue();
    });

    it('should reject malformed file input instead of returning a validation result', async () => {
      // BUG SUSPECTED: processLogoFile does not guard malformed file input before reading file.type.
      await expectAsync(service.processLogoFile(null as unknown as File)).toBeRejected();
    });
  });

  describe('processFile', () => {
    const createImageFile = (type = 'image/png'): File => new File(['image'], 'image.png', { type });
    const createSvgFile = (sizeBytes: number, type = 'image/svg+xml'): File =>
      new File(['x'.repeat(sizeBytes)], 'image.svg', { type });

    const installImageProcessingMocks = (imageWidth: number, imageHeight: number, shouldFail = false) => {
      const originalCreateElement = document.createElement.bind(document);
      const context = {
        drawImage: jasmine.createSpy('drawImage'),
      };
      const canvas = {
        width: 0,
        height: 0,
        getContext: jasmine.createSpy('getContext').and.returnValue(context),
        toDataURL: jasmine.createSpy('toDataURL').and.returnValue('data:image/png;base64,processed'),
      };

      spyOn(document, 'createElement').and.callFake((tagName: string): HTMLElement => {
        if (tagName === 'canvas') {
          return canvas as unknown as HTMLCanvasElement;
        }

        return originalCreateElement(tagName);
      });

      spyOn(URL, 'createObjectURL').and.returnValue('blob:image');
      spyOn(window as unknown as { Image: typeof Image }, 'Image').and.callFake(
        function fakeImageConstructor(): HTMLImageElement {
          const image = {
            width: imageWidth,
            height: imageHeight,
            onload: null,
            onerror: null,
          } as unknown as HTMLImageElement;

          Object.defineProperty(image, 'src', {
            set: () => {
              setTimeout(() => {
                if (shouldFail) {
                  (image.onerror as ((event: Event) => void) | null)?.(new Event('error'));
                  return;
                }

                (image.onload as ((event: Event) => void) | null)?.(new Event('load'));
              });
            },
          });

          return image;
        }
      );

      return { canvas, context };
    };

    it('should process valid SVG files without raster image loading', async () => {
      // Arrange
      const file = new File(['<svg xmlns="http://www.w3.org/2000/svg"></svg>'], 'logo.svg', { type: 'image/svg+xml' });
      const options: FileUploadOptions = {
        maxSizeBytes: 1024,
        allowedTypes: ['image/svg+xml'],
      };

      // Act
      const result = await service.processFile(file, options);

      // Assert
      expect(result.success).toBeTrue();
      expect(result.base64).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('should reject unsupported type before checking an oversized file', async () => {
      // Arrange
      const file = new File(['x'.repeat(10)], 'file.txt', { type: 'text/plain' });
      const options: FileUploadOptions = {
        maxSizeBytes: 1,
        allowedTypes: ['image/png'],
      };

      // Act
      const result = await service.processFile(file, options);

      // Assert
      expect(result.success).toBeFalse();
      expect(result.error?.type).toBe('invalid-type');
    });

    it('should accept a file exactly at the configured size limit', async () => {
      // Arrange
      const file = createSvgFile(10);
      const options: FileUploadOptions = {
        maxSizeBytes: 10,
        allowedTypes: ['image/svg+xml'],
      };

      // Act
      const result = await service.processFile(file, options);

      // Assert
      expect(result.success).toBeTrue();
    });

    it('should reject a file one byte over the configured size limit', async () => {
      // Arrange
      const file = createSvgFile(11);
      const options: FileUploadOptions = {
        maxSizeBytes: 10,
        allowedTypes: ['image/svg+xml'],
      };

      // Act
      const result = await service.processFile(file, options);

      // Assert
      expect(result.success).toBeFalse();
      expect(result.error?.type).toBe('too-large');
    });

    it('should allow zero-byte files when the max size is zero', async () => {
      // Arrange
      const file = createSvgFile(0);
      const options: FileUploadOptions = {
        maxSizeBytes: 0,
        allowedTypes: ['image/svg+xml'],
      };

      // Act
      const result = await service.processFile(file, options);

      // Assert
      expect(result.success).toBeTrue();
    });

    it('should reject valid files when the max size is negative', async () => {
      // Arrange
      const file = createSvgFile(0);
      const options: FileUploadOptions = {
        maxSizeBytes: -1,
        allowedTypes: ['image/svg+xml'],
      };

      // Act
      const result = await service.processFile(file, options);

      // Assert
      expect(result.success).toBeFalse();
      expect(result.error?.type).toBe('too-large');
    });

    it('should reject every type when no allowed types are configured', async () => {
      // Arrange
      const file = createSvgFile(0);
      const options: FileUploadOptions = {
        maxSizeBytes: 100,
        allowedTypes: [],
      };

      // Act
      const result = await service.processFile(file, options);

      // Assert
      expect(result.success).toBeFalse();
      expect(result.error?.type).toBe('invalid-type');
    });

    it('should scale raster images down when they exceed max width', async () => {
      // Arrange
      const { canvas, context } = installImageProcessingMocks(1600, 800);
      const options: FileUploadOptions = {
        maxSizeBytes: 100,
        allowedTypes: ['image/png'],
        maxWidth: 800,
      };

      // Act
      const result = await service.processFile(createImageFile(), options);

      // Assert
      expect(result.success).toBeTrue();
      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(400);
      expect(context.drawImage).toHaveBeenCalledWith(jasmine.any(Object), 0, 0, 800, 400);
    });

    it('should scale raster images down when they exceed max height', async () => {
      // Arrange
      const { canvas, context } = installImageProcessingMocks(800, 1200);
      const options: FileUploadOptions = {
        maxSizeBytes: 100,
        allowedTypes: ['image/png'],
        maxHeight: 600,
      };

      // Act
      const result = await service.processFile(createImageFile(), options);

      // Assert
      expect(result.success).toBeTrue();
      expect(canvas.width).toBe(400);
      expect(canvas.height).toBe(600);
      expect(context.drawImage).toHaveBeenCalledWith(jasmine.any(Object), 0, 0, 400, 600);
    });

    it('should keep raster image dimensions when it is already within max bounds', async () => {
      // Arrange
      const { canvas } = installImageProcessingMocks(300, 200);
      const options: FileUploadOptions = {
        maxSizeBytes: 100,
        allowedTypes: ['image/png'],
        maxWidth: 800,
        maxHeight: 600,
      };

      // Act
      const result = await service.processFile(createImageFile(), options);

      // Assert
      expect(result.success).toBeTrue();
      expect(canvas.width).toBe(300);
      expect(canvas.height).toBe(200);
    });

    it('should return invalid-file when raster image loading fails', async () => {
      // Arrange
      spyOn(console, 'error');
      installImageProcessingMocks(100, 100, true);
      const options: FileUploadOptions = {
        maxSizeBytes: 100,
        allowedTypes: ['image/png'],
      };

      // Act
      const result = await service.processFile(createImageFile(), options);

      // Assert
      expect(result.success).toBeFalse();
      expect(result.error?.type).toBe('invalid-file');
      expect(console.error).toHaveBeenCalled();
    });

    it('should process multiple files independently when called rapidly', async () => {
      // Arrange
      const options: FileUploadOptions = {
        maxSizeBytes: 100,
        allowedTypes: ['image/svg+xml'],
      };

      // Act
      const results = await Promise.all([
        service.processFile(createSvgFile(10), options),
        service.processFile(createSvgFile(20), options),
      ]);

      // Assert
      expect(results.every((result) => result.success)).toBeTrue();
      expect(results[0].base64).not.toBe(results[1].base64);
    });

    it('should reject malformed options before returning a validation result', async () => {
      // BUG SUSPECTED: processFile assumes options.allowedTypes exists.
      const file = createImageFile();

      await expectAsync(
        service.processFile(file, { maxSizeBytes: 100, allowedTypes: undefined as unknown as string[] })
      ).toBeRejected();
    });
  });

  describe('createPreviewUrl', () => {
    it('should create preview URL from base64', () => {
      // Arrange
      const base64 =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

      // Act
      const url = service.createPreviewUrl(base64);

      // Assert
      expect(url).toMatch(/^blob:/);

      // Cleanup
      service.revokePreviewUrl(url);
    });

    it('should handle invalid base64 format', () => {
      // Arrange
      const invalidBase64 = 'invalid-base64-string';

      // Act & Assert
      expect(() => service.createPreviewUrl(invalidBase64)).toThrow();
    });

    it('should create preview URLs for SVG data URLs', () => {
      // Arrange
      const base64 = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg"></svg>')}`;

      // Act
      const url = service.createPreviewUrl(base64);

      // Assert
      expect(url).toMatch(/^blob:/);

      // Cleanup
      service.revokePreviewUrl(url);
    });

    it('should throw when the base64 payload is malformed', () => {
      // Arrange
      const invalidPayload = 'data:image/png;base64,%%%';

      // Act & Assert
      expect(() => service.createPreviewUrl(invalidPayload)).toThrow();
    });

    it('should create a preview URL for an empty base64 payload', () => {
      // Arrange
      const emptyPayload = 'data:image/png;base64,';

      // Act
      const url = service.createPreviewUrl(emptyPayload);

      // Assert
      expect(url).toMatch(/^blob:/);

      // Cleanup
      service.revokePreviewUrl(url);
    });
  });

  describe('revokePreviewUrl', () => {
    it('should revoke a previously created preview URL', () => {
      // Arrange
      const revokeSpy = spyOn(URL, 'revokeObjectURL');
      const url = 'blob:test-preview';

      // Act
      service.revokePreviewUrl(url);

      // Assert
      expect(revokeSpy).toHaveBeenCalledOnceWith(url);
    });

    it('should pass arbitrary strings through to URL revocation without throwing', () => {
      // Arrange
      spyOn(URL, 'revokeObjectURL');

      // Act & Assert
      expect(() => service.revokePreviewUrl('not-a-blob-url')).not.toThrow();
      expect(URL.revokeObjectURL).toHaveBeenCalledOnceWith('not-a-blob-url');
    });
  });

  describe('Utility Methods', () => {
    it('should format file sizes correctly', () => {
      // Since formatFileSize is private, we test it indirectly through error messages
      const largeFile = new File(['x'.repeat(1024 * 1024)], 'large.png', { type: 'image/png' });
      const options: FileUploadOptions = {
        maxSizeBytes: 512 * 1024, // 512KB
        allowedTypes: ['image/png'],
      };

      const error = service.validateDroppedFiles([largeFile] as never, options);
      expect(error?.message).toContain('KB');
      expect(error?.message).toContain('MB');
    });

    it('should format allowed file types correctly', () => {
      const invalidFile = new File(['content'], 'test.gif', { type: 'image/gif' });
      const options: FileUploadOptions = {
        maxSizeBytes: 1024 * 1024,
        allowedTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
      };

      const error = service.validateDroppedFiles([invalidFile] as never, options);
      expect(error?.message).toContain('.png');
      expect(error?.message).toContain('.jpg/.jpeg');
      expect(error?.message).toContain('.svg');
    });
  });
});
