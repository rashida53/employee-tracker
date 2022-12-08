const inquirer = require('inquirer');
const mysql = require('mysql2');

const cTable = require('console.table');

const db = mysql.createConnection(
    {
        host: 'localhost',
        user: 'root',
        password: 'Blazoonie22!',
        database: 'employee_db'
    },
    console.log("\r\n __                       _                         ___      _        _                    \r\n\/ _\\_   _ _ __   ___ _ __| |__   ___ _ __ ___      \/   \\__ _| |_ __ _| |__   __ _ ___  ___ \r\n\\ \\| | | | \'_ \\ \/ _ \\ \'__| \'_ \\ \/ _ \\ \'__\/ _ \\    \/ \/\\ \/ _` | __\/ _` | \'_ \\ \/ _` \/ __|\/ _ \\\r\n_\\ \\ |_| | |_) |  __\/ |  | | | |  __\/ | | (_) |  \/ \/_\/\/ (_| | || (_| | |_) | (_| \\__ \\  __\/\r\n\\__\/\\__,_| .__\/ \\___|_|  |_| |_|\\___|_|  \\___\/  \/___,\' \\__,_|\\__\\__,_|_.__\/ \\__,_|___\/\\___|\r\n         |_|                                                                               \r\n")
);

//Dropdown to choose options
const menu = {
    type: 'list',
    message: 'Please select from the following:',
    name: 'choice',
    pageSize: 20,
    choices: ['View all departments', 'View all roles', 'View all employees', 'Add a department', 'Add a role', 'Add an employee', 'Update an employee role', 'View employees by manager', 'View employees by department', 'Update employee manager', 'View utilized budget of a department', 'Delete department', 'Delete role', 'Delete employee', 'Quit']
};

//Calls function based on option choosed from menu
function displayMenu() {
    inquirer.prompt(menu).then(response => {
        switch (response.choice) {
            case 'View all departments':
                viewDepartments();
                break;
            case 'View all roles':
                viewRoles();
                break;
            case 'View all employees':
                viewEmployees();
                break;
            case 'Add a department':
                addDepartment();
                break;
            case 'Add a role':
                addRole();
                break;
            case 'Add an employee':
                addEmployee();
                break;
            case 'Update an employee role':
                updateEmployeeRole();
                break;
            case 'View employees by manager':
                viewEmployeesByManager();
                break;
            case 'View employees by department':
                viewEmployeesByDept();
                break;
            case 'Update employee manager':
                updateEmployeeManager();
                break;
            case 'View utilized budget of a department':
                viewUtilizedBudget();
                break;
            case 'Delete department':
                deleteDepartment();
                break;
            case 'Delete role':
                deleteRole();
                break;
            case 'Delete employee':
                deleteEmployee();
                break;
            case 'Quit':
                process.exit();
        }
    })

};

function displayResults(results) {
    console.log('\n');
    console.table(results);
    displayMenu();
}

function viewDepartments() {
    db.query(`SELECT * from department`, (err, results) => displayResults(results));
}

function viewRoles() {
    db.query(
        `SELECT roles.id, title, salary, department.name AS department_name from roles
        JOIN department
        ON department_id = department.id`, (err, results) => displayResults(results));
}

function viewEmployees() {
    db.query(
        `SELECT e.id, e.first_name, e.last_name, title, department.name AS department, salary, CONCAT_WS(" ", m.first_name, m.last_name) AS manager FROM employees e
        JOIN roles
        ON role_id = roles.id
        JOIN department
        ON department_id = department.id
        LEFT OUTER JOIN employees m
        ON e.manager_id = m.id`, (err, results) => displayResults(results)
    );
}


function addDepartment() {
    const deptQuestion = {
        type: 'input',
        message: 'Enter department name',
        name: 'department'
    }
    inquirer.prompt(deptQuestion).then(response => {
        let query = `INSERT INTO department(name) VALUES (?)`
        db.query(query, (response.department),
            (err, rows) => {
                if (err) throw err;
                console.log(`Added department ${response.department} successfully to database \n`);
                displayMenu();
            });
    })
}

//Inquirer questions for add role function
function getRoleQuestions(queryResults) {

    var roleQuestions = [
        {
            type: 'input',
            message: 'Enter your title',
            name: 'title'
        },
        {
            type: 'input',
            message: 'Enter your salary',
            name: 'salary'
        },
        getInquirerQuestion('Select your department', queryResults, result => result.name)
    ];

    return roleQuestions;
};

function addRole() {
    db.query(`SELECT id, name FROM department`, function (err, queryResults) {
        var roleQuestions = getRoleQuestions(queryResults);
        inquirer.prompt(roleQuestions).then(inquirerResponse => {
            var departmentId = extractId(queryResults, result => result.name === inquirerResponse.choice);
            let query = `INSERT INTO roles(title, salary, department_id) VALUES (?, ?, ?)`
            db.query(query, [inquirerResponse.title, inquirerResponse.salary, departmentId],
                (err, results) => {
                    if (err) throw err;
                    console.log(`Added role ${inquirerResponse.title} successfully to database \n`);
                    displayMenu();
                });
        });
    })
}

