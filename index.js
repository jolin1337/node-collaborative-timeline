var express = require('express');

var app = express();

app.use(express.static('public/'));
app.use(express.static('node_modules'));

var server = require('http').createServer(app);
var port = process.env.PORT || 8080;
server.listen(port, function (){
	console.log("Server running on port " + port)
});

var items = new (function() {
	this._data = JSON.parse(process.env.INIT_DATA || '[]');
	this.get = function(id) {
		return this._data.find(item => item.id == id);
	};
	this.add = function(item) {
		if (this.get(item.id)) return;
		this._data.push(item);
		return item;
	};
	this.remove = function (id) {
		var items = this._data.filter(item => item.id == id);
		if (items.length == 0) return;
		items.forEach(item => this._data.splice(this._data.indexOf(item), 1))
		return items[0];
	};
	this.update = function (newItem) {
		var item = this.get(newItem.id);
		if (!item || (item.content == newItem.content && item.start == newItem.start)) return;
		if (newItem.content != null) item.content = newItem.content;
		if (newItem.start != null) item.start = newItem.start;
		// if (new_item.end != null) item.end = new_item.end;
		return item;
	};
})();

var io = require('socket.io')(server);

io.on('connection', function(socket) {
	const createHistory = (history) => {
		return {
			text: history,
			time: new Date().toDateString()
		}
	};
	let addedUser = false;
	let userName = null;

	socket.on('add user', function (name) {
		if (addedUser) return;
		addedUser = true;
		userName = name;
		items._data.forEach(function (item) {
			socket.emit('add', item);
		});
	});
	socket.on('update', function (item) {
		if (userName == null) return;
		item = items.update(item);
		if (item) {
			item.history.push(createHistory(userName + ' updated item'));
			console.log('update', item);
			socket.broadcast.emit('update', item);
			socket.emit('update', item);
		}
	});
	socket.on('add', function (item) {
		if (userName == null) return;
		item.creatorName = userName;
		item.history = [createHistory(userName + ' created item')];
		item = items.add(item);
		if (item) {
			console.log('add', item);
			socket.broadcast.emit('add', item);
			socket.emit('update', item);
		}
	});
	socket.on('remove', function (item) {
		if (userName == null) return;
		item = items.remove(item.id);
		if (item) {
			item.history.push(createHistory(userName + ' removed item'));
			console.log('remove', item);
			socket.broadcast.emit('remove', item);
		}
	});
});
