import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

interface MinioConfig {
  minioEndpoint: string;
  minioPort: number;
  minioUseSSL: boolean;
  minioBucket: string;
  minioBrowseBucket?: string;
  minioAccessKey: string;
  minioSecretKey: string;
}

export interface MinioUploadResult {
  publicUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class MinioUploadService {
  private readonly configPath = 'assets/minio.config.json';

  constructor(private http: HttpClient) {}

  uploadFile(file: File): Observable<MinioUploadResult> {
    return this.uploadFileWithProgress(file);
  }

  uploadFileWithProgress(
    file: File,
    onProgress?: (progress: number) => void,
  ): Observable<MinioUploadResult> {
    return this.http
      .get<MinioConfig>(this.configPath)
      .pipe(
        switchMap((config) =>
          from(this.uploadWithConfig(config, file, onProgress)),
        ),
      );
  }

  private async uploadWithConfig(
    config: MinioConfig,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<MinioUploadResult> {
    const objectKey = file.name || 'upload';
    const client = this.createS3Client(config);
    const totalBytes = file.size || undefined;

    const upload = new Upload({
      client,
      params: {
        Bucket: config.minioBucket,
        Key: objectKey,
        Body: file,
      },
    });

    if (onProgress) {
      upload.on('httpUploadProgress', (progress) => {
        const loaded = progress?.loaded ?? 0;
        const total = progress?.total ?? totalBytes ?? 0;
        if (!total) {
          onProgress(0);
          return;
        }
        onProgress(Math.round((loaded / total) * 100));
      });
    }

    await upload.done();

    return {
      publicUrl: this.buildPublicUrl(config, objectKey),
    };
  }

  private buildPublicUrl(config: MinioConfig, objectName: string): string {
    const encodedObjectName = objectName
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');

    const protocol = config.minioUseSSL ? 'https' : 'http';
    const defaultPort =
      (config.minioUseSSL && config.minioPort === 443) ||
      (!config.minioUseSSL && config.minioPort === 80);
    const portPart = defaultPort ? '' : `:${config.minioPort}`;
    return `${protocol}://${config.minioEndpoint}${portPart}/${config.minioBucket}/${encodedObjectName}`;
  }

  private createS3Client(config: MinioConfig): S3Client {
    const protocol = config.minioUseSSL ? 'https' : 'http';
    const defaultPort =
      (config.minioUseSSL && config.minioPort === 443) ||
      (!config.minioUseSSL && config.minioPort === 80);
    const portPart = defaultPort ? '' : `:${config.minioPort}`;
    const endpoint = `${protocol}://${config.minioEndpoint}${portPart}`;

    return new S3Client({
      region: 'us-east-1',
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.minioAccessKey,
        secretAccessKey: config.minioSecretKey,
      },
    });
  }
}
