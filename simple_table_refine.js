/**
 * Utility providing very simple refinement / cleaning for 2D Arrays.
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

var ANY_OPT = 'any';

// Index of available refinement strategies
var refineStrategies = {
    ignoreRowIf: ignoreRowIf,
    ignoreColIf: ignoreColIf,
    replace: replace,
    interpretStr: interpretStr,
    transpose: transpose
};


/**
 * Fully qualify a user preference for which columns or rows to operate on.
 *
 * Turn a user input into a preference for which columns or rows to operate on,
 * making a single value into an Array of one element, defaulting an undefined
 * entry to the any row or column option, and leaving arrays and the ANY_OPT
 * string alone alone.
 *
 * @param {Object} input The user provided input. May be a String, Number,
 *      Array, or undefined.
 * @return {Array} The fully qualified version of the user's input.
**/
function prepareListOfIndicies(input)
{
    if(input === undefined || input === ANY_OPT)
        return ANY_OPT;
    else if(input instanceof Array)
        return input;
    else
        return [input];
}


/**
 * Generic error handler used if no error handler is provided by client code.
 *
 * Generic error handler that simply raises an actual Error when called. This
 * handler should be used if no handler is provided by client code.
 *
 * @param {String} err The description of the error encountered.
 * @throws Raises a generic Error with the given err string description.
**/
function genericErrorHandler(err)
{
    throw new Error(err);
}


/**
 * Find the maximum number of columns across a set of rows.
 *
 * @param {Array} targetRows An Array of Array rows, the corpus to look through
 *      for the maximum cardinality.
 * @return {Number} Integer number of elements in the sub-Array with the
 *      greatest number of elements within the provided corpus.
**/
function findMaxNumCols(targetRows)
{
    var numCols = targetRows.map(function(e){return e.length;});
    return Math.max.apply(null, numCols);
}


/**
 * Generate functions that determine if a row should be filtered.
 *
 * Generate functions from rule specifications that determine if a row has
 * certain values. When these rules are satisfied, the returned functions return
 * false and return true otherwise. This should be interpreted as true meaning
 * the row should be kept and false if the row should be removed.
 *
 * @param {Array} ignoreValueRules An Array of Object with rule information.
 *      Each object should have a col attribute (integer, column index to find
 *      the target value in) and val (primitive, the value to look for).
 * @return {Array} An Array of functions returning true or false.
**/
function createKeepRowValFuncs(ignoreValueRules)
{
    var shouldKeepValueFuncs = ignoreValueRules.map(function(rule){
        var targetCol = rule.col;
        var targetVal = rule.val;

        var targetCols = prepareListOfIndicies(targetCol);

        if (targetCols === ANY_OPT) {
            return function (row) {
                for (var column in row) {
                    if (row[column] === targetVal)
                        return false;
                }
                return true;
            };
        }
        else
        {
            return function(row){
                for (var i in targetCols) {
                    var currentCol = targetCols[i];
                    var hasCol = row.length > currentCol;
                    if (hasCol && row[currentCol] === targetVal)
                        return false;
                }
                return true;
            };
        }
    });
    return shouldKeepValueFuncs;
}


/**
 * Remove a row from the target dataset if one of the given rules are fulfilled.
 *
 * Remove a row from the target dataset (table, 2D array) if one of the given
 * rules is fulfilled.
 *
 * @param {Array} targetRows The 2D array (table, dataset, Array of Array of
 *      Object) to operate on.
 * @param {Array} params The specifications to use when building the rules. Each
 *      should be of form {index: int}, {col: int, value: primitive}, or
 *      {combined: [{col: int, value: primitive}, ...]}.
 * @param {function} onSuccess The funciton to call after the rows have been
 *      filtered. Should take one parameter: a 2D Array (Array of Array of
 *      Object).
 * @param {function} onError The function to call if an error is enountered.
 *      Should take a single parameter (String) that describes the error
 *      encountered.
**/
function ignoreRowIf(targetRows, params, onSuccess, onError)
{
    // Create rules to ignore rows with a certain index.
    var ignoreRowRules = params.filter(function(e){
        return e.index !== undefined;
    });
    var ignoreRows = ignoreRowRules.map(function(e){
        return e.index;
    });
    var shouldKeepIndex = function(rowIndex){
        return ignoreRows.indexOf(parseInt(rowIndex, 10)) == -1;
    };

    // Create rules to ignore rows containing any one of many values.
    var ignoreValueRules = params.filter(function(e){
        return e.col !== undefined;
    });
    var shouldKeepValueFuncs = createKeepRowValFuncs(ignoreValueRules);

    // Create rules to ignore rows containing all of many values.
    var ignoreCombinedValueRules = params.filter(function(e){
        return e.combined !== undefined;
    });
    var shouldKeepCombinedFuncs = ignoreCombinedValueRules.map(function(rules){
        var funcs = createKeepRowValFuncs(rules.combined);
        return function(target){
            for (i in funcs) {
                if (funcs[i](target))
                    return true;
            }
            return false;
        };
    });

    // Prepare a function that runs all of the above rules.
    var shouldKeepFuncs = []
    shouldKeepFuncs.push.apply(shouldKeepFuncs, shouldKeepValueFuncs);
    shouldKeepFuncs.push.apply(shouldKeepFuncs, shouldKeepCombinedFuncs);
    var shouldKeepFunc = function(target)
    {
        for (var i in shouldKeepFuncs) {
            var targetFunc = shouldKeepFuncs[i];
            if (!targetFunc(target))
                return false;
        }

        return true;
    }

    // Run the rules and create the modified version of the dataset.
    var retVal = [];

    for (var rowIndex in targetRows) {
        var targetRow = targetRows[rowIndex];
        if (shouldKeepIndex(rowIndex) && shouldKeepFunc(targetRow))
            retVal.push(targetRow);
    }

    onSuccess(retVal);
}


