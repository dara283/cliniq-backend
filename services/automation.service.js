const cron = require('node-cron');
const db = require('../config/db');
const queueService = require('./queue.service');

// Every minute: refresh queue positions + estimated waits for all active departments
const startQueueAutomation = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const { rows } = await db.query(`
        SELECT DISTINCT department_id FROM queue
        WHERE status IN ('Waiting', 'InProgress')
      `);
      for (const row of rows) {
        await queueService.refreshQueueStateForDepartment(row.department_id);
      }
      if (rows.length > 0) {
        console.log(`[CRON] Refreshed ${rows.length} department queue(s)`);
      }
    } catch (err) {
      console.error('[CRON] Queue refresh failed:', err.message);
    }
  });

  // Every 5 minutes: mark stale InProgress visits (>2hrs) as timed out
  cron.schedule('*/5 * * * *', async () => {
    try {
      const { rows } = await db.query(`
        UPDATE queue SET status = 'Completed'
        WHERE status = 'InProgress'
          AND service_start < NOW() - INTERVAL '2 hours'
        RETURNING queue_id
      `);
      if (rows.length > 0) {
        console.log(`[CRON] Auto-completed ${rows.length} stale queue entries`);
      }
    } catch (err) {
      console.error('[CRON] Stale cleanup failed:', err.message);
    }
  });

  console.log('[CRON] Queue automation started');
};

module.exports = { startQueueAutomation };
