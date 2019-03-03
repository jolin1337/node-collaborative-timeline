const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const timeline = require('./timeline');
const app = express();
const storage = require('./storage');
const sessionTimelines = {};
storage.load().then(items => {
	Object.keys(items).forEach(name => {
		sessionTimelines[name] = timeline.makeNewTimeline(io, name, items[name]._data);
	})
}).catch(e => console.log("Unable to load from database", e));

app.use(express.static('public/'));
app.use(express.static('node_modules'));
app.get('/session/:name', (req, res) => {
	const sessionName = req.params.name;
	if (!(sessionName in sessionTimelines)) {
		console.log("Creating new session: ", sessionName);
		sessionTimelines[sessionName] = timeline.makeNewTimeline(io, sessionName);
	}
	res.sendFile(__dirname + '/public/index.html');
});

const server = http.createServer(app);
const io = socketio(server);
const port = process.env.PORT || 8080;
server.listen(port, () => {
	console.log("Server running on port " + port)
});

setInterval(() => storage.save(sessionTimelines).catch(e => console.log("Unable to save to database")), 1000 * 60 * 15); // Each 15th minute
