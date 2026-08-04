import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { FilesService, type FileUploadPurpose } from './files.service';

@ApiTags('files')
@Controller({ path: 'files', version: '1' })
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  async upload(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
    @Query('purpose') purpose: FileUploadPurpose = 'content',
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.filesService.upload(user.id, file.originalname, file.buffer, purpose);
  }

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.filesService.listForUser(user.id);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.filesService.delete(id, user.id);
    return { success: true };
  }
}