/**
 * Find the columns that have given values in given rows.
 *
 * @param {Array} valueIndexIgnoreRules An Array of Object, each object with a
 *      row (integer) index and val attribute. A column will be reported if the
 *      value is found at that row.
 * @param {Array} targetRows The 2D Array (table, dataset, Array of Array of
 *      Object) to operate on.
 * @return {Array} The modified dataset (table, 2D Array, Array of Array of
 *      Object).
**/
function findColsByVal(valueIndexIgnoreRules, targetRows)
{
    var matchedCols = [];

    // Funtion to check a set of rows, looking for values in each column and
    // reporting columns that match, adding them to matchedCols.
    var checkRows = function(currentRule, targetRows)
    {
        for (var rowIndex in targetRows) {
            var targetRow = targetRows[rowIndex];
            for (var colIndex in targetRow) {
                if (targetRow[colIndex] === currentRule.val)
                    matchedCols.push(colIndex);
            }
        }
    }

    // Check all rules.
    for(var ruleIndex in valueIndexIgnoreRules)
    {
        var currentRule = valueIndexIgnoreRules[ruleIndex];
        var rowIndicies = prepareListOfIndicies(currentRule.row);

        // Either check all rows or check user specified set of rows.
        if (rowIndicies === ANY_OPT) {
            checkRows(currentRule, targetRows);
        } else {
            var numRows = targetRows.length;
            rowIndicies = rowIndicies.filter(function(i){
                return i < numRows;
            });

            // Find the rows that match the user's selection options.
            var ruleRows = rowIndicies.map(function(i){
                return targetRows[i];
            });
            checkRows(currentRule, ruleRows);
        }
    }

    return matchedCols;
}


/**
 * Find the columns that have the given set of values in the given set of rows.
 *
 * Find the columns that satisfy all of the rules in a set of rules, each
 * checking for a value in a specified row.
 *
 * @param {Array} valueIndexIgnoreRules An Array of Object describing rules,
 *      each witha a row (integer) and a val attribute representing the row to
 *      look for the value in respectively.
 * @param {Array} targetRows Array of Array (dataset, table, 2D array) to find
 *      the columns in.
 * @return {Array} An Array of integer indicies, each an index of a column that
 *      satisfied all of the provided rules.
**/
function findColsByCombinedVals(valueIndexIgnoreRules, targetRows)
{
    var matchedCols = [];
    var numCols = findMaxNumCols(targetRows);

    // Check a set of rows for columns that contain all of a set of values,
    // reporting matched columns by adding them to the matchedCols Array.
    var checkRows = function (targetRows, subRule, colIndex) {
        for(var rowIndex in targetRows) {
            var targetRow = targetRows[rowIndex];
            if (targetRow.length > colIndex) {
                if(targetRow[colIndex] === subRule.val)
                    return true;
            }
        }

        return false;
    };

    // Go through all rules
    for(var ruleIndex in valueIndexIgnoreRules)
    {
        var currentRule = valueIndexIgnoreRules[ruleIndex];

        // Go through all of the columns in the dataset
        for(var colIndex=0; colIndex<numCols; colIndex++)
        {
            var matched = true;
            
            // Go through each component of the current rule to check for a
            // match.
            for (var subRuleIndex in currentRule.combined) {
                var subRule = currentRule.combined[subRuleIndex];
                var rowIndicies = prepareListOfIndicies(subRule.row);

                // Only use columns specified by user spec
                if (rowIndicies === ANY_OPT) {
                    if(!checkRows(targetRows, subRule, colIndex))
                        matched = false;
                } else {
                    // Find the rows that match the user's selection options.
                    var ruleRows = rowIndicies.map(function(i){
                        return targetRows[i];
                    });

                    var targetRow = targetRows[subRule.row];
                    if(!checkRows(ruleRows, subRule, colIndex))
                        matched = false;
                }
            }
            
            if (matched)
                matchedCols.push(colIndex);
        }
    }

    return matchedCols;
}


