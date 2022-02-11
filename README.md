# AZReader
formerly called EZReader, developed in React under IonicFramework

# Prerequisites
You must have installed Ionic v6

**Installation**
clone the project and run 
<pre>npm i</pre>

# Configuration
create environemnt wiht empty <code>environment.ts</code> file in <code>/config</code> directory, then build your environemnt using your <code>set-env.js</code>.
<pre>
export DEBUG=true && 
export PARSER_ENDPOINT=http://localhost:PORT && 
export API_ENDPOINT=https://database-name.firebaseio.com/ && 
export FIREBASE_AUTH=https://identitytoolkit.googleapis.com/ && 
export FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY && 
npm run config
</pre> 
# Run the project
<pre>npm run start</pre>


# Parser installation
If you don't already have the mercury parser api installed, do that
<pre>git clone https://github.com/postlight/mercury-parser-api.git</pre>

**Install dependencies**
<pre>yarn install</pre>

**API Gateway-like local dev server**
To spin up a local dev server that will more closely match the API Gateway endpoint/experience:
<pre>yarn serve</pre>

