import { Request, Response } from 'express';
import { pool } from '../config/database';

const asTrimmedString = (value: any): string =>
  typeof value === 'string' ? value.trim() : '';

const isEmailValid = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const allowedStatuses = new Set(['new', 'viewed', 'in_work', 'ready']);

export const createRequest = async (req: Request, res: Response) => {
  const fullName = asTrimmedString(req.body?.full_name);
  const email = asTrimmedString(req.body?.email).toLowerCase();
  const address = asTrimmedString(req.body?.address);
  const details = asTrimmedString(req.body?.details);

  if (!fullName || !email || !address) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'full_name, email and address are required'
    });
  }

  if (!isEmailValid(email)) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'email is invalid'
    });
  }

  if ([fullName, email, address].some(v => v.length > 255)) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'full_name, email and address length must be <= 255'
    });
  }

  try {
    const [result]: any = await pool.query(
      'INSERT INTO repair_requests (full_name, email, address, details) VALUES (?, ?, ?, ?)',
      [fullName, email, address, details || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
};

export const getRequests = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT id, full_name, email, address, details, status, created_at FROM repair_requests ORDER BY created_at DESC'
    );
    res.json({  rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const status = asTrimmedString(req.body?.status);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'validation_error', message: 'id is invalid' });
  }

  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ error: 'validation_error', message: 'status is invalid' });
  }

  try {
    const [result]: any = await pool.query(
      'UPDATE repair_requests SET status = ? WHERE id = ?',
      [status, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'not_found' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
};