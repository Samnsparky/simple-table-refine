/**
 * Unit tests for the simple-table-refine tabular data refinement micro-library.
 *
 * @author A. Samuel Pottinger (samnsparky, Gleap LLC and CU Boulder)
 * @license MIT
**/

var simple_table_refine = require('./simple_table_refine');


/**
 * Test removing rows by their index.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testIgnoreRowIfIndex = function(test)
{
    var testInput = [
        ['notTargetVal1', 'dont touch me'],
        ['targetVal', 'throw this row out'],
        ['notTargetVal2', 'dont touch me either']
    ];
    var expectedOutput = [
        ['notTargetVal1', 'dont touch me'],
        ['notTargetVal2', 'dont touch me either']
    ];
    var testOperation = {
        operation: 'ignoreRowIf',
        param: [
            {'index':1}
        ]
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test removing rows by testing for given values in given cols joined by AND.
 *
 * Test removing rows by testing for given values in given cols given a set of
 * rules, all of which must be fulfilled before the column is removed.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testIgnoreRowIfVal = function(test)
{
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
            {'combined': [
                {'col':0, 'val': 'targetVal1'},
                {'col':2, 'val': 'targetVal2'}
            ]}
        ]
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};



/**
 * Test removing rows by testing for given values in given cols joined by AND.
 *
 * Test removing rows by testing for given values in given cols given a set of
 * rules, all of which must be fulfilled before the column is removed. Some
 * column selections will take more than one column.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testIgnoreRowIfValManyCols = function(test)
{
    var testInput = [
        ['notTargetVal1', 'dont touch me', 'targetVal2'],
        ['targetVal1', 'throw this row out', 'targetVal2'],
        ['notTargetVal2', 'targetVal1', 'targetVal2']
    ];
    var expectedOutput = [
        ['notTargetVal1', 'dont touch me', 'targetVal2']
    ];
    var testOperation = {
        operation: 'ignoreRowIf',
        param: [
            {'combined': [
                {'col':[0,1], 'val': 'targetVal1'},
                {'col':2, 'val': 'targetVal2'}
            ]}
        ]
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test removing rows by testing for given values in any column.
 *
 * Test removing rows by testing for given values in given cols given a set of
 * rules, all of which must be fulfilled before the column is removed. For
 * at least one rule, this test uses the any value.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testIgnoreRowIfValAny = function(test)
{
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
            {'combined': [
                {'col': 'any', 'val': 'targetVal1'},
                {'col': 2, 'val': 'targetVal2'}
            ]}
        ]
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test removing rows by testing for given values in any column.
 *
 * Test removing rows by testing for given values in given cols given a set of
 * rules, all of which must be fulfilled before the column is removed. For
 * at least one rule, this test uses the any value by not specifying a column
 * value.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testIgnoreRowIfValAnyDefault = function(test)
{
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
            {'combined': [
                {'val': 'targetVal1'},
                {'col': 2, 'val': 'targetVal2'}
            ]}
        ]
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test removing rows by testing for given values in given cols joined by OR.
 *
 * Test removing rows by testing for given values in given cols given a set of
 * rules, only one of which must be fulfilled before the column is removed.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testIgnoreRowIfValLoose = function(test)
{
    var testInput = [
        ['notTargetVal1', 'throw this out!', 'targetVal2'],
        ['targetVal1', 'throw this row out', 'targetVal2'],
        ['notTargetVal2', 'dont touch me either', 'notTargetVal3']
    ];
    var expectedOutput = [
        ['notTargetVal2', 'dont touch me either', 'notTargetVal3']
    ];
    var testOperation = {
        operation: 'ignoreRowIf',
        param: [
            {'col':0, 'val': 'targetVal1'},
            {'col':2, 'val': 'targetVal2'}
        ]
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test removing rows by testing for given values in any column joined by OR.
 *
 * Test removing rows by testing for given values in given cols given a set of
 * rules, only one of which must be fulfilled before the column is removed. This
 * test has at least one rule with the any column option.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testIgnoreRowIfValLooseAny = function(test)
{
    var testInput = [
        ['notTargetVal1', 'throw this out!', 'targetVal2'],
        ['targetVal1', 'throw this row out', 'targetVal2'],
        ['notTargetVal2', 'dont touch me either', 'notTargetVal3']
    ];
    var expectedOutput = [
        ['notTargetVal2', 'dont touch me either', 'notTargetVal3']
    ];
    var testOperation = {
        operation: 'ignoreRowIf',
        param: [
            {'col':'any', 'val': 'targetVal1'},
            {'col':2, 'val': 'targetVal2'}
        ]
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test removing columns by their index.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testIgnoreColIfIndex = function(test)
{
    var testInput = [
        ['0', 'notTargetVal1', 'dont touch me'],
        ['1', 'targetVal', 'get rid of that column'],
        ['2', 'notTargetVal2', 'dont touch me either']
    ];
    var expectedOutput = [
        ['notTargetVal1', 'dont touch me'],
        ['targetVal', 'get rid of that column'],
        ['notTargetVal2', 'dont touch me either']
    ];
    var testOperation = {
        operation: 'ignoreColIf',
        param: [
            {'index':0}
        ]
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};

/**
 * Test removing cols by testing for given values in given rows joined by AND.
 *
 * Test removing colums by testing for given values in given rows given a set of
 * rules, all of which must be fulfilled before the column is removed.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testIgnoreColIfVal = function(test)
{
    var testInput = [
        ['0', 'notTargetVal1', 'dont touch me', '0'],
        ['1', 'targetVal', 'get rid of that row', '1'],
        ['2', 'notTargetVal2', 'dont touch me either', '3']
    ];
    var expectedOutput = [
        ['notTargetVal1', 'dont touch me', '0'],
        ['targetVal', 'get rid of that row', '1'],
        ['notTargetVal2', 'dont touch me either', '3']
    ];
    var testOperation = {
        operation: 'ignoreColIf',
        param: [
            {'combined': [
                {'row':1, 'val': '1'},
                {'row':2, 'val': '2'}
            ]}
        ]
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test removing cols by testing for given values in given rows joined by AND.
 *
 * Test removing colums by testing for given values in given rows given a set of
 * rules, all of which must be fulfilled before the column is removed. At least
 * one of the row selectors will contain more than one index.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testIgnoreColIfVals = function(test)
{
    var testInput = [
        ['0', 'notTargetVal1', 'dont touch me', '1'],
        ['1', 'targetVal', 'get rid of that row', '0'],
        ['2', 'notTargetVal2', 'dont touch me either', '2']
    ];
    var expectedOutput = [
        ['notTargetVal1', 'dont touch me'],
        ['targetVal', 'get rid of that row'],
        ['notTargetVal2', 'dont touch me either']
    ];
    var testOperation = {
        operation: 'ignoreColIf',
        param: [
            {'combined': [
                {'row':[0,1], 'val': '1'},
                {'row':2, 'val': '2'}
            ]}
        ]
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test removing cols by testing for given values in any row joined by AND.
 *
 * Test removing colums by testing for given values in given rows given a set of
 * rules, all of which must be fulfilled before the column is removed. At least
 * one test must use the any row option.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testIgnoreColIfValAny = function(test)
{
    var testInput = [
        ['0', 'notTargetVal1', 'dont touch me', '0'],
        ['1', 'targetVal', 'get rid of that row', '1'],
        ['2', 'notTargetVal2', 'dont touch me either', '3']
    ];
    var expectedOutput = [
        ['notTargetVal1', 'dont touch me', '0'],
        ['targetVal', 'get rid of that row', '1'],
        ['notTargetVal2', 'dont touch me either', '3']
    ];
    var testOperation = {
        operation: 'ignoreColIf',
        param: [
            {'combined': [
                {'row': 'any', 'val': '1'},
                {'row': 2, 'val': '2'}
            ]}
        ]
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test removing cols by testing for given values in given rows joined by OR.
 *
 * Test removing colums by testing for given values in given rows given a set of
 * rules, only one of which must be fulfilled before the column is removed.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testIgnoreColIfValLoose = function(test)
{
    var testInput = [
        ['0', 'notTargetVal1', 'dont touch me', '0'],
        ['1', 'targetVal', 'get rid of that column', '1'],
        ['2', 'notTargetVal2', 'dont touch me either', '3']
    ];
    var expectedOutput = [
        ['notTargetVal1', 'dont touch me'],
        ['targetVal', 'get rid of that column'],
        ['notTargetVal2', 'dont touch me either']
    ];
    var testOperation = {
        operation: 'ignoreColIf',
        param: [
            {'row':1, 'val': '1'},
            {'row':2, 'val': '2'}
        ]
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test removing cols by testing for given values in given rows joined by OR.
 *
 * Test removing colums by testing for given values in given rows given a set of
 * rules, only one of which must be fulfilled before the column is removed. At
 * least one of the row selectors will take more than one index.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testIgnoreColIfValsLoose = function(test)
{
    var testInput = [
        ['0', 'notTargetVal1', 'dont touch me', '0', '1'],
        ['1', 'targetVal', 'get rid of that column', '1', '0'],
        ['2', 'notTargetVal2', 'dont touch me either', '3', '2']
    ];
    var expectedOutput = [
        ['notTargetVal1', 'dont touch me'],
        ['targetVal', 'get rid of that column'],
        ['notTargetVal2', 'dont touch me either']
    ];
    var testOperation = {
        operation: 'ignoreColIf',
        param: [
            {'row':[0,1], 'val': '1'},
            {'row':2, 'val': '2'}
        ]
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test removing cols by testing for given values in any row joined by OR.
 *
 * Test removing colums by testing for given values in given rows given a set of
 * rules, only one of which must be fulfilled before the column is removed. At
 * least one of the rules will use the any row option.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testIgnoreColIfValLooseAny = function(test)
{
    var testInput = [
        ['0', 'notTargetVal1', 'dont touch me', '0'],
        ['1', 'targetVal', 'get rid of that column', '1'],
        ['2', 'notTargetVal2', 'dont touch me either', '3']
    ];
    var expectedOutput = [
        ['notTargetVal1', 'dont touch me'],
        ['targetVal', 'get rid of that column'],
        ['notTargetVal2', 'dont touch me either']
    ];
    var testOperation = {
        operation: 'ignoreColIf',
        param: [
            {'row':'any', 'val': '1'},
            {'row':2, 'val': '2'}
        ]
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test running a string find / replace across the dataset with specified cols.
 *
 * Test running a string find / replace using the any option for the row but not
 * the column.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testReplaceAnyRow = function(test)
{
    var testInput = [
        ['test1', 'ND', 'dont touch me'],
        ['test1', '', 'ND'],
        ['test1', 'ND', '']
    ];
    var expectedOutput = [
        ['test1', '1', 'dont touch me'],
        ['test1', '', 'ND'],
        ['test1', '1', '0']
    ];
    var testOperation = {
            operation: 'replace',
            param: [
                {'orig':'ND', 'new':'1', 'row':'any', 'col':1},
                {'orig':'', 'new':'0', 'row': 'any', 'col':2}
            ]
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test running a string find / replace across the dataset with specified cols.
 *
 * Test running a string find / replace using the any option for the row but not
 * the column. One column selector will have more than one index.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testReplaceAnyRowManyCols = function(test)
{
    var testInput = [
        ['test1', 'ND', 'dont touch me', 'ND'],
        ['test1', '', 'ND', 'ND'],
        ['test1', 'ND', '', 'ND']
    ];
    var expectedOutput = [
        ['test1', '1', 'dont touch me', 'ND'],
        ['test1', '', '1', 'ND'],
        ['test1', '1', '0', 'ND']
    ];
    var testOperation = {
            operation: 'replace',
            param: [
                {'orig':'ND', 'new':'1', 'row':'any', 'col':[1, 2]},
                {'orig':'', 'new':'0', 'row': 'any', 'col':2}
            ]
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test running a string find / replace across the dataset with specified rows.
 *
 * Test running a string find / replace using the any option for the column but
 * not the row.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testReplaceAnyCol = function(test)
{
    var testInput = [
        ['test1', 'ND', 'dont touch me'],
        ['test1', '', 'ND'],
        ['test1', 'ND', '']
    ];
    var expectedOutput = [
        ['test1', 'ND', 'dont touch me'],
        ['test1', '', '1'],
        ['test1', 'ND', '0']
    ];
    var testOperation = {
            operation: 'replace',
            param: [
                {'orig':'ND', 'new':'1', 'row':1, 'col':'any'},
                {'orig':'', 'new':'0', 'row':2, 'col':'any'}
            ]
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test running a string find / replace across the dataset with specified rows.
 *
 * Test running a string find / replace using the any option for the column but
 * not the row. At least one row selector will have more than one index.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testReplaceAnyColManyRows = function(test)
{
    var testInput = [
        ['test1', 'ND', 'dont touch me'],
        ['test1', '', 'ND'],
        ['test1', 'ND', '']
    ];
    var expectedOutput = [
        ['test1', '1', 'dont touch me'],
        ['test1', '', '1'],
        ['test1', 'ND', '0']
    ];
    var testOperation = {
            operation: 'replace',
            param: [
                {'orig':'ND', 'new':'1', 'row':[0,1], 'col':'any'},
                {'orig':'', 'new':'0', 'row':2, 'col':'any'}
            ]
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test transposing a dataset.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testTranspose = function(test)
{
    var testInput = [
        ['', 'a', 'b'],
        ['1', 'a1', 'b1'],
        ['2', 'a2', 'b2']
    ];
    var expectedOutput = [
        ['', '1', '2'],
        ['a', 'a1', 'a2'],
        ['b', 'b1', 'b2']
    ];
    var testOperation = {
        operation: 'transpose'
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test interpeting string serailization of boolean values.
 *
 * Test interpreting string seraialization of dataset boolean values, converting
 * them to the corresponding boolean values.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testInterpretStrBoolean = function(test)
{
    var testInput = [['Nope', 'N', 'Y', 'Yes']];
    var expectedOutput = [['Nope', false, true, 'Yes']];
    var testOperation = {
        operation: 'interpretStr',
        param: {
            'bools': {'falseVal': 'N', 'trueVal': 'Y'},
            'row': 'any',
            'col': 'any'
        }
    };
    
    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test interpeting a date using moment.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testInterpretStrDate = function(test)
{
    var testInput = [['Nope', '01/02/2013']];
    var expectedOutput = [['Nope', '2013-01-02T07:00:00.000Z']];
    var testOperation = {
        operation: 'interpretStr',
        param: {
            'dates': 'MM/DD/YYYY',
            'row': 'any',
            'col': 'any'
        }
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test interpeting string serailization of integer values.
 *
 * Test interpreting string seraialization of dataset integer values, converting
 * them to the corresponding integer values.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/ 
exports.testInterpretStrInteger = function(test)
{
    var testInput = [['0', '1', '2', 'a1']];
    var expectedOutput = [[0, 1, 2, 'a1']];
    var testOperation = {
        operation: 'interpretStr',
        param: {
            'numbers': true,
            'row': 'any',
            'col': 'any'
        }
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};

/**
 * Test interpeting string serailization of integer values on any column.
 *
 * Test interpreting string seraialization of dataset integer values, converting
 * them to the corresponding integer values. Interpret all columns but only a
 * specific row.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/ 
exports.testInterpretStrIntegerAnyCol = function(test)
{
    var testInput = [
        ['0', '1', '2', 'a1'],
        ['0', '1', '2', 'a2'],
    ];
    var expectedOutput = [
        ['0', '1', '2', 'a1'],
        [0, 1, 2, 'a2']
    ];
    var testOperation = {
        operation: 'interpretStr',
        param: {
            'numbers': true,
            'row': 1,
            'col': 'any'
        }
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test interpeting string serailization of integer values on any column.
 *
 * Test interpreting string seraialization of dataset integer values, converting
 * them to the corresponding integer values. Interpret all columns but only a
 * specific set of rows.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/ 
exports.testInterpretStrIntegerAnyColManyRows = function(test)
{
    var testInput = [
        ['0', '1', '2', 'a1'],
        ['0', '1', '2', 'a2'],
        ['0', '1', '2', 'a3']
    ];
    var expectedOutput = [
        ['0', '1', '2', 'a1'],
        [0, 1, 2, 'a2'],
        [0, 1, 2, 'a3']
    ];
    var testOperation = {
        operation: 'interpretStr',
        param: {
            'numbers': true,
            'row': [1,2],
            'col': 'any'
        }
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test interpeting string serailization of integer values on any row.
 *
 * Test interpreting string seraialization of dataset integer values, converting
 * them to the corresponding integer values. Interpret all row but only on
 * a specific column.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/ 
exports.testInterpretStrIntegerAnyRow = function(test)
{
    var testInput = [
        ['0', '1', '2', 'a1'],
        ['0', '1', '2', 'a1'],
    ];
    var expectedOutput = [
        [0, '1', '2', 'a1'],
        [0, '1', '2', 'a1'],
    ];
    var testOperation = {
        operation: 'interpretStr',
        param: {
            'numbers': true,
            'row': 'any',
            'col': 0
        }
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test interpeting string serailization of integer values on any row.
 *
 * Test interpreting string seraialization of dataset integer values, converting
 * them to the corresponding integer values. Interpret all rows but only on
 * specific columns.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/ 
exports.testInterpretStrIntegerAnyRowManyCols = function(test)
{
    var testInput = [
        ['0', '1', '2', 'a1'],
        ['0', '1', '2', 'a1'],
    ];
    var expectedOutput = [
        [0, '1', 2, 'a1'],
        [0, '1', 2, 'a1'],
    ];
    var testOperation = {
        operation: 'interpretStr',
        param: {
            'numbers': true,
            'row': 'any',
            'col': [0,2]
        }
    };

    simple_table_refine.refine(
        testOperation,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};


/**
 * Test running a series of operations in order.
 *
 * Test running a series of operations instead of a single operation refinement,
 * ensuring that the operations execute in the order listed.
 *
 * @param {nodeunit.test} test The test this routine is running under.
**/
exports.testManyOperationRefinement = function(test)
{
    var testInput = [
        ['0', '1', '2', '3'],
        ['4', '5', '6', '7']
    ];

    var expectedOutput = [
        ['0', '4'],
        [1, 5],
        ['2', '6'],
        ['3', '7']
    ];

    var testOperations = [
        {operation: 'transpose'},
        {operation: 'interpretStr', param: {'numbers': true, 'row': 1}}
    ];

    simple_table_refine.refine(
        testOperations,
        testInput,
        function (actualOutput) {
            test.deepEqual(actualOutput, expectedOutput);
            test.done();
        }
    );
};