/**
 * Remove the specified columns from the provided table of values.
 *
 * Remove the nth element from each row where n is equal to each index in cols,
 * returning a copy of the provided set of rows (dataset, table, 2D array)
 * without those values. The original dataset will be left unchanged.
 *
 * @param {Array} targetRows The Array of Array of Object to operate on.
 * @param {Array} cols An Array of integer column indicies to remove.
 * @return {Array} A copy of targetRows without the specified columns.
**/
function removeCols(targetRows, cols)
{
    return targetRows.map(function(row){
        var newRow = [];

        for (var i in row) {
            if (cols.indexOf(parseInt(i, 10)) === -1) {
                newRow.push(row[i]);
            }
        }

        return newRow;
    });
}


/**
 * Remove columns from the given table of values if they satisfy certain rules.
 *
 * Remove columns from a provided dataset (2D Array, Array of Array, table) if
 * that satisfy a certain set of rules. The resulting dataset (the original
 * dataset will be left unchanged) will have the nth elements removed where n
 * is the index of each column that satisfied the provided rules.
 *
 * @param {Array} targetRows The dataset (2D Array, Array of Array, table) to
 *      look for matching columns in and remove matching columns from. This
 *      original dataset will not be modified.
 * @param {Array} params The specifications to build the rules from. Each
 *      element should of form {index: int}, {col: int, value: primitive}, or
 *      {combined: [{col: int, value: primitive}, ...]}.
 * @param {function} onSuccess The function to call after a copy of the dataset
 *      has been modified. This function should take a single parameter: the
 *      modified copy of the original dataset.
**/
function ignoreColIf(targetRows, params, onSuccess, onError)
{
    var colIndiciesToIgnore = [];

    // Add list of column indicies that the user specified to remove to the
    // actual list of column indicies to remove.
    var colIndexIgnoreRules = params.filter(function(e){
        return e.index !== undefined;
    });
    var indiciesExplicitlyIgnored = colIndexIgnoreRules.map(function(e){
        return e.index;
    });
    colIndiciesToIgnore.push.apply(
        colIndiciesToIgnore,
        indiciesExplicitlyIgnored
    );

    // Search for columns to ignore / remove based on having one of many values.
    var valueIndexIgnoreRules = params.filter(function(e){
        return e.row !== undefined;
    });
    colIndiciesToIgnore.push.apply(
        colIndiciesToIgnore,
        findColsByVal(valueIndexIgnoreRules, targetRows)
    );

    // Search for columns to ignore / remove based on having all of many values.
    var valueCombinedIgnoreRules = params.filter(function(e){
        return e.combined !== undefined;
    });
    colIndiciesToIgnore.push.apply(
        colIndiciesToIgnore,
        findColsByCombinedVals(valueCombinedIgnoreRules, targetRows)
    );

    // Parse any indicies the user specified as a string.
    colIndiciesToIgnore = colIndiciesToIgnore.map(function(e){
        return parseInt(e);
    });

    // Remove the columns at the specified indicies.
    onSuccess(removeCols(targetRows, colIndiciesToIgnore));
}


/**
 * Runs a find / replace operation on the provided dataset.
 *
 * Searches for a set of strings and replaces that set of strings with a
 * cooresponding set of strings. The replace will only be executed if the entire
 * string be searched for is found and that the string being searched for is
 * of the same length of the string the replace is being executed in.
 *
 * @param {Array} targetRows The dataset (Array of Array, 2D Array, and table)
 *      to search through for the target strings.
 * @param {Array} params Array of Object with information about the strings to
 *      find and the strings to replace them with. Each Object should have an
 *      orig and new attribute, each a string. The former is the string to
 *      search for and the later is the string to replace it with.
**/
function replace(targetRows, params, onSuccess, onError)
{
    // Generate functions to replace certain strings with others.
    var replaceFuncs = params.map(function(rule){
        
        var rows = prepareListOfIndicies(rule.row);
        var cols = prepareListOfIndicies(rule.col);
        
        return function (target, rowIndex, colIndex) {
            if(rows !== ANY_OPT && rows.indexOf(rowIndex) == -1)
                return target;

            if(cols !== ANY_OPT && cols.indexOf(colIndex) == -1)
                return target;

            if(rule.orig === target)
                return target.replace(rule.orig, rule.new);
            else
                return target;
        };
    });

    // Combine all of those replace functions into a single high level function.
    var runReplaceFuncs = function(target, rowIndex, colIndex)
    {
        // TODO: Unclear why this is necessary.
        rowIndex = parseInt(rowIndex);
        colIndex = parseInt(colIndex);

        for(var funcIndex in replaceFuncs)
        {
            target = replaceFuncs[funcIndex](target, rowIndex, colIndex);
        }

        return target;
    }

    // Run the replace functions on all rows.
    var retVal = [];
    for (var rowIndex in targetRows) {
        var targetRow = targetRows[rowIndex];
        var newRow = [];
        for (var colIndex in targetRow) {
            var targetVal = targetRow[colIndex];
            targetVal = runReplaceFuncs(targetVal, rowIndex, colIndex);
            newRow.push(targetVal);
        }
        retVal.push(newRow);
    }
    onSuccess(retVal);
}


