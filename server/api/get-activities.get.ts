import { defineEventHandler, getQuery } from 'h3';
import { db } from '../db';
import { activityLogs, people } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { requireAuth } from '../utils/auth';

export default defineEventHandler(async (event) => {
    requireAuth(event);
    const { familyId, limit } = getQuery(event);

    if (!familyId) {
        return { data: [] };
    }

    try {
        const limitNum = limit ? Number(limit) : 20;

        // Fetch activity logs with performer name by joining people table via userId
        const data = await db.execute(sql`
            SELECT
                al.id,
                al.action_type AS "actionType",
                al.details,
                al.performed_by AS "performedBy",
                al.reason,
                al.created_at AS "createdAt",
                al.person_id AS "personId",
                al.family_id AS "familyId",
                COALESCE(p.first_name || ' ' || p.last_name, 'Unknown') AS "performerName"
            FROM activity_logs al
            LEFT JOIN people p ON p.user_id = al.performed_by
            WHERE al.family_id = ${Number(familyId)}
            ORDER BY al.created_at DESC
            LIMIT ${limitNum}
        `);

        return { data: data.rows || data };
    } catch (error) {
        return { data: [], error };
    }
});
