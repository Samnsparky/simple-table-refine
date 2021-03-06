simple-table-refine
===================
Node.js micro-library to refine, clean, transform, and sanitize tabular data (2D Array, Array of Array, etc).


Authors and License
-------------------
(c) 2013 [Sam Pottinger](http://gleap.org)
(c) 2013 [CU Language Project](http://psych.colorado.edu/~colungalab/CULanguage/CU-LANGUAGE.html) at the [University of Colorado, Boulder](http://colorado.edu/).
Released under the [MIT License](http://opensource.org/licenses/MIT).


Background and Motivation
-------------------------
Data refinement takes longer than it should and frequently involves something tabular. Moreover, sometimes cleaning just means removing some rows, replacing some values, and interpreting some strings as numbers, boolean values, or dates. This micro-library ensures that those simple tasks, operations frequently re-implemented by data / computer scientists for each project, remain simple and free of repeat work.


Installation
------------
```npm install simple-table-refine```


Quickstart
----------
```javascript
var simple_table_refine = require('simple-table-refine');

var testInput = [
    ['notTargetVal1', 'dont touch me', 'targetVal2'],
    ['targetVal1', 'throw this row out', 'targetVal2'],
    ['notTargetVal2', 'dont touch me either', 'notTargetVal3']
];

var expectedOutput = [
    ['notTargetVal1', 'dont touch me', 'targetVal2'],
    ['notTargetVal2', 'dont touch me either', 'notTargetVal3']
];

var testOperation = {
    operation: 'ignoreRowIf',
    param: [
        {combined: [
            {col:0, val: 'targetVal1'},
            {col:2, val: 'targetVal2'}
        ]}
    ]
};

// Handle errors with throw new Error
simple_table_refine.refine(
    testOperation,
    testInput,
    function (actualOutput) {
        console.log(actualOutput);
    }
);

// Handle errors with error handler
simple_table_refine.refine(
    testOperation,
    testInput,
    function (actualOutput) {
        console.log(actualOutput);
    },
    function (errDescription) {
        console.log(errDescription);
    },
);
```
  

API
---
###refine(operation, targetRows, onSuccess, onError)  
Execute a refinement operation on the given dataset.

*long description*: Perform a refinement operation on the given dataset (table, 2D Array, Array of Array, etc.). The provided operation should have an operation attribute (String) and param attribute (Object or Array depending on the value of the operation attribute). Operation can also accept an Array of Object and will execute each operation in the order emitted from that iterable.

*params*:

* {Object or Array} _operation_  
Description of the operation(s) to execute. Pass an Object for running a single operation or provide an Object Array for running many operations at once. Each Object should have a String attribute called "operation" describing the type of operation to execute as well as a "param" attribute that should be an Object or Array depending on the operation attribute. For available operations and corresponding params, see the operations section below.  

* {Array} _targetRows_  
The Array of Array (dataset, table, 2D array) to operate on. A copy of this dataset will be made and this original dataset will not be modified.  

* {function} _onSuccess_  
The function to call after the operation finishes. That function should take a single parameter for an Array of Array that will be a modified copy of the original dataset.  

* {function} _onError_  
An optional parameter for a function to call if an error is encountered during the refinement operation. This function should take a single String argument that describes the error encountered. If this parameter is not provided, an Error will be thrown if an error is encountered.
  

Available refinement / cleaning operations
------------------------------------------

###ignoreRowIf   
Removes a row from the tabular data source if it meets the criteria provided in params.

*param*: An array of the following:

* { index: _row index(ices) to remove_ }  
Remove the nth row. The first row is the 0th row.The value for index (_row index to remove_) can also be an Array of indices to remove instead of a single Number.  

* { col: _column index(ices) to look in for this value_, val: _val to look for_ }  
Remove rows that have the given value at the given column. Will look for this value in all columns if no column is specified or if 'any' is passed. The value for col (_column to look in for this value_) can be also be an Array of row indices to examine instead of a single Number.  

* { allOf: [ _rules_ ] }  
Remove rows that meet all of the provided rules where rules is a collection of the types of rules preceding this one. If an index rule is provided in the provided Array, only rows of that index will be considered for removal.

The row will be removed if any of these rules are satisfied.


###ignoreColIf   
Removes a column from the tabular data source if it meets the criteria provided in params.

*param*: An array of the following:

* { index: _column index(ices) to remove_ }  
Remove the nth column. The first column is the 0th row. The value for index (_column index to remove_) can also be an Array of indices to remove instead of a single Number.  

* { row: _row index(ices) to look in for this value_, val: _val to look for_ }  
Remove columns that have the given value at the given row. Will look for this value in all rows if no row is specified or if 'any' is passed. The value for row (_row to look in for this value_) can be also be an Array of row indices to examine instead of a single Number.  

* { allOf: [ _rules_ ] }  
Remove columns that meet all of the provided rules where rules is a collection of the types of rules preceding this one. If an index rule is provided in the provided Array, only columns of that index will be considered for removal.

The column will be removed if any of these rules are satisfied.


###replace   
Replaces the contents of a cell / element if it contains a certain value.

*param*: 

* { orig: _the value to look for_, new: _the value to insert instead_, row: _row index(ices) to look in for the orig value_, col: _column index(ices) to look in for the orig value_}  
The row and col attributes are optional and can accept an Array of Numbers or 'all' instead of a single Number. An Array of Numbers for row specifies which rows to look in for orig and an Array of Numbers for a col specifies which columns to look in for orig. Similarly, 'all' passed for row will have this library examine all rows and 'all' passed for col will have this library examine all columns.


###interpretStr   
Interprets the String (text) contents of cells / entities as a Number, Date, or Boolean value (true / false).

*param*: 

* { numbers: _true to convert Strings to numbers_, bools: {falseVal: _value to convert to false_, trueVal: _value to convert to true_ }, dates: _date parse string_, row: _row index(ices) to interpret_, col: _column index(ices) to interpret_ }  
All attributes are optional. If the numbers, bools, and / or dates attributes are not present, the library will not convert Strings to numbers, bools, and dates respectively. If bools is provided, the value for the attribute must have a falseVal attribute (the value to convert to false) and trueVal attribute (the value to convert to true). Likewise, the value for the dates attribute should be a [moment-compatible date format String](http://momentjs.com/). The row and column attributes can be a single Number, Array of Numbers, 'all' as a String, or undefined (which defaults to the same behavior as passing 'all'). A single number will have the library examine only a row or column of that index, an Array will have the library only interpret strings in the set of rows / columns of that indices, and 'all' / undefined will have the library examine all rows / columns.


###transpose   
 Runs a matrix transpose operation. This operation does not take any parameters (no value should be provided for param).
  

Status of the project
---------------------
Existing features are tested and the interfaces to them will remain the same through the 0.* releases. However, this micro-library remains under active development. Have an idea of something you want to see? Open an issue on the GitHub repository issue tracker.


Development Environment and Standards
-------------------------------------
This project maintains 80% code coverage and conforms to Google's JavaScript Style Guidelines. All inline documentation should follow the jsDoc standard.


Testing
-------
```nodeunit simple_table_refine_test.js```

You may need to install [nodeunit](https://github.com/caolan/nodeunit first).


Technologies and Resources Used
--------------------------------
* [async](https://github.com/caolan/async)
* [Moment.js](http://momentjs.com/)
* [nodeunit](https://github.com/caolan/nodeunit)

Basically [caolan](http://caolanmcmahon.com/) is awesome.