function addEmployee() {
    db.query(`SELECT id, title FROM roles`, function (err, roleResults) {
        db.query(`SELECT id, CONCAT_WS(" ", first_name, last_name) AS manager_name FROM employees WHERE manager_id IS NULL`, function (err, managerResults) {
            var employeeQuestions = getEmployeeQuestions(roleResults, managerResults);
            inquirer.prompt(employeeQuestions).then(inquirerResponse => {
                var roleId = extractId(roleResults, result => result.title === inquirerResponse.roleChoice);
                var managerId = extractId(managerResults, result => result.manager_name === inquirerResponse.managerChoice);
                let query = `INSERT INTO employees(first_name, last_name, manager_id, role_id) VALUES (?, ?, ?, ?)`
                db.query(query, [inquirerResponse.firstName, inquirerResponse.lastName, managerId, roleId],
                    (err, rows) => {
                        if (err) throw err;
                        console.log(`Added employee ${inquirerResponse.firstName + " " + inquirerResponse.lastName} successfully to database \n`);
                        displayMenu();
                    });
            });
        })

    })
};

//Inquirer questions for add employee function
function getEmployeeQuestions(roleResults, managerResults) {
    var employeeQuestions = [
        {
            type: 'input',
            message: 'Enter your first name',
            name: 'firstName'
        },
        {
            type: 'input',
            message: 'Enter your last name',
            name: 'lastName'
        },
        getInquirerQuestionWithChoice('Select your role', roleResults, result => result.title, 'roleChoice'),
        getInquirerQuestionWithChoice('Select your manager', managerResults, result => result.manager_name, 'managerChoice')
    ]

    return employeeQuestions;
};

function updateEmployeeRole() {
    db.query(`SELECT id, CONCAT_WS(" ", first_name, last_name) AS employee_name FROM employees`, function (err, employeeNameResults) {
        db.query(`SELECT id, title FROM roles`, function (err, updateRoleResults) {
            var updateEmployeeQuestions = [
                getInquirerQuestionWithChoice(`Which employee's role would you like to update?`, employeeNameResults, result => result.employee_name, 'employeeChoice'),
                getInquirerQuestionWithChoice(`Which role would you like to assign?`, updateRoleResults, result => result.title, 'titleChoice')
            ];
            inquirer.prompt(updateEmployeeQuestions).then(inquirerResponse => {
                var roleId = extractId(updateRoleResults, result => result.title === inquirerResponse.titleChoice);
                var employeeId = extractId(employeeNameResults, result => result.employee_name === inquirerResponse.employeeChoice);
                let query = `UPDATE employees SET role_id = ? WHERE id = ?`
                db.query(query, [roleId, employeeId],
                    (err, rows) => {
                        if (err) throw err;
                        console.log(`Updated employee ${inquirerResponse.employeeChoice} successfully in database`);
                        displayMenu();
                    });
            });
        })

    })
};

function viewEmployeesByManager() {
    db.query(`SELECT id, CONCAT_WS(" ", first_name, last_name) AS manager_name FROM employees WHERE manager_id IS NULL`, function (err, viewByManagerResults) {
        var employeeByManagerQuestions = getInquirerQuestion('Select manager', viewByManagerResults, result => result.manager_name);
        inquirer.prompt(employeeByManagerQuestions).then(inquirerResponse => {
            var managerId = extractId(viewByManagerResults, result => result.manager_name === inquirerResponse.choice);
            let query = `SELECT id, first_name, last_name FROM employees WHERE manager_id = ?`
            db.query(query, managerId,
                (err, results) => displayResults(results));
        });
    })
};

function viewEmployeesByDept() {
    db.query(`SELECT id, name FROM department`, function (err, employeeByDeptResults) {
        var employeeByDeptQuestions = getInquirerQuestion('Select your department', employeeByDeptResults, result => result.name);
        inquirer.prompt(employeeByDeptQuestions).then(inquirerResponse => {
            let query = `SELECT employees.id, first_name, last_name, department.name AS department FROM employees 
                        JOIN roles
                        ON role_id = roles.id
                        JOIN department
                        ON department_id = department.id
                        WHERE department.name = ?`
            db.query(query, inquirerResponse.choice,
                (err, results) => displayResults(results));
        })
    })
};

