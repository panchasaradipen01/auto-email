import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: './graphql/schema/schema.graphql',
  generates: {
    './graphql/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        useIndexSignature: true,
        contextType: '@/graphql/context#Context',
        scalars: {
          JSON: 'Record<string, any>',
        },
      },
    },
  },
};

export default config;
