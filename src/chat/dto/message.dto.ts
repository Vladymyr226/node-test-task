import { IsString, IsEnum, IsNumber, IsOptional, IsDate, IsBoolean, IsInt } from 'class-validator'

export class MessageDto {
  @IsString()
  id: string

  @IsString()
  dialogId: string

  @IsString()
  senderId: string

  @IsInt()
  createdAt: bigint

  @IsBoolean()
  delivered: boolean

  @IsEnum(['text', 'image', 'video'])
  type: 'text' | 'image' | 'video'

  @IsOptional()
  @IsString()
  content?: string

  @IsOptional()
  @IsString()
  caption?: string

  @IsOptional()
  @IsString()
  imageUrl?: string

  @IsOptional()
  @IsString()
  videoUrl?: string

  @IsOptional()
  @IsString()
  thumbnailUrl?: string

  @IsOptional()
  @IsNumber()
  duration?: number

  @IsOptional()
  @IsDate()
  updatedAt?: Date
}
