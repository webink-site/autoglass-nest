import { Test, TestingModule } from '@nestjs/testing';
import { GlobalsController } from './globals.controller';
import { GlobalsService } from './globals.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GlobalsController', () => {
  let controller: GlobalsController;

  const mockGlobalsService = {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockPrismaService = {
    globals: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GlobalsController],
      providers: [
        {
          provide: GlobalsService,
          useValue: mockGlobalsService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<GlobalsController>(GlobalsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
