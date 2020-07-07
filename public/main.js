(function () {
// Start capsulating function
// DOM dymaics
var userNameElement = document.getElementById('user-name');
document.getElementById('btn-create-user').onclick = function () {
	socket.emit('add user', userNameElement.value);
	var container = document.getElementById('create-user');
	container.style.display = 'none';
};
var nodeNameElement = document.getElementById('node-name');




// Timeline code
var items = new vis.DataSet({
	type: { start: 'ISODate', end: 'ISODate' }
});
// Timeline changes event
items.on('*', function (event, properties) {
	console.log(event, properties, properties.items.map(item => items.get(item)));
	if (event == 'remove') {
		var oldItems = properties.oldData;
		oldItems.forEach(item => socket.emit(event, item));
	} else {
		var newItems = properties.items.map(item => items.get(item));
		newItems.forEach(item => {
			socket.emit(event, item);
		});
	}
});

function updateContent(item, callback) {
	// item.content = prompt('Edit items text:', item.content)
	if (item.content != null && item.content != '') {
		item.content = item.content === 'new item' ? '' : item.content;
		nodeNameElement.value = item.content;
		document.getElementById('node-editor').style.display = 'inline-block';
		var authorName = document.getElementById('author-name');
		authorName.innerHTML = 'Författare: <b>' + (item.creatorName && item.creatorName != userNameElement.value ? item.creatorName : 'Du') + '</b>';
		(item.history || []).reverse().forEach((event, index) => {
			if (index >= 4) return;
			authorName.innerHTML += '<p><b>' + event.text + '</b>, ' + event.time + '</p>';
		})
		nodeNameElement.focus();
		document.getElementById('save-btn-node').onclick = function () {
			item.content = nodeNameElement.value.replace(/<\/?[^>]+(>|$)/g, "");
			if (item.creatorName == undefined) {
				item.creatorName = userNameElement.value;
			}
			if (nodeNameElement.value != '') {
				document.getElementById('node-editor').style.display = 'none';
				callback(item); // send back adjusted item
			}
		};
		document.getElementById('import-btn-node').onchange = function (evt) {
			var file = evt.target.files[0];
			var reader = new FileReader();

			// Closure to capture the file information.
			reader.onload = (function(theFile) {
				return function(e) {
					var dates = {};
					var importedItems = e.target.result.split('\n').map(item => {
						var itemPart = item.split(' - ', 2);
						if (itemPart.length < 2) return;
						var contentPart = itemPart[1].split(': ', 2);
						if (contentPart < 2) return;
						var date = itemPart[0].split(' ')[0];
						if (dates[date] > 4) return;
						dates[date] = (dates[date] || 0) + 1;
						return {
							creatorName: contentPart[0], // userNameElement.value,
							content: contentPart[1],
							start: new Date(itemPart[0])
						}
					}).filter(line => !!line);
					console.log("Imported", items.length, "items");
					items.add(importedItems);
					callback(null);
				};
			})(file);
			reader.readAsText(file);
		};
	}
	else {
		callback(null); // cancel updating the item
	}
}
document.addEventListener('keyup', function (event) {
	if (event.keyCode === 27) { // If escape was pressed
		document.getElementById('node-editor').style.display = 'none';
	}
});

// Socket stuff down below
var sessionName = location.pathname.split('/').slice(-1)[0];
var socket = io(`/${sessionName}`);
console.log(socket);
var timeline;
var autoResize = true
var start, end;
socket.on('options', function (socketOptions) {
	if (timeline !== undefined) return location.reload();
	// Options of timeline
	var container = document.getElementById('timeline');
	var options = Object.assign(socketOptions, {
		multiselect: false,
		height: '100%',
		showCurrentTime: true,
		onUpdate: updateContent,
		onAdd: updateContent,
		autoResize: true
	});
	var timeline = new vis.Timeline(container, items, options);
	setTimeout(() => { autoResize = false }, 5000)
});


socket.on('add', function (item) {
	var oldItem = items.get(item.id);
	if (oldItem) {
		return;
	}
	console.log("Add", item)
	items.add(item);
	if (start > item.start) start = new Date(item.start);
	if (end < item.start) end = new Date(item.start);
	if (autoResize && timeline) {
		console.log("Setting window")
		timeline.setWindow(start, end)
	}
});
socket.on('update', function (newItem) {
	var item = items.get(newItem.id);
	if (!item || JSON.stringify(newItem) == JSON.stringify(item)) return;
	items.update(newItem);
});
socket.on('remove', function (item) {
	items.remove(item.id);
});

socket.on('disconnect', function () {
	alert('You have been disconnected, refresh the page to reconnect');
});

socket.on('reconnect', function () {
});

socket.on('reconnect_error', function () {
	alert('You have been disconnected, refresh the page to reconnect');
});

// End capsulating function
})();
