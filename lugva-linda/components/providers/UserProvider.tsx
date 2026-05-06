'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

export type UserProfile = {
  id: string;
  email: string;
  username: string | null;
  colorHex: string;
} | null;

type UserContextType = {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({
  initialUser,
  children,
}: {
  initialUser: UserProfile;
  children: ReactNode;
}) => {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [prevInitialUser, setPrevInitialUser] =
    useState<UserProfile>(initialUser);

  const isSameUser =
    initialUser?.id === prevInitialUser?.id &&
    initialUser?.email === prevInitialUser?.email &&
    initialUser?.username === prevInitialUser?.username &&
    initialUser?.colorHex === prevInitialUser?.colorHex;

  if (!isSameUser) {
    setPrevInitialUser(initialUser);
    setUser(initialUser);
  }

  useEffect(() => {
    if (user?.colorHex) {
      document.documentElement.style.setProperty('--primary', user.colorHex);
    } else {
      document.documentElement.style.setProperty('--primary', '#18181b');
    }
  }, [user?.colorHex]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser doit être utilisé dans un UserProvider');
  }
  return context;
};
