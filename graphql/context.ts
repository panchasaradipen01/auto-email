import prisma from '@/lib/prisma';
import DataLoader from 'dataloader';
import { Template, CsvFile } from '@prisma/client';

export interface Context {
  prisma: typeof prisma;
  userId?: string;
  loaders: {
    template: DataLoader<string, Template>;
    csvFile: DataLoader<string, CsvFile>;
  };
}

/**
 * Creates a per-request Context containing database instances and DataLoaders
 * to prevent N+1 query problems in GraphQL relations.
 */
export function createContext(userId?: string): Context {
  return {
    prisma,
    userId,
    loaders: {
      template: new DataLoader<string, Template>(async (keys) => {
        const templates = await prisma.template.findMany({
          where: { id: { in: keys as string[] } },
        });
        const templateMap = new Map(templates.map((t) => [t.id, t]));
        return keys.map((key) => templateMap.get(key) as Template);
      }),
      csvFile: new DataLoader<string, CsvFile>(async (keys) => {
        const files = await prisma.csvFile.findMany({
          where: { id: { in: keys as string[] } },
        });
        const fileMap = new Map(files.map((f) => [f.id, f]));
        return keys.map((key) => fileMap.get(key) as CsvFile);
      }),
    },
  };
}
