import { Injectable } from '@angular/core';

export interface FileValidationError {
  type: 'invalid-type' | 'too-large' | 'invalid-file';
  message: string;
}

export interface FileUploadResult {
  success: boolean;
  base64?: string;
  error?: FileValidationError;
}

export interface FileUploadOptions {
  maxSizeBytes: number;
  allowedTypes: string[];
  maxWidth?: number;
  maxHeight?: number;
}

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  private readonly DEFAULT_MAX_SIZE = 2 * 1024 * 1024; // 2MB
  private readonly ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

  /**
   * Validates and processes an uploaded logo file
   */
  public async processLogoFile(file: File): Promise<FileUploadResult> {
    const options: FileUploadOptions = {
      maxSizeBytes: this.DEFAULT_MAX_SIZE,
      allowedTypes: this.ALLOWED_LOGO_TYPES,
      maxWidth: 800,
      maxHeight: 600,
    };

    return this.processFile(file, options);
  }

  /**
   * Generic file processing method
   */
  public async processFile(file: File, options: FileUploadOptions): Promise<FileUploadResult> {
    // Validate file type
    if (!options.allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: {
          type: 'invalid-type',
          message: `File type "${file.type}" is not supported. Please use ${this.formatAllowedTypes(options.allowedTypes)}.`,
        },
      };
    }

    // Validate file size
    if (file.size > options.maxSizeBytes) {
      return {
        success: false,
        error: {
          type: 'too-large',
          message: `File size (${this.formatFileSize(file.size)}) exceeds the maximum limit of ${this.formatFileSize(
            options.maxSizeBytes
          )}.`,
        },
      };
    }

    try {
      let base64: string;

      if (file.type === 'image/svg+xml') {
        // Handle SVG files as text
        base64 = await this.convertSvgToBase64(file);
      } else {
        // Handle raster images with optional resizing
        base64 = await this.convertImageToBase64(file, options);
      }

      return {
        success: true,
        base64,
      };
    } catch (error) {
      console.error('Error processing file:', error);
      return {
        success: false,
        error: {
          type: 'invalid-file',
          message: 'Failed to process the selected file. Please try a different file.',
        },
      };
    }
  }

  /**
   * Creates a blob URL from base64 data for preview purposes
   */
  public createPreviewUrl(base64: string): string {
    // Extract the data part (remove data:image/png;base64, prefix)
    const [header, data] = base64.split(',');
    const mimeMatch = header.match(/data:([^;]+);base64/);

    if (!mimeMatch) {
      throw new Error('Invalid base64 format');
    }

    const mimeType = mimeMatch[1];
    const binaryData = atob(data);
    const bytes = new Uint8Array(binaryData.length);

    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  /**
   * Revokes a previously created blob URL to free memory
   */
  public revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Validates dropped files for drag-and-drop functionality
   */
  public validateDroppedFiles(files: FileList | null, options: FileUploadOptions): FileValidationError | null {
    if (!files || files.length === 0) {
      return {
        type: 'invalid-file',
        message: 'No files were dropped.',
      };
    }

    if (files.length > 1) {
      return {
        type: 'invalid-file',
        message: 'Please drop only one file at a time.',
      };
    }

    const file = files[0];

    if (!options.allowedTypes.includes(file.type)) {
      return {
        type: 'invalid-type',
        message: `File type "${file.type}" is not supported. Please use ${this.formatAllowedTypes(options.allowedTypes)}.`,
      };
    }

    if (file.size > options.maxSizeBytes) {
      return {
        type: 'too-large',
        message: `File size (${this.formatFileSize(file.size)}) exceeds the maximum limit of ${this.formatFileSize(options.maxSizeBytes)}.`,
      };
    }

    return null;
  }

  private async convertSvgToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read SVG file'));
      };

      reader.readAsDataURL(file);
    });
  }

  private async convertImageToBase64(file: File, options: FileUploadOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          let { width, height } = img;

          // Apply maximum dimensions if specified
          if (options.maxWidth && width > options.maxWidth) {
            height = (height * options.maxWidth) / width;
            width = options.maxWidth;
          }

          if (options.maxHeight && height > options.maxHeight) {
            width = (width * options.maxHeight) / height;
            height = options.maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw image with proper dimensions
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to base64 with quality optimization
          const base64 = canvas.toDataURL(file.type, 0.9);
          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // Create object URL for the image
      img.src = URL.createObjectURL(file);
    });
  }

  private formatAllowedTypes(types: string[]): string {
    const extensions = types.map((type) => {
      switch (type) {
        case 'image/png':
          return '.png';
        case 'image/jpeg':
        case 'image/jpg':
          return '.jpg/.jpeg';
        case 'image/svg+xml':
          return '.svg';
        default:
          return type;
      }
    });

    return extensions.join(', ');
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
