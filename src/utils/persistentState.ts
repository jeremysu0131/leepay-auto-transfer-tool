import dayjs from "dayjs";
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("./state.db");

db.serialize(function() {
  // Check and create
  db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='task'",
    function(selectError: any, row: any) {
      if (row !== undefined) {
        console.log("table exists.");
      } else {
        console.log("creating table");
        db.run(
          "CREATE TABLE task (taskID INT, platform TEXT, reason TEXT, createBy TEXT, createAt TEXT)",
          function(createError: any) {
            if (createError) console.log(createError);
          }
        );
      }
    }
  );
});

/**
 * Save task status in database
 */
export function saveTaskStatus(
  taskID: number,
  platform: string,
  reason: string,
  createBy: string
) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO task (taskID, platform, reason,createBy, createAt) VALUES (?, ?, ?, ?, ?)",
      [
        taskID,
        platform,
        reason,
        createBy,
        dayjs().format("YYYY-MM-DD hh:mm:ss")
      ],
      (error: any) => {
        if (error) return reject(error);
        resolve();
      }
    );
  });
}

/**
 * Get task status in database
 */
export function selectTaskStatus(taskID: number): Promise<[]> {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT taskID, platform, reason, createAt FROM task WHERE taskID = ?",
      [taskID],
      (error: any, rows: any) => {
        if (error) return reject(error);
        resolve(rows);
      }
    );
  });
}
