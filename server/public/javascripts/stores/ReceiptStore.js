/* 
* @Author: Nathan Bailey
* @Date:   2015-05-28 15:15:14
* @Last Modified by:   nathanbailey
* @Last Modified time: 2015-06-02 16:31:24
*/

var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');




var CHANGE_EVENT = 'change';

var _items = [];
var _diners = [];
var _totals = {};
var _billName ="";

var setItems = function(items) {
  _items = items;
}

var setDiners = function(diners) {
  _diners = diners;
}

var setTotals = function(receipt) {
  _totals.subTotal = receipt.subTotal
  _totals.tax = receipt.tax
  _totals.total = receipt.total
  _totals.tip = receipt.tip
  _totals.grandTotal =receipt.grandTotal
}


var setBillName = function(billName) {
  _billName = billName;
};


var ReceiptStore = assign({}, EventEmitter.prototype, {
  getItems: function() {
    return _items;
  },
  getDiners: function() {
    return _diners;
  },
  getBillName: function() {
    return _billName;
  },
  getTotals: function() {
    return _totals;
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
  var receiptObj;
  var billName;

  switch(action.actionType) {
    case 'BILL_NAME_LOADED':
      billName = action.payload;
      setBillName(billName);
      ReceiptStore.emitChange();
      break;
    case 'INITIAL_DATA':
      receiptObj = action.payload;
      var receipt = JSON.parse(receiptObj.receipt);
      setItems(receipt.items);
      setTotals(receipt);
      // setDinners(receiptObj.diners);
      ReceiptStore.emitChange();
      break;
    default: 
  }
});

module.exports = ReceiptStore;



