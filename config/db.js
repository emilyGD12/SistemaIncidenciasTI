const mysql = require('mysql2');

const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gestion_incidencias_ti'
});

conexion.connect((error) => {
    if (error) {
        console.error('Error al conectar con MySQL:', error);
    } else {
        console.log('Conexión exitosa a la base de datos');
    }
});

module.exports = conexion;