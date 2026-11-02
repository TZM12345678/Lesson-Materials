const connection = require('../config/db');

function createUser(values, callback) {
  const sql = 'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)';
  connection.query(sql, values, callback);
}

function findByCredentials(username, password, callback) {
  const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
  connection.query(sql, [username, password], callback);
}

function findById(userId, callback) {
  const sql = 'SELECT id, name, username, role FROM users WHERE id = ?';
  connection.query(sql, [userId], callback);
}

function findAll(callback) {
  const sql = 'SELECT id, name, username, role FROM users';
  connection.query(sql, callback);
}

function deleteById(userId, callback) {
  const sql = 'DELETE FROM users WHERE id = ?';
  connection.query(sql, [userId], callback);
}

module.exports = { createUser, findByCredentials, findById, findAll, deleteById };
