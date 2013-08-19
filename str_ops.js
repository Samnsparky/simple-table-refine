var moment = require('moment');

var refine_util = require('./refine_util');


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
exports.replace = function(targetRows, params, onSuccess, onError)
{
    // Generate functions to replace certain strings with others.
    var replaceFuncs = params.map(function (rule) {
        
        var rows = refine_util.prepareListOfIndices(rule.row);
        var cols = refine_util.prepareListOfIndices(rule.col);
        
        return function (target, rowIndex, colIndex) {
            if(rows !== refine_util.ANY_OPT && rows.indexOf(rowIndex) == -1)
                return target;

            if(cols !== refine_util.ANY_OPT && cols.indexOf(colIndex) == -1)
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

        var numReplaceFuncs = replaceFuncs.length;
        for(var funcIndex=0; funcIndex<numReplaceFuncs; funcIndex++)
        {
            target = replaceFuncs[funcIndex](target, rowIndex, colIndex);
        }

        return target;
    }

    // Run the replace functions on all rows.
    var retVal = [];
    var numRows = targetRows.length;
    for (var rowIndex=0; rowIndex<numRows; rowIndex++) {
        var targetRow = targetRows[rowIndex];
        var newRow = [];
        var numCols = targetRow.length;
        for (colIndex=0; colIndex < numCols; colIndex++) {
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
exports.interpretStr = function (targetRows, params, onSuccess, onError)
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
        interpretFuncs.push(function (cell) {
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
        var numInterpretFuncs = interpretFuncs.length;
        for(var i=0; i<numInterpretFuncs; i++) {
            value = interpretFuncs[i](value);
        }
        return value;
    };

    // Parse user options for which rows and columns to operate on.
    var rows = refine_util.prepareListOfIndices(params.row);
    var cols = refine_util.prepareListOfIndices(params.col);

    // Run the interpret function on all cells in table (elements in Array).
    var retVal = [];

    var numRows = targetRows.length;
    for (var rowIndex=0; rowIndex<numRows; rowIndex++) {
        var targetRow = targetRows[rowIndex];
        if (rows === refine_util.ANY_OPT || rows.indexOf(rowIndex) != -1) {
            var newRow = [];
            var numCols = targetRow.length;
            for (var colIndex=0; colIndex<numCols; colIndex++) {
                var targetVal = targetRow[colIndex];
                if (cols===refine_util.ANY_OPT || cols.indexOf(colIndex)!=-1) {
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