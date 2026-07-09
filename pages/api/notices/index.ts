import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const notices = await prisma.notice.findMany({
        orderBy: [
          { priority: 'asc' }, // Urgent is defined first in the schema enum, so 'asc' places it first.
          { publishDate: 'desc' }, // Order by newest publish date within each priority group.
        ],
      });
      return res.status(200).json(notices);
    } catch (error: any) {
      console.error('Failed to fetch notices:', error);
      return res.status(500).json({ error: 'Failed to fetch notices from database.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, body, category, priority, publishDate, imageUrl } = req.body;

      // 1. Validations
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required and cannot be empty.' });
      }
      if (title.length > 100) {
        return res.status(400).json({ error: 'Title cannot exceed 100 characters.' });
      }

      if (!body || typeof body !== 'string' || body.trim() === '') {
        return res.status(400).json({ error: 'Body is required and cannot be empty.' });
      }

      const validCategories = ['Exam', 'Event', 'General'];
      if (!category || !validCategories.includes(category)) {
        return res.status(400).json({ error: 'Category must be one of: Exam, Event, General.' });
      }

      const validPriorities = ['Normal', 'Urgent'];
      if (!priority || !validPriorities.includes(priority)) {
        return res.status(400).json({ error: 'Priority must be Normal or Urgent.' });
      }

      if (!publishDate) {
        return res.status(400).json({ error: 'Publish date is required.' });
      }
      const parsedDate = new Date(publishDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'A valid publish date must be provided.' });
      }

      // 2. Database Insert
      const newNotice = await prisma.notice.create({
        data: {
          title: title.trim(),
          body: body.trim(),
          category,
          priority: priority as 'Urgent' | 'Normal',
          publishDate: parsedDate,
          imageUrl: imageUrl || null,
        },
      });

      return res.status(201).json(newNotice);
    } catch (error: any) {
      console.error('Failed to create notice:', error);
      return res.status(500).json({ error: 'An error occurred while saving the notice.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed.` });
}
