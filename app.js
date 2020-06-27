const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// mongodb+srv://admin-rizwan:BBq92u2x@cluster0-va0oc.mongodb.net/todoDB?retryWrites=true&w=majority

mongoose.connect('mongodb://localhost:27017/todoDB', {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

const itemsSchema = {
	itemName: String
};

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
	itemName: 'Learn'
});

const item2 = new Item({
	itemName: 'Read'
});

const item3 = new Item({
	itemName: 'Code'
});

const item4 = new Item({
	itemName: 'Make'
});

const defaultItems = [ item1, item2, item3, item4 ];

const listSchema = {
	name: String,
	items: [ itemsSchema ]
};

const List = mongoose.model('List', listSchema);

app.get('/', function(req, res) {
	Item.find({}, function(err, result) {
		if (result.length === 0) {
			Item.insertMany(defaultItems, function(err) {
				if (err) {
					console.log(err);
				} else {
					console.log('Inserted Successfully!');
				}
			});
			res.redirect('/');
		} else {
			res.render('list', { listTitle: 'Today', newListItems: result });
		}
	});
});

app.post('/', function(req, res) {
	const newItem = req.body.newItem;
	const listName = req.body.list;

	const item = new Item({
		itemName: newItem
	});

	if (listName === 'Today') {
		item.save();
		res.redirect('/');
	} else {
		List.findOne({ name: listName }, function(err, foundList) {
			foundList.items.push(item);
			foundList.save();
			res.redirect('/' + listName);
		});
	}
});

app.post('/delete', function(req, res) {
	const listName = req.body.listName;
	const checkedItem = req.body.checkbox;

	if (listName === 'Today') {
		Item.findByIdAndRemove(checkedItem, function(err) {
			if (err) {
				console.log(err);
			} else {
				console.log('Item Deleted Successfully!');
				res.redirect('/');
			}
		});
	} else {
		List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItem } } }, function(err, foundList) {
			if (!err) {
				res.redirect('/' + listName);
			} else {
				console.log(err);
			}
		});
	}
});

app.get('/:customList', function(req, res) {
	const customListName = _.capitalize(req.params.customList);

	List.findOne({ name: customListName }, function(err, foundList) {
		if (!err) {
			if (!foundList) {
				const list = new List({
					name: customListName,
					items: defaultItems
				});

				list.save();
				res.redirect('/' + customListName);
			} else {
				res.render('list', { listTitle: foundList.name, newListItems: foundList.items });
			}
		}
	});
});

let port = process.env.PORT;
if (port == null || port == '') {
	port = 3000;
}

app.listen(port, function() {
	console.log('Server has started successfully!');
});
