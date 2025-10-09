CREATE DATABASE IF NOT EXISTS estoque_db;
USE estoque_db;

CREATE TABLE IF NOT EXISTS produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  categoria VARCHAR(100) NOT NULL,
  quantidade INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS historico (
  id INT NOT NULL, -- mesmo ID do produto
  tipo ENUM('Cadastro','Baixa') NOT NULL,
  nome VARCHAR(100) NOT NULL,
  categoria VARCHAR(100),
  quantidade INT NOT NULL,
  data DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES produtos(id) -- vínculo com produtos
);