// Timeline code
var items = new vis.DataSet({
	type: { start: 'ISODate', end: 'ISODate' }
});
// add items to the DataSet
items.add([
	{id: 1, content: 'item 1<br>start', start: '2014-01-23'},
	{id: 2, content: 'item 2', start: '2018-01-18'},
	{id: 3, content: 'item 3', start: '2014-01-21'},
	{id: 4, content: 'item 4', start: '2014-01-19', end: '2014-01-24'},
	{id: 5, content: 'item 5', start: '2014-01-28', type:'point'},
	{id: 6, content: 'item 6', start: '2014-01-26'}
]);
// Timeline changes event
items.on('*', function (event, properties) {
	console.log(event, properties, properties.items.map(item => items.get(item)));
	if (event == 'remove') {
		var oldItems = properties.oldData;
		oldItems.forEach(item => socket.emit(event, item));
	} else {
		var newItems = properties.items.map(item => items.get(item));
		newItems.forEach(item => socket.emit(event, item));
	}
});

function updateContent(item, callback) {
	item.content = prompt('Edit items text:', item.content)
	if (item.content != null && item.content != '') {
		item.content = item.content.replace(/<\/?[^>]+(>|$)/g, "");
		callback(item); // send back adjusted item
	}
	else {
		callback(null); // cancel updating the item
	}
}

// Options of timeline
var container = document.getElementById('timeline');
var options = {
	start: '2018-02-25',
	end: '2018-03-20',
	min: '2018-01-01',
	max: '2018-04-16',
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
var socket = io();

socket.on('add', function (item) {
		var oldItem = items.get(item.id);
	if (oldItem) return;
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
