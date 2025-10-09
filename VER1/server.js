import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import mysql from "mysql2";
import conexao from "./db/conexao.js";
import bodyParser from "body-parser";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();

app.use(cors());
app.use(bodyParser.json());
// Servir arquivos estáticos (HTML, CSS, JS, imagens)
app.use(express.static(path.join(__dirname, "public")));

const PORT = 6060;
// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});



// Servir arquivos estáticos (HTML, CSS, JS, imagens)
app.use(express.static(path.join(__dirname, "public")));

// ---------- ROTAS DE PÁGINAS ----------
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/estoque", (req, res) => res.sendFile(path.join(__dirname, "public", "estoque.html")));
app.get("/pesquisar", (req, res) => res.sendFile(path.join(__dirname, "public", "pesquisar.html")));
app.get("/cadastrar", (req, res) => res.sendFile(path.join(__dirname, "public", "cadastrar.html")));
app.get("/baixa", (req, res) => res.sendFile(path.join(__dirname, "public", "baixa.html")));
app.get("/historico", (req, res) => res.sendFile(path.join(__dirname, "public", "historico.html")));
app.get("/configuracao", (req, res) => res.sendFile(path.join(__dirname, "public", "configuracao.html")));

app.get("/api/estoque", (req, res) => {
  conexao.query("SELECT * FROM produtos", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ erro: "Erro no banco" });
    }
    res.json(results);
  });
});

//Cadastro de itens
app.post("/api/cadastrar", (req, res) => {
  const { nome, categoria, quantidade } = req.body;
  if (!nome || !categoria || quantidade == null) return res.status(400).json({ erro: "Dados inválidos" });

  conexao.query("SELECT * FROM produtos WHERE nome = ?", [nome], (err, results) => { if (err) return res.status(500).send({ erro: err.message });

    if (results.length > 0) {
      // Produto já existe → atualiza quantidade
      const produto = results[0];
      conexao.query(
        "UPDATE produtos SET quantidade = quantidade + ?, categoria = ? WHERE id = ?",
        [quantidade, categoria, produto.id],
        (err2) => {
          if (err2) return res.status(500).send({ erro: err2.message });

          // insere no histórico usando o mesmo id
          conexao.query(
            "INSERT INTO historico (id, tipo, nome, categoria, quantidade) VALUES (?, 'Cadastro', ?, ?, ?)",
            [produto.id, nome, categoria, quantidade],
            (err3) => {
              if (err3) return res.status(500).send({ erro: err3.message });
              res.json({ mensagem: "Produto atualizado (cadastro) com sucesso." });});});

      } else {
      // Produto não existe → insere novo
      conexao.query(
        "INSERT INTO produtos (nome, categoria, quantidade) VALUES (?, ?, ?)",
        [nome, categoria, quantidade],
        (err2, result) => {
          if (err2) return res.status(500).send({ erro: err2.message });

          const novoId = result.insertId; // pega o id do produto recém criado

          conexao.query(
            "INSERT INTO historico (id, tipo, nome, categoria, quantidade) VALUES (?, 'Cadastro', ?, ?, ?)",
            [novoId, nome, categoria, quantidade],
            (err3) => {
              if (err3) return res.status(500).send({ erro: err3.message });
              res.json({ mensagem: "Produto cadastrado com sucesso." });});});}
  });
});


// Dar baixa
app.post("/api/baixa", (req, res) => {
  const { nome, quantidade } = req.body;
  if (!nome || quantidade == null)
    return res.status(400).json({ erro: "Dados inválidos" });

  conexao.query("SELECT * FROM produtos WHERE nome = ?", [nome], (err, results) => {
    if (err) return res.status(500).send({ erro: err.message });
    if (results.length === 0) return res.status(404).json({ erro: "Produto não encontrado" });

    const produto = results[0];
    if (produto.quantidade < quantidade)
      return res.status(400).json({ erro: "Estoque insuficiente" });

    conexao.query(
      "UPDATE produtos SET quantidade = quantidade - ? WHERE id = ?",
      [quantidade, produto.id],
      (err2) => {
        if (err2) return res.status(500).send({ erro: err2.message });

        conexao.query(
          "INSERT INTO historico (id, tipo, nome, categoria, quantidade) VALUES (?, 'Baixa', ?, ?, ?)",
          [produto.id, produto.nome, produto.categoria, quantidade],
          (err3) => {
            if (err3) return res.status(500).send({ erro: err3.message });
            res.json({ mensagem: "Baixa registrada com sucesso." });
          }
        );
      }
    );
  });
});


// Histórico
app.get("/api/historico", (req, res) => {
  conexao.query("SELECT * FROM historico ORDER BY data DESC", (err, results) => {
    if (err) return res.status(500).send({ erro: err.message });
    res.json(results);
  });
});





//Verificador de Banco de Dados automatico
const tempConn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  multipleStatements: true,
});

// lê o conteúdo do schema.sql
const schema = fs.readFileSync("./db/schema.sql", "utf8");

// executa o script (cria banco + tabelas se não existirem)
tempConn.query(schema, (err) => {
  if (err) {
    console.error("❌ Erro ao criar banco de dados:", err);
  } else {
    console.log("✅ Banco de dados e tabelas verificados/criados!");
  }
  tempConn.end();
});
