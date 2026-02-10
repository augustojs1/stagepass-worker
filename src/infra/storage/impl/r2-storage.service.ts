import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  UnprocessableEntityException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PutObjectCommand,
  S3Client,
  HeadObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { ICloudStorageService } from '@/infra/storage';
import { PreSignedResponse } from '@/infra/storage/models';

@Injectable()
export class R2StorageService implements ICloudStorageService {
  private readonly logger: Logger = new Logger(R2StorageService.name);
  private readonly s3Client: S3Client;
  private bucket: string;
  private readonly MAX_OBJECT_SIZE_IN_BYTES: number = 7 * 1024 * 1024; // 7 Mb
  private readonly VALID_OBJECT_CONTENT_TYPES: string[] = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/webp',
  ];

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      credentials: {
        accessKeyId: this.configService.get<string>('r2.access_key'),
        secretAccessKey: this.configService.get<string>('r2.secret_access_key'),
      },
      endpoint: this.configService.get<string>('r2.endpoint'),
      region: this.configService.get<string>('r2.region'),
      forcePathStyle: true,
    });

    this.bucket = this.configService.get<string>('r2.bucket');
  }

  async createPresignedUploadUrl(
    key: string,
    expiresIn: number = 300,
    contentType: string,
  ): Promise<PreSignedResponse> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      });

      this.logger.log('Successfully created Pre-Signed URL');

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return {
        key,
        uploadUrl,
        publicUrl: this.configService.get<string>('r2.public_url'),
      };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        `An error has occured while trying to generate pre-signed URL for ${key}`,
      );
    }
  }

  async getObject(key: string): Promise<void> {
    try {
      const object = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      await this.validateObjectImageFile(key, object);
    } catch (err: any) {
      const status = err?.$metadata?.httpStatusCode;

      if (err?.name === 'NotFound' || status === 404) {
        this.logger.error(`File not found in storage: ${key}`);
        throw new BadRequestException(`File not found in storage: ${key}`);
      }

      if (err instanceof HttpException) {
        throw err;
      }

      this.logger.error(`Failed to verify file in storage: ${key}`, err);
      throw new InternalServerErrorException(
        `Failed to verify file in storage: ${key}`,
      );
    }
  }

  async removeObject(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      this.logger.log(`Successfully removed file ${key} from storage!`);
    } catch (err: any) {
      const status = err?.$metadata?.httpStatusCode;

      if (err?.name === 'NotFound' || status === 404) {
        this.logger.error(`File not found in storage: ${key}`);
        throw new BadRequestException(`File not found in storage: ${key}`);
      }
    }
  }

  async validateObjectImageFile(
    key: string,
    object: HeadObjectCommandOutput,
  ): Promise<void> {
    if (!this.VALID_OBJECT_CONTENT_TYPES.includes(object.ContentType)) {
      await this.removeObject(key);
      this.logger.error(
        `Invalid content type object ${key} of content type ${object.ContentType}`,
      );
      throw new UnprocessableEntityException(
        'Invalid object content type! Object should be an image file!',
      );
    }

    if (object.ContentLength > this.MAX_OBJECT_SIZE_IN_BYTES) {
      await this.removeObject(key);
      this.logger.error(
        `Invalid content length object ${key} of content length ${object.ContentLength}`,
      );
      throw new UnprocessableEntityException(
        `Object shouldn't surpass the max content length of ${this.MAX_OBJECT_SIZE_IN_BYTES} bytes!`,
      );
    }
  }
}
