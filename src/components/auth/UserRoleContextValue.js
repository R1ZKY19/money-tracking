import { createContext } from 'react';

// Keep provider and consumers on one context when role logic is hot-reloaded.
const UserRoleContextValue = createContext(null);

export default UserRoleContextValue;