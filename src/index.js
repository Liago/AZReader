import React from 'react';
import ReactDOM from 'react-dom';

import { createClient } from '@supabase/supabase-js'
import { DatabaseProvider } from './common/context/dbContext';

import App from './App';
import reportWebVitals from './reportWebVitals';

const supabase = createClient('https://wjotvfawhnibnjgoaqud.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqb3R2ZmF3aG5pYm5qZ29hcXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTA0NDMxMDcsImV4cCI6MjAwNjAxOTEwN30.xtirkUL9f4ciRcJNvwtkGuWGTMcTfRKD3KW9kdZWBpo')


ReactDOM.render(
	<React.StrictMode>
		<DatabaseProvider database={supabase}>
			<App />
		</DatabaseProvider>
	</React.StrictMode>,
	document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
