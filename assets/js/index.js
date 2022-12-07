const inquirer = require('inquirer');
const mysql = require('mysql2');

const cTable = require('console.table');
const { response } = require('express');

const db = mysql.createConnection(
    {
        host: 'localhost',
        user: 'root',
        password: 'Blazoonie22!',
        database: 'employee_db'
    },
    console.log(`Connected to the employee_db database.`)
);

//Dropdown to choose options
const menu = {
    type: 'list',
    message: 'Please select from the following:',
    name: 'choice',
    choices: ['View all departments', 'View all roles', 'View all employees', 'Add a department', 'Add a role', 'Add an employee', 'Update an employee role', 'View employees by manager', 'View employees by department', 'Update employee manager', 'Quit']
};

//Calls function based on option choosed from menu
function displayMenu() {
    inquirer.prompt(menu).then(response => {
        switch (response.choice) {
            case 'View all departments':
                operate(viewDepartments);
                break;
            case 'View all roles':
                operate(viewRoles);
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
        }
    })

};

function operate(operation) {
    operation.apply();
}

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
        }];

    var departmentNames = queryResults.map(result => result.name);
    var departmentOptions = {
        type: 'list',
        message: 'Select your department',
        name: 'choice',
        choices: departmentNames
    }
    roleQuestions.push(departmentOptions);
    return roleQuestions;
};

