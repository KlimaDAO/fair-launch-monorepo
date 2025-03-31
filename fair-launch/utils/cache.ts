'use server';

export const cache = new Map(); // Simple in-memory cache
export const CACHE_EXPIRATION_TIME = 2 * 60 * 1000; // 2 minutes in milliseconds
