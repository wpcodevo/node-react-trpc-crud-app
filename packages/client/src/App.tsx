import { useState } from 'react';
import { QueryClientProvider, QueryClient } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { getFetch } from '@trpc/client';
import { trpc } from './utils/trpc';
import { loggerLink } from '@trpc/client/links/loggerLink';
import { httpBatchLink } from '@trpc/client/links/httpBatchLink';
import { useRoutes } from 'react-router-dom';
import routes from './router';
import { BrowserRouter as Router } from 'react-router-dom';
import AuthMiddleware from './middleware/AuthMiddleware';
import { ToastContainer } from 'react-toastify';
import './global.css';
import 'react-toastify/dist/ReactToastify.css';

function AppContent() {
  const content = useRoutes(routes);
  return content;
}

function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
          },
        },
      })
  );
  const url = 'http://localhost:8000/api/trpc';
  const links = [
    loggerLink(),
    httpBatchLink({
      maxBatchSize: 10,
      url,
    }),
  ];
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links,
      fetch: async (input, init?) => {
        const fetch = getFetch();
        return fetch(input, {
          ...init,
          credentials: 'include',
        });
      },
    })
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthMiddleware>
            <AppContent />
          </AuthMiddleware>
          <ToastContainer />
          <ReactQueryDevtools initialIsOpen={false} />
        </Router>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