function updateEmployeeManager() {
    db.query(`SELECT id, CONCAT_WS(" ", first_name, last_name) AS employee_name, manager_id FROM employees WHERE manager_id IS NOT NULL`, function (err, updateEmployeeManagerResults) {
        db.query(`SELECT id, CONCAT_WS(" ", first_name, last_name) AS manager_name FROM employees WHERE manager_id IS NULL`, function (err, updateEmployeeManagerResultsTwo) {
            db.query(`SELECT id, CONCAT_WS(" ", first_name, last_name) AS employee_name, manager_id FROM employees`, function (err, updateEmployeeManagerResultsThree) {
                var updateEmployeeManagerQuestions = [
                    getInquirerQuestionWithChoice(`Which employee's manager would you like to update?`, updateEmployeeManagerResults, result => result.employee_name, 'employeeChoice'),
                    getInquirerQuestionWithChoice(`Which manager would you like to assign?`, updateEmployeeManagerResultsTwo, result => result.manager_name, 'managerChoice')
                ];
                inquirer.prompt(updateEmployeeManagerQuestions).then(inquirerResponse => {
                    var managerId = extractId(updateEmployeeManagerResultsThree, result => result.employee_name === inquirerResponse.managerChoice);
                    var employeeId = extractId(updateEmployeeManagerResults, result => result.employee_name === inquirerResponse.employeeChoice);
                    let query = `UPDATE employees SET manager_id = ? WHERE id = ?;`
                    db.query(query, [managerId, employeeId],
                        (err, rows) => {
                            if (err) throw err;
                            console.log(`Updated employee manager for ${inquirerResponse.employeeChoice} successfully in database`);
                            displayMenu();
                        });
                })
            });
        })
    })
};

function viewUtilizedBudget() {
    db.query(`SELECT id, name FROM department`, function (err, utilizedBudgetResults) {
        var selectDepartmentQuestions = getInquirerQuestion('Select department to view', utilizedBudgetResults, result => result.name);
        inquirer.prompt(selectDepartmentQuestions).then(inquirerResponse => {
            let query = `SELECT department.name AS department, sum(salary) AS budget FROM employees 
                        JOIN roles
                        ON role_id = roles.id
                        JOIN department
                        ON department_id = department.id
                        WHERE department.name = ?`
            db.query(query, inquirerResponse.choice,
                (err, results) => displayResults(results));
        })
    })
};

function deleteDepartment() {
    db.query(`SELECT id, name FROM department`, function (err, deleteDepartmentResults) {
        var deleteDepartmentQuestions = getInquirerQuestion('Select department to delete', deleteDepartmentResults, result => result.name);
        inquirer.prompt(deleteDepartmentQuestions).then(inquirerResponse => {
            let query = `DELETE FROM department where name = ?`
            db.query(query, inquirerResponse.choice, (err, rows) => {
                if (err)
                    throw err;
                console.log(`Deleted ${inquirerResponse.deptChoice} department successfully from database`);
                displayMenu();
            });
        })
    })
};

function deleteRole() {
    db.query(`SELECT id, title FROM roles`, function (err, deleteRoleResults) {
        var deleteRoleQuestions = getInquirerQuestion('Select role to delete', deleteRoleResults, result => result.title);
        inquirer.prompt(deleteRoleQuestions).then(inquirerResponse => {
            let query = `DELETE FROM roles where title = ?`
            db.query(query, inquirerResponse.choice,
                (err, rows) => {
                    if (err) throw err;
                    console.log(`Deleted ${inquirerResponse.choice} successfully from database`);
                    displayMenu();
                });
        })
    })
};

function deleteEmployee() {
    db.query(`SELECT id, CONCAT_WS(" ", first_name, last_name) AS employee_name FROM employees`, function (err, deleteEmployeeResults) {
        var deleteEmployeeQuestions = getInquirerQuestion('Select employee to delete', deleteEmployeeResults, result => result.employee_name);
        inquirer.prompt(deleteEmployeeQuestions).then(inquirerResponse => {
            var employeeId = extractId(deleteEmployeeResults, result => result.employee_name === inquirerResponse.choice)
            let query = `DELETE FROM employees WHERE id = ?`
            db.query(query, employeeId,
                (err, rows) => {
                    if (err) throw err;
                    console.log(`Deleted employee ${inquirerResponse.choice} successfully from database`);
                    displayMenu();
                });
        });
    })
};

function getInquirerQuestionWithChoice(question, results, extractValueFunction, choiceName) {
    var choices = results.map(extractValueFunction);
    var inquirerQuestion = {
        type: 'list',
        message: question,
        name: choiceName,
        choices: choices
    }
    return inquirerQuestion;
};

function getInquirerQuestion(question, results, extractValueFunction) {
    var choices = results.map(extractValueFunction);
    var inquirerQuestion = {
        type: 'list',
        message: question,
        name: 'choice',
        choices: choices
    }
    return inquirerQuestion;
};

function extractId(results, filterFunction) {
    return results.filter(filterFunction)[0].id;
};


displayMenu();