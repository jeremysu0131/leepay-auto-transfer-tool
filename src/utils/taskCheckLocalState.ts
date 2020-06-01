import dayjs from "dayjs";
import sqlite3 from "sqlite3";
let sqlite = sqlite3.verbose();
let db = new sqlite.Database("./state.db");

// TODO Refactor

db.serialize(function() {
  // Check and create
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='task'", (
    selectError,
    row
  ) => {
    if (row !== undefined) {
      console.log("table exists.");
    } else {
      console.log("creating table");
      db.run(
        "CREATE TABLE task (taskID INT, platform TEXT, reason TEXT, createBy TEXT, createAt TEXT)",
        function(createError) {
          if (createError) console.log(createError);
        }
      );
    }
  });
});

/**
 * Save task status in database
 */
export function saveTaskStatus(taskID: number, platform: string, reason: string, createBy: string) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO task (taskID, platform, reason,createBy, createAt) VALUES (?, ?, ?, ?, ?)",
      [taskID, platform, reason, createBy, dayjs().format("YYYY-MM-DD hh:mm:ss")],
      error => {
        if (error) return reject(error);
        resolve();
      }
    );
  });
}

/**
 * Get task status in database
 * @param {number} taskID
 * @returns {Promise<[]>}
 */
export function selectTaskStatus(taskID: number): Promise<[]> {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT taskID, platform, reason, createAt FROM task WHERE taskID = ?",
      [taskID],
      (error, rows:[]) => {
        if (error) return reject(error);
        resolve(rows);
      }
    );
  });
}
