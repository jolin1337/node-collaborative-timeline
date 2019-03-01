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
		document.getElementById('btn-node').onclick = function () {
			item.content = nodeNameElement.value.replace(/<\/?[^>]+(>|$)/g, "");
			if (item.creatorName == undefined) {
				item.creatorName = userNameElement.value;
			}
			if (nodeNameElement.value != '') {
				document.getElementById('node-editor').style.display = 'none';
				callback(item); // send back adjusted item
			}
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

// Options of timeline
var container = document.getElementById('timeline');
var options = {
	start: '2018-11-01',
	end: '2018-03-20',
	min: '2018-01-01',
	max: '2018-12-25',
	height: '100%',
	// allow selecting multiple items using ctrl+click, shift+click, or hold.
	multiselect: false,
	// allow manipulation of items
	editable: true,
	/* alternatively, enable/disable individual actions:
	editable: {
	add: true,
	updateTime: true,
	updateGroup: true,
	remove: true
	},
	*/
	showCurrentTime: true,
	onUpdate: updateContent,
	onAdd: updateContent
};
var timeline = new vis.Timeline(container, items, options);

// Socket stuff down below
var sessionName = location.pathname.split('/').slice(-1)[0];
var socket = io(`/${sessionName}`);

socket.on('add', function (item) {
	var oldItem = items.get(item.id);
	if (oldItem) {
		return;
	}
	items.add(item);
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
