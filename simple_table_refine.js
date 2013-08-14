/**
 * Utility providing very simple 2D Array refinement / cleaning.
 *
 * Utility that provides very simple refinement and data clean up capabilities
 * for 2D arrays / tabular data. Features include filtering rows and columns,
 * replacing elements by string value, string interpretation to other data types
 * (numbers, boolean, dates), and transposition.
 *
 * @author A. Samuel Pottinger (samnsparky, CU Boulder and Gleap LLC)
 * @license MIT
**/

var async = require('async');
var moment = require('moment');

var col_filter = require('./col_filter');
var row_filter = require('./row_filter');
var str_ops = require('./str_ops');
var structure_ops = require('./structure_ops');
var util = require('./util');

// Index of available refinement strategies
var refineStrategies = {
    ignoreRowIf: row_filter.ignoreRowIf,
    ignoreColIf: col_filter.ignoreColIf,
    replace: str_ops.replace,
    interpretStr: str_ops.interpretStr,
    transpose: structure_ops.transpose
};


/**
 * Execute a single refinement operation on the given dataset.
 *
 * Perform a refinement operation on the given dataset (table, 2D Array, Array
 * of Array, etc.). The provided operation should have an operation attribute
 * (String) and param attribute (Object or Array depending on the value of the
 * operation attribute).
 *
 * @param {Object} operation Description of the operation to execute. This
 *      Object should have a String attribute operation describing the type of
 *      operation to execute as well as a param attribute that should be an
 *      Object or Array depending on the operation attribute.
 * @param {Array} targetRows The Array of Array (dataset, table, 2D array) to
 *      operate on. A copy of this dataset will be made and this original
 *      dataset will not be modified.
 * @param {function} onSuccess The function to call after the operation
 *      finishes. That function should take a single parameter for an Array of
 *      Array that will be a modified copy of the original dataset.
 * @param {function} onError An optional parameter for a function to call if
 *      an error is encountered during the refinement operation. This function
 *      should take a single String argument that describes the error
 *      encountered. If this parameter is not provided, an Error will be thrown
 *      if an error is encountered.
**/
function executeOperation(operation, targetRows, onSuccess, onError)
{
    var strategy = refineStrategies[operation.operation];
    strategy(targetRows, operation.param, onSuccess, onError);
}


/**
 * Execute a refinement operation on the given dataset.
 *
 * Perform a refinement operation on the given dataset (table, 2D Array, Array
 * of Array, etc.). The provided operation should have an operation attribute
 * (String) and param attribute (Object or Array depending on the value of the
 * operation attribute). Operation can also accept an Array of Object and will
 * execute each operation in the order emitted from that iterable.
 *
 * @param {Object or Array} operation Description of the operation(s) to
 *      execute. Pass Object for single operation or Object Array for many. Each
 *      Object should have a String attribute operation describing the type of
 *      operation to execute as well as a param attribute that should be an
 *      Object or Array depending on the operation attribute.
 * @param {Array} targetRows The Array of Array (dataset, table, 2D array) to
 *      operate on. A copy of this dataset will be made and this original
 *      dataset will not be modified.
 * @param {function} onSuccess The function to call after the operation
 *      finishes. That function should take a single parameter for an Array of
 *      Array that will be a modified copy of the original dataset.
 * @param {function} onError An optional parameter for a function to call if
 *      an error is encountered during the refinement operation. This function
 *      should take a single String argument that describes the error
 *      encountered. If this parameter is not provided, an Error will be thrown
 *      if an error is encountered.
**/
exports.refine = function(operation, targetRows, onSuccess, onError)
{
    if(onError === undefined)
        onError = util.genericErrorHandler;
    
    var operations;
    if(!(operation instanceof Array)) {
        operations = [operation];
    } else {
        operations = operation;
    }

    var executeOperationClosure = function (targetRows, operation, callback) {
        var innerOnError = function (err) { 
            callback(err, null);
        };
        
        var innerOnSuccess = function(newTargetRows) {
            callback(null, newTargetRows);
        };
        
        executeOperation(operation, targetRows, innerOnSuccess, innerOnError);
    };

    async.reduce(
        operations,
        targetRows,
        executeOperationClosure,
        function (error, newTargetRows) {
            if(error)
                onError(error);
            else
                onSuccess(newTargetRows);
        }
    );
}
