import { useCookies } from 'react-cookie';
import FullScreenLoader from '../components/FullScreenLoader';
import React from 'react';
import { IUser } from '../libs/types';
import { useQueryClient } from 'react-query';
import useStore from '../store';
import { trpc } from '../utils/trpc';

type AuthMiddlewareProps = {
  children: React.ReactElement;
};

const AuthMiddleware: React.FC<AuthMiddlewareProps> = ({ children }) => {
  const [cookies] = useCookies(['logged_in']);
  const store = useStore();
  console.log('I was called');

  const queryClient = useQueryClient();
  const { refetch } = trpc.useQuery(['auth.refresh'], {
    retry: 1,
    enabled: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries('users.me');
    },
    onError: (err) => {
      document.location.href = '/login';
    },
  });

  const query = trpc.useQuery(['users.me'], {
    enabled: !!cookies.logged_in,
    retry: 1,
    select: (data) => data.data.user,
    onSuccess: (data) => {
      store.setAuthUser(data as IUser);
    },
    onError: (error) => {
      let retryRequest = true;
      if (error.message.includes('must be logged in') && retryRequest) {
        retryRequest = false;
        try {
          refetch({ throwOnError: true });
        } catch (err: any) {
          if (err.message.includes('Could not refresh access token')) {
            document.location.href = '/login';
          }
        }
      }
    },
  });

  if (query.isLoading) {
    return <FullScreenLoader />;
  }

  return children;
};

export default AuthMiddleware;
