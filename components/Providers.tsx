'use client';

import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { ApolloProvider } from '@apollo/client';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import store from '@/store';
import { apolloClient } from '@/store/api/graphqlApi';
import { Toaster } from 'sonner';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Global Client Context Providers wrapper.
 * Sets up NextAuth Session, Redux Store, Apollo Client GraphQL, Theme management, and Toasts.
 */
export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <Provider store={store}>
        <ApolloProvider client={apolloClient}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </ApolloProvider>
      </Provider>
    </SessionProvider>
  );
}
