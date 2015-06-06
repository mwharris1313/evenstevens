/* 
* @Author: Nathan Bailey
* @Date:   2015-05-27 14:23:20
* @Last Modified by:   nathanbailey
* @Last Modified time: 2015-06-06 12:05:16
*/

var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

var CHANGE_EVENT = 'change';

var _userName = null
var _billName = "";
var _isLoading = false;
var _diners = {};
var _itemCount = 0;
var _itemToDiner = [];
var _socket = null;
var _userTotals = {};
var _items = [];
var _totals = {};
var _tipPercent = 0;

// This sets the inital state of the receipt as received
// from the server on first connection
var setReceipt = function(items, diners, itemCount, itemToDiner, socket, billName) {
  _items = items;
  _itemCount = itemCount;
  _diners = diners;
  _itemToDiner = itemToDiner;
  _socket = socket;
  _billName = billName
};

var setTotals = function(receipt) {
  _totals.subTotal = receipt.subTotal
  _totals.tax = receipt.tax
  _totals.total = receipt.total
  _totals.tip = receipt.tip
  _totals.grandTotal =receipt.grandTotal
};

var setTipPercent = function(tipPercent) {
  _tipPercent = tipPercent;
}

var setName = function(name) {
  _userName = name;
};

var setLoading = function(bool) {
  _isLoading = bool;
};

var setToggleItem = function(itemIndex) {

  // Toggle True/False in current users claimed items array
  _diners[_userName][itemIndex] = !_diners[_userName][itemIndex];

  var isClaimedByCurrentUser = _diners[_userName][itemIndex];
  var itemToDiner = _itemToDiner[itemIndex];

  // If currentUser is claiming item, push it to the 
  // itemToDiner array (this maps item index to user)
  if(isClaimedByCurrentUser){
    itemToDiner.push(_userName); 
  } else {
  // Otherwise, splice the name out of the array 
    var index = itemToDiner.indexOf(_userName);
    itemToDiner.splice(index, 1);
  }

  // maintain consistent order of diner names
  itemToDiner.sort();

  // Let the server know about the changes so that
  // the other 
  _socket.emit('userUpdate', {billName: _billName, 
    userName: _userName, array:  _diners[_userName] 
  });
};

var calcUserTotals = function() {
  _userTotals = {};
  _itemToDiner.forEach(function(item, index){
    item.forEach(function(name){
      _userTotals[name] = _userTotals[name] || 0;
      _userTotals[name] += _items[index].cost / item.length
    });
  });
};

var updateDiners = function(diner){
  // overwrite old array with new diner data from server
  _diners[diner.userName] = diner.array;

  // index of name in itemToDiner array
  var nameIndex;

  // This updates the itemToDiner arrays to contain
  // a list of names of all the diners claiming each item
  for(var i = 0; i < _diners[diner.userName].length; i++){
    nameIndex = _itemToDiner[i].indexOf(diner.userName);
    if(_diners[diner.userName][i] && nameIndex === -1) {
       _itemToDiner[i].push(diner.userName);
    } else if (!_diners[diner.userName][i] && nameIndex > -1) {
      _itemToDiner[i].splice(nameIndex, 1);
    }
    _itemToDiner[i].sort();
  }
};

var AppStore = assign({}, EventEmitter.prototype, {
  getTipPercent: function() {
    return _tipPercent;
  },
  getUserName: function() {
    return _userName;
  },
  getUserTotals: function() {
    return _userTotals;
  },
  getDiners: function() {
    return _diners;
  },
  getIsLoading: function() {
    return _isLoading;
  },
  getItemToDiner: function(){
    return _itemToDiner;
  },
  getItems: function() {
    return _items;
  },
  getBillName: function() {
    return _billName;
  },
  getTotals: function() {
    return _totals;
  },
  getUserTotals: function(){
    return _userTotals;
  },
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },
  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },
  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
});

AppDispatcher.register(function(action) {
  var name;

  switch(action.actionType) {
    case 'ADD_TIP_PERCENT':
      setTipPercent(action.payload);
      AppStore.emitChange();
      break;
    case 'ADD_USER':
      name = action.payload.trim();
      if (name !== '') {
        setName(name);
        AppStore.emitChange();
      }
      break;
    case 'ITEM_TOGGLE':
      setToggleItem(action.payload);
      calcUserTotals();
      AppStore.emitChange();
      break;
    case 'INITIAL_DATA':
      setTotals(action.receipt);
      setReceipt(action.items, action.diners,
        action.itemCount,action.itemToDiner, 
        action.socket, action.billName);
      calcUserTotals();
      AppStore.emitChange();
      break;
    case 'UPDATE_FROM_SERVER':
      updateDiners(action.payload);
      calcUserTotals();
      AppStore.emitChange();
      break;
    case 'TOGGLE_LOADING_VIEW':
      setLoading(action.payload);
      AppStore.emitChange();
      break;
    default: 
    return;
  }
});

module.exports = AppStore;

