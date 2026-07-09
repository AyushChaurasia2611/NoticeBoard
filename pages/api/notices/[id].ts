import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Notice ID is required.' });
  }

  // Check if notice exists
  try {
    const existingNotice = await prisma.notice.findUnique({
      where: { id },
    });

    if (!existingNotice) {
      return res.status(404).json({ error: 'Notice not found.' });
    }

    if (req.method === 'PUT') {
      const { title, body, category, priority, publishDate, imageUrl } = req.body;

      // Validations
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

      // Update in DB
      const updatedNotice = await prisma.notice.update({
        where: { id },
        data: {
          title: title.trim(),
          body: body.trim(),
          category,
          priority: priority as 'Urgent' | 'Normal',
          publishDate: parsedDate,
          imageUrl: imageUrl || null,
        },
      });

      return res.status(200).json(updatedNotice);
    }

    if (req.method === 'DELETE') {
      await prisma.notice.delete({
        where: { id },
      });
      return res.status(200).json({ message: 'Notice deleted successfully.' });
    }

  } catch (error: any) {
    console.error(`Error in /api/notices/[id] handler for ${req.method}:`, error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed.` });
}
