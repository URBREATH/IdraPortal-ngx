import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

interface MinioConfig {
  minioEndpoint: string;
  minioPort: number;
  minioUseSSL: boolean;
  minioBucket: string;
  minioBrowseBucket?: string;
  minioAccessKey: string;
  minioSecretKey: string;
}

export interface MinioObjectInfo {
  key: string;
  size: number;
}

export interface MinioBrowseEntry {
  type: 'folder' | 'object';
  key: string;
  size?: number;
}

@Injectable({
  providedIn: 'root',
})
export class MinioBrowseService {
  private readonly configPath = 'assets/minio.config.json';

  constructor(private http: HttpClient) {}

  listEntries(prefix: string = ''): Observable<MinioBrowseEntry[]> {
    return this.http
      .get<MinioConfig>(this.configPath)
      .pipe(switchMap((config) => from(this.listEntriesWithPrefix(config, prefix))));
  }

  getPublicUrlForObject(objectName: string): Observable<string> {
    return this.http
      .get<MinioConfig>(this.configPath)
      .pipe(map((config) => this.buildPublicUrl(config, objectName)));
  }

  private async listEntriesWithPrefix(
    config: MinioConfig,
    prefix: string,
  ): Promise<MinioBrowseEntry[]> {
    const client = this.createS3Client(config);
    const results: MinioBrowseEntry[] = [];
    const normalizedPrefix = this.normalizePrefix(prefix);
    const bucketName = this.getBrowseBucketName(config);
    let continuationToken: string | undefined;

    do {
      const response = await client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: normalizedPrefix || undefined,
          Delimiter: '/',
          ContinuationToken: continuationToken,
        }),
      );

      const commonPrefixes = response.CommonPrefixes ?? [];
      commonPrefixes.forEach((prefixInfo) => {
        if (!prefixInfo.Prefix) {
          return;
        }
        results.push({
          type: 'folder',
          key: prefixInfo.Prefix,
        });
      });

      const contents = response.Contents ?? [];
      contents.forEach((item) => {
        if (!item.Key) {
          return;
        }
        if (normalizedPrefix && item.Key === normalizedPrefix) {
          return;
        }
        results.push({
          type: 'object',
          key: item.Key,
          size: item.Size ?? 0,
        });
      });

      continuationToken = response.IsTruncated
        ? response.NextContinuationToken
        : undefined;
    } while (continuationToken);

    return results.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.key.localeCompare(b.key);
    });
  }

  private buildPublicUrl(config: MinioConfig, objectName: string): string {
    const bucketName = this.getBrowseBucketName(config);
    const encodedObjectName = objectName
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');

    const protocol = config.minioUseSSL ? 'https' : 'http';
    const defaultPort =
      (config.minioUseSSL && config.minioPort === 443) ||
      (!config.minioUseSSL && config.minioPort === 80);
    const portPart = defaultPort ? '' : `:${config.minioPort}`;
    return `${protocol}://${config.minioEndpoint}${portPart}/${bucketName}/${encodedObjectName}`;
  }

  private getBrowseBucketName(config: MinioConfig): string {
    return config.minioBrowseBucket || config.minioBucket;
  }

  private normalizePrefix(prefix: string): string {
    if (!prefix) {
      return '';
    }
    return prefix.endsWith('/') ? prefix : `${prefix}/`;
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
