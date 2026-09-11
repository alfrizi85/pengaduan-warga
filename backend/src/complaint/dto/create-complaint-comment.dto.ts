import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export type CommentVisibility = 'PUBLIC' | 'INTERNAL';

export class CreateComplaintCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsIn(['PUBLIC', 'INTERNAL'])
  visibility?: CommentVisibility;
}
