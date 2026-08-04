import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { CreateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { qrCodes: true } } },
    });
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { userId_name: { userId, name: dto.name } },
    });
    if (existing) throw new ConflictException('A category with this name already exists');
    return this.prisma.category.create({ data: { userId, name: dto.name, color: dto.color } });
  }

  async remove(userId: string, id: string): Promise<void> {
    const category = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!category) throw new NotFoundException('Category not found');
    await this.prisma.category.delete({ where: { id } });
  }
}
