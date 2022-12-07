SELECT employee_id, first_name, last_name, name, title, salary, manager_id 
from employees
join 
(SELECT id AS employee_id, first_name, last_name, name AS department_name, title, salary, manager_id
FROM employees
JOIN 
(SELECT department_id, name, roles.id AS role_id, title, salary
FROM department
JOIN roles ON department.id = department_id) AS roles_table
ON employees.role_id = roles_table.role_id) 





