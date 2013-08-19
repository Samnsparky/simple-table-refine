/**
 * Logic for removing columns out based on index or value.
 *
 * @author Sam Pottinger (samnsparky, http://gleap.org)
 * @license MIT
**/

var refine_util = require('./refine_util');


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
        var numRows = targetRows.length;
        for (var rowIndex=0; rowIndex<numRows; rowIndex++) {
            var targetRow = targetRows[rowIndex];
            var numCols = targetRow.length;
            for (var colIndex=0; colIndex<numCols; colIndex++) {
                if (targetRow[colIndex] === currentRule.val)
                    matchedCols.push(colIndex);
            }
        }
    }

    // Check all rules.
    var numRules = valueIndexIgnoreRules.length;
    for(var ruleIndex=0; ruleIndex<numRules; ruleIndex++)
    {
        var currentRule = valueIndexIgnoreRules[ruleIndex];
        var rowIndices = refine_util.prepareListOfIndices(currentRule.row);

        // Either check all rows or check user specified set of rows.
        if (rowIndices === refine_util.ANY_OPT) {
            checkRows(currentRule, targetRows);
        } else {
            var numRows = targetRows.length;
            rowIndices = rowIndices.filter(function (i) {
                return i < numRows;
            });

            // Find the rows that match the user's selection options.
            var ruleRows = rowIndices.map(function (i) {
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
 * @param {Array} rules An Array of Object describing rules, either index or
 *      rule with a row (integer) and a val attribute representing the row to
 *      look for the value in respectively.
 * @param {Array} targetRows Array of Array (dataset, table, 2D array) to find
 *      the columns in.
 * @return {Array} An Array of integer indices, each an index of a column that
 *      satisfied all of the provided rules.
**/
function findColsByCombinedVals(rules, targetRows)
{
    var matchedCols = [];
    var allowedColsToMatch = [];
    var numCols = refine_util.findMaxNumCols(targetRows);

    // Check a set of rows for columns that contain all of a set of values,
    // reporting matched columns by adding them to the matchedCols Array.
    var checkRows = function (targetRows, subRule, colIndex) {
        var numRows = targetRows.length;
        for(var rowIndex=0; rowIndex<numRows; rowIndex++) {
            var targetRow = targetRows[rowIndex];
            if (targetRow.length > colIndex) {
                if(targetRow[colIndex] === subRule.val)
                    return true;
            }
        }

        return false;
    };

    var valueSearchRules = rules.filter(function (rule) {
        return rule.val !== undefined;
    });

    var runValueSearchRules = function(colIndex)
    {
        var matched = true;
        
        var numSubRules = valueSearchRules.length;
        for(var i=0; i<numSubRules; i++) {
            var subRule = valueSearchRules[i];

            // Go through each component of the current rule to check for a
            // match.
            var rowIndices = refine_util.prepareListOfIndices(subRule.row);

            // Only use columns specified by user spec
            if (rowIndices === refine_util.ANY_OPT) {
                if(!checkRows(targetRows, subRule, colIndex))
                    matched = false;
            } else {
                // Find the rows that match the user's selection options.
                var ruleRows = rowIndices.map(function (i) {
                    return targetRows[i];
                });

                var targetRow = targetRows[subRule.row];
                if(!checkRows(ruleRows, subRule, colIndex))
                    matched = false;
            }
        }

        if (matched)
            matchedCols.push(colIndex);
    };

    // Determine if the user limited the columns the operation runs on.
    var indexRules = rules.filter(function (rule) {
        return rule.index !== undefined;
    });
    var colsToExamine = [];
    var numCols = targetRows[0].length;
    var indexChecker = refine_util.createKeepIndexChecker(indexRules);
    for (var i=0; i<numCols; i++) {
        if (!indexChecker(i)) {
            colsToExamine.push(i);
        }
    }
    var examineAllCols = colsToExamine.length == 0;

    // Go through all of the relevant columns in the dataset
    for (var colIndex=0; colIndex<numCols; colIndex++) {
        if (examineAllCols || colsToExamine.indexOf(colIndex) != -1) {
            runValueSearchRules(colIndex);
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
 * @param {Array} cols An Array of integer column indices to remove.
 * @return {Array} A copy of targetRows without the specified columns.
**/
function removeCols(targetRows, cols)
{
    return targetRows.map(function (row) {
        var newRow = [];

        var numRows = row.length;
        for (var i=0; i<numRows; i++) {
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
 *      {allOf: [{col: int, value: primitive}, ...]}.
 * @param {function} onSuccess The function to call after a copy of the dataset
 *      has been modified. This function should take a single parameter: the
 *      modified copy of the original dataset.
**/
exports.ignoreColIf = function(targetRows, params, onSuccess, onError)
{
    var colIndicesToIgnore = [];

    // Add list of column indices that the user specified to remove to the
    // actual list of column indices to remove.
    var colIndexIgnoreRules = params.filter(function (e) {
        return e.index !== undefined;
    });
    var indexChecker = refine_util.createKeepIndexChecker(colIndexIgnoreRules);
    var numCols = targetRows[0].length;
    for (var i=0; i<numCols; i++)
    {
        if (!indexChecker(i))
            colIndicesToIgnore.push(i);
    }

    // Search for columns to ignore / remove based on having one of many values.
    var valueIndexIgnoreRules = params.filter(function (e) {
        return e.val !== undefined;
    });
    colIndicesToIgnore.push.apply(
        colIndicesToIgnore,
        findColsByVal(valueIndexIgnoreRules, targetRows)
    );

    // Search for columns to ignore / remove based on having all of many values.
    var combineRules = params.filter(function (e) {
        return e.allOf !== undefined;
    });
    var numCombineRules = combineRules.length;
    for(var i=0; i<numCombineRules; i++)
    {
        colIndicesToIgnore.push.apply(
            colIndicesToIgnore,
            findColsByCombinedVals(combineRules[i].allOf, targetRows)
        );
    }

    // Parse any indices the user specified as a string.
    colIndicesToIgnore = colIndicesToIgnore.map(function (e) {
        return parseInt(e);
    });

    // Remove the columns at the specified indices.
    onSuccess(removeCols(targetRows, colIndicesToIgnore));
}