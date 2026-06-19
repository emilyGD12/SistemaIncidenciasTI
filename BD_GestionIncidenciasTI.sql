

DROP DATABASE gestion_accidentes_ti;

CREATE DATABASE gestion_incidencias_ti;

USE gestion_incidencias_ti;



CREATE TABLE Usuario (
    CI_IdUsuario INT AUTO_INCREMENT,
    CT_Nombre VARCHAR(100) NOT NULL,
    CT_Usuario VARCHAR(50) NOT NULL UNIQUE,
    CT_Contrasena VARCHAR(255) NOT NULL,
    CT_Rol ENUM('Solicitante', 'Tecnico') NOT NULL,
    CONSTRAINT PK_Usuario PRIMARY KEY (CI_IdUsuario)
);

CREATE TABLE Incidencia (
    CI_IdIncidencia INT AUTO_INCREMENT,
    CT_Titulo VARCHAR(100) NOT NULL,
    CT_Descripcion TEXT NOT NULL,
    CT_Prioridad ENUM('Baja', 'Media', 'Alta') NOT NULL,
    CT_Estado ENUM('Abierta', 'En Proceso', 'Resuelta') DEFAULT 'Abierta',
    CF_Fecha_Creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    CI_IdUsuario INT NOT NULL,
    CONSTRAINT PK_Incidencia PRIMARY KEY (CI_IdIncidencia),
    CONSTRAINT FK_Incidencia_x_Usuario 
        FOREIGN KEY (CI_IdUsuario) REFERENCES Usuario(CI_IdUsuario)
);

CREATE TABLE Comentario (
    CI_IdComentario INT AUTO_INCREMENT,
    CT_Observacion TEXT NOT NULL,
    CF_Fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    CI_IdIncidencia INT NOT NULL,
    CI_IdUsuario INT NOT NULL,
    CONSTRAINT PK_Comentario PRIMARY KEY (CI_IdComentario),
    CONSTRAINT FK_Comentario_X_Incidencia 
        FOREIGN KEY (CI_IdIncidencia) REFERENCES Incidencia(CI_IdIncidencia),
    CONSTRAINT FK_Comentario_X_Usuario 
        FOREIGN KEY (CI_IdUsuario) REFERENCES Usuario(CI_IdUsuario)
);