function addRole() {
    db.query(`SELECT id, name FROM department`, function (err, queryResults) {
        var roleQuestions = getRoleQuestions(queryResults);
        inquirer.prompt(roleQuestions).then(inquirerResponse => {
            var departmentId = getDepartmentId(queryResults, inquirerResponse.choice);
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

function getDepartmentId(queryResults, departmentName) {
    return queryResults.filter(result => result.name === departmentName)[0].id;
}

function addEmployee() {
    db.query(`SELECT id, title FROM roles`, function (err, roleResults) {
        db.query(`SELECT id, CONCAT_WS(" ", first_name, last_name) AS manager_name FROM employees WHERE manager_id IS NULL`, function (err, managerResults) {
            var employeeQuestions = getEmployeeQuestions(roleResults, managerResults);
            inquirer.prompt(employeeQuestions).then(inquirerResponse => {
                var roleId = getRoleId(roleResults, inquirerResponse.roleChoice);
                var managerId = getManagerId(managerResults, inquirerResponse.managerChoice);
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
        }
    ]
    var roleTitles = roleResults.map(result => result.title);
    var titleOptions = {
        type: 'list',
        message: 'Select your role',
        name: 'roleChoice',
        choices: roleTitles
    }
    employeeQuestions.push(titleOptions);
    var managerNames = managerResults.map(result => result.manager_name);
    var managerOptions = {
        type: 'list',
        message: 'Select your manager',
        name: 'managerChoice',
        choices: managerNames
    }
    employeeQuestions.push(managerOptions);
    return employeeQuestions;
};

function getRoleId(roleResults, title) {
    return roleResults.filter(result => result.title === title)[0].id;
};

function getManagerId(managerResults, manager_name) {
    return managerResults.filter(result => result.manager_name === manager_name)[0].id;
};

function updateEmployeeRole() {
    db.query(`SELECT id, CONCAT_WS(" ", first_name, last_name) AS employee_name FROM employees`, function (err, employeeNameResults) {
        db.query(`SELECT id, title FROM roles`, function (err, updateRoleResults) {
            var updateEmployeeQuestions = getUpdateEmployeeQuestions(employeeNameResults, updateRoleResults);
            inquirer.prompt(updateEmployeeQuestions).then(inquirerResponse => {
                var roleId = getUpdateRoleId(updateRoleResults, inquirerResponse.titleChoice);
                var employeeId = getEmployeeId(employeeNameResults, inquirerResponse.nameChoice);
                let query = `UPDATE employees SET role_id = ? WHERE id = ?`
                db.query(query, [roleId, employeeId],
                    (err, rows) => {
                        if (err) throw err;
                        console.log(`Updated employee ${inquirerResponse.nameChoice} successfully in database`);
                    });
            });
        })

    })
};

function getUpdateRoleId(updateRoleResults, title) {
    return updateRoleResults.filter(result => result.title === title)[0].id;
};

function getEmployeeId(employeeNameResults, fullName) {
    return employeeNameResults.filter(result => result.employee_name === fullName)[0].id;
}

//Inquirer questions for update employee function
function getUpdateEmployeeQuestions(employeeNameResults, updateRoleResults) {
    var updateEmployeeQuestions = [];

    var employeeNames = employeeNameResults.map(result => result.employee_name);
    var employeeName = {
        type: 'list',
        message: `Which employee's role would you like to update?`,
        name: 'nameChoice',
        choices: employeeNames
    };
    updateEmployeeQuestions.push(employeeName);

    var roleOptions = updateRoleResults.map(result => result.title);
    var updateRoleOptions = {
        type: 'list',
        message: 'Which role would you like to assign?',
        name: 'titleChoice',
        choices: roleOptions
    };
    updateEmployeeQuestions.push(updateRoleOptions);
    return updateEmployeeQuestions;
};

function viewEmployeesByManager() {
    db.query(`SELECT id, CONCAT_WS(" ", first_name, last_name) AS manager_name FROM employees WHERE manager_id IS NULL`, function (err, viewByManagerResults) {
        var employeeByManagerQuestions = getEmployeeByManagerQuestions(viewByManagerResults);
        inquirer.prompt(employeeByManagerQuestions).then(inquirerResponse => {
            var managerId = getViewByManagerId(viewByManagerResults, inquirerResponse.managerChoice);
            let query = `SELECT id, first_name, last_name FROM employees WHERE manager_id = ?`
            db.query(query, managerId,
                (err, results) => displayResults(results));
        });
    })
};

//Inquirer questions for view employee by manager function
function getEmployeeByManagerQuestions(viewByManagerResults) {
    var viewByManagerQuestions = [];
    var managerNames = viewByManagerResults.map(result => result.manager_name);
    var managerOptions = {
        type: 'list',
        message: 'Select your manager',
        name: 'managerChoice',
        choices: managerNames
    }
    viewByManagerQuestions.push(managerOptions);
    return viewByManagerQuestions;
};

function getViewByManagerId(viewByManagerResults, managerName) {
    return viewByManagerResults.filter(result => result.manager_name === managerName)[0].id;
};

function viewEmployeesByDept() {
    db.query(`SELECT id, name FROM department`, function (err, employeeByDeptResults) {
        var employeeByDeptQuestions = getEmployeeByDeptQuestions(employeeByDeptResults);
        inquirer.prompt(employeeByDeptQuestions).then(inquirerResponse => {
            var deptName = getDeptName(employeeByDeptResults, inquirerResponse.deptChoice);
            let query = `SELECT employees.id, first_name, last_name, department.name AS department FROM employees 
                        JOIN roles
                        ON role_id = roles.id
                        JOIN department
                        ON department_id = department.id
                        WHERE department.name = ?`
            db.query(query, deptName,
                (err, results) => displayResults(results));
        })
    })
};

//Inquirer questions for view employee by department function
function getEmployeeByDeptQuestions(employeeByDeptResults) {
    var deptNames = employeeByDeptResults.map(result => result.name);
    var employeeByDeptQuestions = {
        type: 'list',
        message: 'Select your manager',
        name: 'deptChoice',
        choices: deptNames
    }
    return employeeByDeptQuestions;
};

function getDeptName(employeeByDeptResults, deptName) {
    return employeeByDeptResults.filter(result => result.name === deptName)[0].name;
}

function updateEmployeeManager() {
    db.query(`SELECT id, CONCAT_WS(" ", first_name, last_name) AS employee_name, manager_id FROM employees WHERE manager_id IS NOT NULL`, function (err, updateEmployeeManagerResults) {
        db.query(`SELECT id, CONCAT_WS(" ", first_name, last_name) AS manager_name FROM employees WHERE manager_id IS NULL`, function (err, updateEmployeeManagerResultsTwo) {
            db.query(`SELECT id, CONCAT_WS(" ", first_name, last_name) AS employee_name, manager_id FROM employees`, function (err, updateEmployeeManagerResultsThree) {
                var updateEmployeeManagerQuestions = getUpdateEmployeeManagerQuestions(updateEmployeeManagerResults, updateEmployeeManagerResultsTwo);
                inquirer.prompt(updateEmployeeManagerQuestions).then(inquirerResponse => {
                    var managerId = getUpdateManagerId(updateEmployeeManagerResultsThree, inquirerResponse.managerChoice);
                    var employeeId = getUpdateEmployeeId(updateEmployeeManagerResults, inquirerResponse.nameChoice);
                    let query = `UPDATE employees SET manager_id = ? WHERE id = ?;`
                    db.query(query, [managerId, employeeId],
                        (err, rows) => {
                            if (err) throw err;
                            console.log(`Updated employee manager for ${inquirerResponse.nameChoice} successfully in database`);
                        });
                })

            });
        })
    })
};

//Inquirer questions for update employee manager function
function getUpdateEmployeeManagerQuestions(updateEmployeeManagerResults, updateEmployeeManagerResultsTwo) {
    var updateEmployeeManagerQuestions = [];

    var employeeNames = updateEmployeeManagerResults.map(result => result.employee_name);
    var employeeName = {
        type: 'list',
        message: `Which employee's manager would you like to update?`,
        name: 'nameChoice',
        choices: employeeNames
    };
    updateEmployeeManagerQuestions.push(employeeName);

    var managerOptions = updateEmployeeManagerResultsTwo.map(result => result.manager_name);
    var updateManagerOptions = {
        type: 'list',
        message: 'Which manager would you like to assign?',
        name: 'managerChoice',
        choices: managerOptions
    };
    updateEmployeeManagerQuestions.push(updateManagerOptions);
    return updateEmployeeManagerQuestions;
};

function getUpdateManagerId(updateEmployeeManagerResultsThree, manager_name) {
    return updateEmployeeManagerResultsThree.filter(result => result.employee_name === manager_name)[0].id;
};

function getUpdateEmployeeId(updateEmployeeManagerResults, employee_name) {
    return updateEmployeeManagerResults.filter(result => result.employee_name === employee_name)[0].id;
};




displayMenu();