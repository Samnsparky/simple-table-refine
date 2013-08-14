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
exports.transpose = function (targetRows, params, onSuccess, onError)
{
    var numCols = findMaxNumCols(targetRows);
    var retVal = [];
    
    for(var i=0; i<numCols; i++)
        retVal.push([]);

    var numRows = targetRows.length;
    for(var rowIndex=0; rowIndex<numRows; rowIndex++) {
        var targetRow = targetRows[rowIndex];
        
        var numCols = targetRow.length;
        for(var colIndex=0; colIndex<numCols; colIndex++) {
            retVal[colIndex].push(targetRow[colIndex]);
        }
    }
    
    onSuccess(retVal);
}
