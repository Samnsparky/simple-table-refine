var ANY_OPT = 'any';

var equalityStrategies = {
    '==': function(value){ return function(op) { return op == value}; },
    '> ': function(value){ return function(op) { return op > value}; },
    '>=': function(value){ return function(op) { return op >= value}; },
    '< ': function(value){ return function(op) { return op < value}; },
    '<=': function(value){ return function(op) { return op <= value}; },
    '!=': function(value){ return function(op) { return op != value}; }
};


exports.createEqualityEvaluator = function(inequality)
{
    var operator = inequality.substr(0, 2);
    var value = Number(inequality.substr(2));

    return equalityStrategies[operator](value);
};


exports.RuleCombiner = function(combineWithAnd)
{
    this.clauseResults = [];

    this.reportShouldKeep = function (clauseResult)
    {
        this.clauseResults.push(clauseResult);
    }

    this.shouldKeep = function ()
    {
        if (combineWithAnd) {
            // Indicate that the row should not be kept if any clause passed
            return this.clauseResults.indexOf(false) == -1;
        } else {
            // Indiciate that the row should not be kept if all clauses failed
            var allClausesFailed = this.clauseResults.indexOf(true) == -1;
            return !allClausesFailed;
        }
    };
};


/**
 * Generic error handler used if no error handler is provided by client code.
 *
 * Generic error handler that simply raises an actual Error when called. This
 * handler should be used if no handler is provided by client code.
 *
 * @param {String} err The description of the error encountered.
 * @throws Raises a generic Error with the given err string description.
**/
exports.genericErrorHandler = function(err)
{
    throw new Error(err);
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
exports.prepareListOfIndices = function(input)
{
    if(input === undefined || input === ANY_OPT)
        return ANY_OPT;
    else if(input instanceof Array)
        return input;
    else
        return [input];
};


/**
 * Find the maximum number of columns across a set of rows.
 *
 * @param {Array} targetRows An Array of Array rows, the corpus to look through
 *      for the maximum cardinality.
 * @return {Number} Integer number of elements in the sub-Array with the
 *      greatest number of elements within the provided corpus.
**/
exports.findMaxNumCols = function(targetRows)
{
    var numCols = targetRows.map(function (e) {return e.length;});
    return Math.max.apply(null, numCols);
}


exports.createKeepIndexChecker = function(rules)
{
    // Create rules to ignore rows with a certain index.
    var ignoreRowRules = rules.filter(function (e) {
        return e.index !== undefined;
    });
    var ignoreRows = [];
    var ignoreRowEvaluators = [];
    var ignoreRowsByRule = ignoreRowRules.map(function (e) {
        var index = e.index;
        if (index instanceof Array) {
            ignoreRows.push.apply(ignoreRows, e.index);
        } else if (index instanceof String || typeof index === 'string') {
            ignoreRowEvaluators.push(createEqualityEvaluator(e.index))
        } else {
            return ignoreRows.push(e.index);
        }
    });

    if (ignoreRowRules.length == 0){
        return null;
    } else {
        return function (rowIndex) {
            rowIndex = parseInt(rowIndex, 10);
            var ignoreByIndex = ignoreRows.indexOf(rowIndex) != -1;
            
            var passesEqualityTests = true;
            var numEvaluators = ignoreRowEvaluators.length;
            for(var i=0; i<numEvaluators; i++)
            {
                if(!ignoreRowEvaluators[i](rowIndex))
                    passesEqualityTests = false;
            }

            return !ignoreByIndex && (numEvaluators==0 || !passesEqualityTests);
        };
    }
}