/**
 * Interpet string serialized versions of dates, boolean values, and numbers.
 *
 * Convert string serializations of dates, boolean values, and numbers to
 * ISO 8601 standard strings, boolean primitive type values, and number
 * primitive type values respectively.
 *
 * @param {Array} targetRows The Array of Array of Object to convert values in.
 *      In other words, the dataset (table, 2D Array) to operate on. This value
 *      will remain unchanged.
 * @param {Array} params An Object with optional attributes dates, bools, and
 *      numbers. If the dates, bools, and / or numbers attribute(s) is not
 *      present that type will not be interpreted. The dates attribute should
 *      have a string value containing a format string for use in interpreting
 *      date strings through the moment library. The bools attribute should have
 *      an object with attributes trueVal and falseVal, the string values to
 *      convert to true and false respectively. Finally, the numbers attribute
 *      should be true.
**/
function interpretStr(targetRows, params, onSuccess, onError)
{
    var interpretFuncs = [];

    // Add function to parse dates if date options are specified.
    if (params.dates !== undefined) {
        interpretFuncs.push(function (cell, rowIndex, colIndex) {
            var newDate = moment(cell, params.dates);
            if (newDate.isValid())
                return newDate.toISOString();
            else
                return cell;
        });
    }

    // Add function to parse boolean values if boolean options are specified.
    if (params.bools) {
        interpretFuncs.push(function(cell){
            if(cell === params.bools.falseVal)
                return false;
            else if(cell === params.bools.trueVal)
                return true;
            else
                return cell;
        });
    }

    // Add function to parse numbers if number parsing options are specified.
    if (params.numbers) {
        interpretFuncs.push(function (cell) {
            var possibleInt = parseInt(cell);
            if(possibleInt.toString() === cell)
                return possibleInt;

            var possibleFloat = parseFloat(cell);
            if(possibleFloat.toString() === cell)
                return possibleFloat;

            return cell;
        });
    }

    // Combine all interpret functions into a single high-level interpret
    // function.
    var interpretValue = function (value) {
        for(var i in interpretFuncs) {
            value = interpretFuncs[i](value);
        }
        return value;
    };

    // Parse user options for which rows and columns to operate on.
    var rows = prepareListOfIndicies(params.row);
    var cols = prepareListOfIndicies(params.col);

    // Run the interpret function on all cells in table (elements in Array).
    var retVal = [];

    for (var rowIndex in targetRows) {
        var targetRow = targetRows[rowIndex];
        if (rows === ANY_OPT || rows.indexOf(rowIndex) != -1) {
            var newRow = [];
            for (var colIndex in targetRow) {
                var targetVal = targetRow[colIndex];
                if (cols === ANY_OPT || cols.indexOf(colIndex) != -1) {
                    targetVal = interpretValue(targetVal);
                    newRow.push(targetVal);
                } else {
                    newRow.push(targetVal);
                }
            }
            retVal.push(newRow);
        } else {
            retVal.push(targetRow.slice());
        }
    }

    onSuccess(retVal);
}


/**
 * Transpose a 2D array.
 *
 * Switch the rows and columns in a given dataset (2D Array, table, Array of
 * Array). Leaves the original dataset untouched and returns a modified copy.
 *
 * @param {Array} targetRows The Array of Array (2D Array, table, dataset) to
 *      operate on. A copy of this dataset will be created and modified but this
 *      original dataset will be left untouched.
 * @param {function} onSuccess The function to call after the transposition of a
 *      copy of the original dataset is complete. Should take a single
 *      parameter: an Array of Array that is the modified dataset.
 * @param {function} onError The function to call if an error is encountered.
 *      Should take a single string parameter describing the error encountered.
**/
function transpose(targetRows, params, onSuccess, onError)
{
    var numCols = findMaxNumCols(targetRows);
    var retVal = [];
    
    for(var i=0; i<numCols; i++)
        retVal.push([]);

    for(var rowIndex in targetRows) {
        var targetRow = targetRows[rowIndex];
        
        for(colIndex in targetRow) {
            retVal[colIndex].push(targetRow[colIndex]);
        }
    }
    
    onSuccess(retVal);
}


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
        onError = genericErrorHandler;
    
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
