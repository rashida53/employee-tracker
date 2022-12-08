INSERT INTO department(name)
VALUES  ("Sales"),
        ("Engineering"),
        ("Finance"),
        ("Legal");
   

INSERT INTO roles(title, salary, department_id)
VALUES ("Sales Lead", 100000, 1),
    ("Salesperson", 80000, 1),
    ("Lead Engineer", 150000, 2),
    ("Software Engineer", 120000, 2),
    ("Account Manager", 160000, 3),
    ("Accountant", 125000, 3),
    ("Legal Team Lead", 250000, 4),
    ("Lawyer", 190000, 4);


INSERT INTO employees(first_name, last_name, manager_id, role_id)
VALUES ("Bruce", "Wayne", NULL, 1),
("Tony", "Stark", NULL, 3), 
("Clark", "Kent", NULL, 5), 
("Scott", "Summers", NULL, 7), 
("Barry", "Allen", 1, 2),
("Diana", "Prince", 2, 4),
("Selina", "Kyle", 3, 6),
("Natasha", "Romanoff", 4, 8),
("Peter", "Parker", 2, 4),
("Pepper", "Potts", 1, 2),
("Gwen", "Stacy", 4, 8);
