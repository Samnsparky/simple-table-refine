var util = require('./util');


/**
 * Generate functions that determine if a row should be filtered by value.
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
    var shouldKeepValueFuncs = ignoreValueRules.map(function (rule) {
        var targetCol = rule.col;
        var targetVal = rule.val;

        var targetCols = util.prepareListOfIndices(targetCol);

        if (targetCols === util.ANY_OPT) {
            return function (row, rowIndex) {
                var numColumns = row.length;
                for (var column=0; column<numColumns; column++) {
                    if (row[column] === targetVal)
                        return false;
                }
                return true;
            };
        } else {
            return function(row,  rowIndex) {
                var numColumns = targetCols.length;
                for (var i=0; i<numColumns; i++) {
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


function createRowKeepFunc(rules, combinedWithAnd)
{
    var shouldKeepIndex = util.createKeepIndexChecker(rules);
    var hasIgnoreRules = shouldKeepIndex !== null;

    // Create rules to ignore rows containing any one of many values.
    var ignoreValueRules = rules.filter(function (e) {
        return e.val !== undefined;
    });
    var shouldKeepValueFuncs = createKeepRowValFuncs(ignoreValueRules);

    // Create rules to ignore rows containing all of many values.
    var ignoreCombinedValueRules = rules.filter(function (e) {
        return e.allOf !== undefined;
    });
    var shouldKeepCombinedFuncs = ignoreCombinedValueRules.map(function (rules){
        return createRowKeepFunc(rules.allOf, false);
    });

    // Prepare a function that runs all of the above rules.
    var shouldKeepFuncs = []
    shouldKeepFuncs.push.apply(shouldKeepFuncs, shouldKeepValueFuncs);
    shouldKeepFuncs.push.apply(shouldKeepFuncs, shouldKeepCombinedFuncs);

    var shouldKeepFunc;
    var numShouldKeepFuncs = shouldKeepFuncs.length;
    if (!hasIgnoreRules) {
        shouldKeepFunc = function(row, rowIndex)
        {
            var ruleCombiner = new util.RuleCombiner(combinedWithAnd);

            for (var i=0; i<numShouldKeepFuncs; i++) {
                var targetFunc = shouldKeepFuncs[i];
                ruleCombiner.reportShouldKeep(targetFunc(row, rowIndex));
            }

            return ruleCombiner.shouldKeep();
        };
    } else if (hasIgnoreRules && shouldKeepFuncs.length == 0) {
        shouldKeepFunc = function(row, rowIndex)
        {
            return shouldKeepIndex(rowIndex);
        };
    } else {
        shouldKeepFunc = function(row, rowIndex)
        {
            var ruleCombiner = new util.RuleCombiner(combinedWithAnd);

            ruleCombiner.reportShouldKeep(shouldKeepIndex(rowIndex));
            for (var i=0; i<numShouldKeepFuncs; i++) {
                var targetFunc = shouldKeepFuncs[i];
                ruleCombiner.reportShouldKeep(targetFunc(row, rowIndex));
            }

            return ruleCombiner.shouldKeep();
        };
    }

    return shouldKeepFunc;
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
exports.ignoreRowIf = function (targetRows, params, onSuccess, onError)
{
    var shouldKeepFunc = createRowKeepFunc(params, true);

    console.log('??????????');

    // Run the rules and create the modified version of the dataset.
    var retVal = [];

    var numRows = targetRows.length;
    for (var rowIndex=0; rowIndex<numRows; rowIndex++) {
        var targetRow = targetRows[rowIndex];
        if (shouldKeepFunc(targetRow, rowIndex))
            retVal.push(targetRow);
    }

    onSuccess(retVal);
}
