import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[а-яё]/g, (char) => {
      const map: Record<string, string> = {
        а: 'a',
        б: 'b',
        в: 'v',
        г: 'g',
        д: 'd',
        е: 'e',
        ё: 'e',
        ж: 'zh',
        з: 'z',
        и: 'i',
        й: 'y',
        к: 'k',
        л: 'l',
        м: 'm',
        н: 'n',
        о: 'o',
        п: 'p',
        р: 'r',
        с: 's',
        т: 't',
        у: 'u',
        ф: 'f',
        х: 'h',
        ц: 'ts',
        ч: 'ch',
        ш: 'sh',
        щ: 'sch',
        ъ: '',
        ы: 'y',
        ь: '',
        э: 'e',
        ю: 'yu',
        я: 'ya',
      };
      return map[char] || char;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fillSlugs() {
  // Получаем все услуги
  const services = await prisma.service.findMany({
    orderBy: { id: 'asc' },
  });

  console.log(`Found ${services.length} services to process`);

  for (const service of services) {
    // Генерируем slug из имени
    const baseSlug = generateSlug(service.name);
    let uniqueSlug = baseSlug;
    let counter = 1;

    // Проверяем уникальность (исключая текущий сервис)
    while (
      await prisma.service.findFirst({
        where: {
          slug: uniqueSlug,
          id: { not: service.id },
        },
      })
    ) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Обновляем slug
    await prisma.service.update({
      where: { id: service.id },
      data: { slug: uniqueSlug },
    });

    console.log(
      `✓ Updated service "${service.name}" (ID: ${service.id}) with slug "${uniqueSlug}"`,
    );
  }

  console.log('\n✅ All slugs filled successfully!');
}

fillSlugs()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
