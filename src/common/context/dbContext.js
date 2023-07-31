// DatabaseContext.js
import { createContext, useState } from 'react';

const DatabaseContext = createContext();

const DatabaseProvider = ({ database, children }) => {
	const [supabase, setDatabase] = useState(database);

	return (
		<DatabaseContext.Provider value={{ supabase, setDatabase }}>
			{children}
		</DatabaseContext.Provider>
	);
};

export { DatabaseContext, DatabaseProvider };
